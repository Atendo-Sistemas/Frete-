import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import webpush from 'web-push';
import { 
  User, 
  FreightStatus, 
  Freight, 
  Tenant, 
  Driver, 
  Vehicle, 
  FormDefinition, 
  FormResponse,
  UserRole,
  WhatsAppConfig,
  TripExpenseReport
} from '../src/types';

export const apiRouter = Router();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYPE5NjhF0';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'test_private_vapid_key_abcdef1234567890';

try {
  webpush.setVapidDetails(
    'mailto:contato@portaldefretes.com.br',
    publicVapidKey,
    privateVapidKey
  );
} catch (e) {
  console.warn('VAPID setup warning:', e);
}

export async function sendPushNotificationToAll(payload: any) {
  const subs = (db as any).pushSubscriptions || [];
  for (let i = subs.length - 1; i >= 0; i--) {
    const sub = subs[i];
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        subs.splice(i, 1);
      }
    }
  }
}

// Middleware to extract user from Authorization header or session demo token
export interface AuthenticatedRequest extends Request {
  user?: User;
  tenant?: Tenant | null;
}

const VALID_STATUS_TRANSITIONS: Record<FreightStatus, FreightStatus[]> = {
  RASCUNHO: ['PUBLICADO', 'CANCELADO'],
  PUBLICADO: ['DISPONIVEL', 'RESERVADO', 'CANCELADO'],
  DISPONIVEL: ['RESERVADO', 'CANCELADO'],
  RESERVADO: ['EM_COLETA', 'DISPONIVEL', 'CANCELADO'],
  EM_COLETA: ['COLETADO', 'CANCELADO'],
  COLETADO: ['EM_TRANSITO', 'CANCELADO'],
  EM_TRANSITO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: []
};

// Auth / Identity Middleware
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.split(' ')[1];
  } else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
  }

  // If no auth provided, default to Super Admin or first company admin for convenience in dev
  if (!userId) {
    req.user = db.users[0]; // superadmin
  } else {
    const foundUser = db.users.find(u => u.id === userId || u.email === userId);
    if (foundUser) {
      req.user = foundUser;
    } else {
      req.user = db.users[0];
    }
  }

  if (req.user && req.user.tenantId) {
    req.tenant = db.tenants.find(t => t.id === req.user?.tenantId) || null;
  } else {
    req.tenant = null;
  }

  next();
}

// Apply auth middleware to all /api routes
apiRouter.use(authMiddleware);

/* =========================================================================
   1. AUTH & USER IDENTITY
   ========================================================================= */

// Get current logged-in user profile
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  let driverProfile: Driver | undefined;
  let driverVehicles: Vehicle[] = [];

  if (req.user.role === 'MOTORISTA' && req.user.driverId) {
    driverProfile = db.drivers.find(d => d.id === req.user?.driverId);
    if (driverProfile) {
      driverVehicles = db.vehicles.filter(v => v.driverId === driverProfile?.id);
    }
  }

  res.json({
    user: req.user,
    tenant: req.tenant,
    driver: driverProfile,
    vehicles: driverVehicles,
    availableDemoAccounts: db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId,
      driverId: u.driverId
    }))
  });
});

// Login endpoint
apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, role, password } = req.body;
  
  let targetUser = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (!targetUser && role) {
    targetUser = db.users.find(u => u.role === role);
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Check if pending approval
  if (targetUser.status === 'PENDENTE') {
    return res.status(403).json({ error: 'Seu cadastro foi realizado com sucesso, mas ainda não foi liberado. Aguarde a aprovação do Super Administrador.' });
  }

  // Validate password if present on the user (and it's not a demo switcher shortcut without password)
  if (targetUser.password && password && targetUser.password !== password) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    tenantName: targetUser.tenantId ? db.tenants.find(t => t.id === targetUser?.tenantId)?.name : 'Plataforma Global',
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: targetUser.id,
    details: `Login realizado com sucesso via perfil ${targetUser.role}`
  });

  res.json({
    user: targetUser,
    token: targetUser.id
  });
});

// Active WhatsApp Login OTPs Map
const activeOTPs = new Map<string, { code: string; expiresAt: number }>();

// Pending registration OTPs Map
const pendingRegistrations = new Map<string, {
  code: string;
  expiresAt: number;
  companyName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  password?: string;
}>();

// Request WhatsApp OTP for Login
apiRouter.post('/auth/request-otp', async (req: AuthenticatedRequest, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' });
  }

  // Clean phone string to match digits
  const cleanPhone = phone.replace(/\D/g, '');
  const targetUser = db.users.find(u => {
    const cleanUserPhone = u.phone.replace(/\D/g, '');
    return cleanUserPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanUserPhone);
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'Nenhum usuário cadastrado com este telefone.' });
  }

  if (targetUser.status === 'PENDENTE') {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo Super Administrador.' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  activeOTPs.set(cleanPhone, { code, expiresAt });

  const tenantId = targetUser.tenantId || 'tenant-translog-01';
  const config = db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig;
  const messageBody = `🚚 [ELO LOG] Seu código de acesso para login via WhatsApp é: *${code}*. Válido por 5 minutos. Não compartilhe com ninguém.`;

  // Send via WhatsApp API Gateway
  const waResult = await sendToWhatsAppGateway(config, {
    number: cleanPhone,
    body: messageBody,
    externalKey: `otp-${Date.now()}`
  });

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'OTP_REQUEST',
    entity: 'User',
    entityId: targetUser.id,
    details: `Código OTP enviado via WhatsApp API para o telefone ${phone} [${waResult.success ? 'SUCESSO' : 'FALHA'}]`
  });

  res.json({
    success: true,
    message: `Código de login enviado com sucesso via WhatsApp para ${phone}!`
  });
});

// Verify WhatsApp OTP for Login
apiRouter.post('/auth/verify-otp', (req: AuthenticatedRequest, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const activeOtp = activeOTPs.get(cleanPhone);

  if (!activeOtp) {
    return res.status(400).json({ error: 'Nenhum código ativo encontrado para este telefone. Solicite um novo código.' });
  }

  if (Date.now() > activeOtp.expiresAt) {
    activeOTPs.delete(cleanPhone);
    return res.status(400).json({ error: 'Código de verificação expirou (validade de 5 minutos).' });
  }

  if (activeOtp.code !== code) {
    return res.status(400).json({ error: 'Código de verificação inválido.' });
  }

  // Successful verification
  activeOTPs.delete(cleanPhone);

  const targetUser = db.users.find(u => {
    const cleanUserPhone = u.phone.replace(/\D/g, '');
    return cleanUserPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanUserPhone);
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  targetUser.lastLoginAt = new Date().toISOString();

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: targetUser.id,
    userName: targetUser.name,
    userRole: targetUser.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: targetUser.id,
    details: `Login realizado com sucesso via WhatsApp OTP`
  });

  res.json({
    user: targetUser,
    token: targetUser.id
  });
});

// Register Company (Tenant + Admin User in PENDENTE state)
apiRouter.post('/auth/register-company', (req: AuthenticatedRequest, res: Response) => {
  const { companyName, cnpj, responsibleName, email, phone, password } = req.body;

  if (!companyName || !cnpj || !responsibleName || !email || !phone || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  // Check if email already registered
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
  }

  // Check if CNPJ already registered
  const cnpjExists = db.tenants.some(t => t.cnpj === cnpj);
  if (cnpjExists) {
    return res.status(400).json({ error: 'Este CNPJ já está cadastrado no sistema.' });
  }

  // Generate verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  const key = email.toLowerCase();
  pendingRegistrations.set(key, {
    code,
    expiresAt,
    companyName,
    cnpj,
    responsibleName,
    email,
    phone,
    password
  });

  // Simulation: write simulated SMS/WhatsApp and email into global notification store
  db.addNotification({
    tenantId: null,
    title: '📧 Verificação de E-mail',
    message: `Enviado para ${email}: Olá ${responsibleName}, use o código ${code} para verificar seu cadastro na Elo Log.`,
    type: 'SISTEMA',
    userId: 'user-superadmin'
  });

  db.addNotification({
    tenantId: null,
    title: '💬 Verificação de WhatsApp',
    message: `Enviado para ${phone}: Olá ${responsibleName}, use o código ${code} para confirmar seu cadastro na Elo Log.`,
    type: 'SISTEMA',
    userId: 'user-superadmin'
  });

  res.json({
    success: true,
    message: 'Código de verificação enviado para o e-mail e WhatsApp do responsável!',
    demoCode: code
  });
});

// Verify Registration Code and complete creation in PENDENTE state
apiRouter.post('/auth/verify-registration', (req: AuthenticatedRequest, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'E-mail e código de verificação são obrigatórios.' });
  }

  const key = email.toLowerCase();
  const pending = pendingRegistrations.get(key);

  if (!pending) {
    return res.status(404).json({ error: 'Nenhum cadastro pendente encontrado para este e-mail.' });
  }

  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(key);
    return res.status(400).json({ error: 'O código de verificação expirou. Faça o cadastro novamente.' });
  }

  if (pending.code !== code) {
    return res.status(400).json({ error: 'Código de verificação incorreto.' });
  }

  // Success! Create actual database structures in PENDENTE state
  const tenantId = `tenant-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();

  const newTenant: Tenant = {
    id: tenantId,
    name: pending.companyName,
    legalName: pending.companyName,
    cnpj: pending.cnpj,
    email: pending.email,
    phone: pending.phone,
    zipCode: '01000-000',
    address: 'Av. Industrial',
    number: '123',
    neighborhood: 'Distrito Industrial',
    city: 'São Paulo',
    state: 'SP',
    status: 'PENDENTE', // Crucial: Starts as PENDENTE
    plan: 'BASICO',
    planLimits: {
      maxUsers: 5,
      maxDrivers: 20,
      maxFreightsMonthly: 50,
      customForms: false,
      exportReports: true,
      prioritySupport: false
    },
    createdAt: now,
    updatedAt: now
  };

  const newUser: User = {
    id: userId,
    tenantId: tenantId,
    name: pending.responsibleName,
    email: pending.email,
    phone: pending.phone,
    role: 'EMPRESA_SUPER_ADMIN', // Owner of the tenant
    status: 'PENDENTE', // Crucial: Starts as PENDENTE
    password: pending.password,
    createdAt: now
  };

  db.tenants.push(newTenant);
  db.users.push(newUser);

  // Generate Super Admin Alert
  db.addNotification({
    tenantId: null,
    title: '🏢 Novo Cadastro de Empresa',
    message: `A empresa "${pending.companyName}" se cadastrou e aguarda sua aprovação no Painel Global.`,
    type: 'SISTEMA',
    userId: 'user-superadmin'
  });

  db.addAuditLog({
    tenantId,
    userId,
    userName: pending.responsibleName,
    userRole: 'EMPRESA_SUPER_ADMIN',
    action: 'REGISTRO_EMPRESA',
    entity: 'Tenant',
    entityId: tenantId,
    details: `Empresa ${pending.companyName} cadastrada e verificada por código. Aguardando aprovação do Super Admin.`
  });

  pendingRegistrations.delete(key);

  res.json({
    success: true,
    message: 'Cadastro realizado com sucesso! Suas informações foram verificadas. Aguarde a liberação do Super Administrador para acessar a plataforma.'
  });
});

// Register new Driver from public portal
apiRouter.post('/auth/register-driver', (req: AuthenticatedRequest, res: Response) => {
  const { 
    name, 
    email, 
    phone, 
    cpf, 
    rg, 
    birthDate, 
    zipCode, 
    address, 
    city, 
    state, 
    cnh, 
    cnhCategory, 
    cnhExpiresAt,
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    vehiclePlate,
    vehicleRenavam,
    capacityKg,
    bodyType,
    tenantId
  } = req.body;

  if (!name || !email || !phone || !cpf || !cnh) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const assignedTenantId = tenantId || db.tenants[0].id;
  const now = new Date().toISOString();

  // Create User
  const newUserId = `user-driver-${Date.now()}`;
  const newDriverId = `driver-${Date.now()}`;
  const newVehicleId = `vehicle-${Date.now()}`;

  const newUser: User = {
    id: newUserId,
    tenantId: assignedTenantId,
    name,
    email,
    phone,
    role: 'MOTORISTA',
    status: 'ATIVO',
    driverId: newDriverId,
    lastLoginAt: now,
    createdAt: now
  };

  const newDriver: Driver = {
    id: newDriverId,
    userId: newUserId,
    tenantId: assignedTenantId,
    name,
    cpf,
    rg: rg || '',
    birthDate: birthDate || '1990-01-01',
    phone,
    email,
    zipCode: zipCode || '15000-000',
    address: address || '',
    city: city || 'São José do Rio Preto',
    state: state || 'SP',
    cnh,
    cnhCategory: cnhCategory || 'C',
    cnhExpiresAt: cnhExpiresAt || '2028-12-31',
    status: 'DISPONIVEL',
    rating: 5.0,
    completedTrips: 0,
    createdAt: now
  };

  const newVehicle: Vehicle = {
    id: newVehicleId,
    driverId: newDriverId,
    tenantId: assignedTenantId,
    type: vehicleType || 'TRUCK',
    brand: vehicleBrand || 'Mercedes-Benz',
    model: vehicleModel || 'Atego',
    year: Number(vehicleYear) || 2022,
    plate: vehiclePlate || 'ABC1D23',
    renavam: vehicleRenavam || '00123456789',
    capacityKg: Number(capacityKg) || 12000,
    bodyType: bodyType || 'BAU',
    status: 'ATIVO',
    createdAt: now
  };

  db.users.push(newUser);
  db.drivers.push(newDriver);
  db.vehicles.push(newVehicle);

  db.addAuditLog({
    tenantId: assignedTenantId,
    userId: newUserId,
    userName: name,
    userRole: 'MOTORISTA',
    action: 'CADASTRO_MOTORISTA',
    entity: 'Driver',
    entityId: newDriverId,
    details: `Novo motorista auto-cadastrado com veículo ${vehicleType} (${vehiclePlate})`
  });

  res.status(201).json({
    user: newUser,
    driver: newDriver,
    vehicle: newVehicle,
    token: newUserId
  });
});

/* =========================================================================
   2. TENANTS & SAAS MANAGEMENT (Super Admin & Company Admins)
   ========================================================================= */

// List tenants
apiRouter.get('/tenants', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.tenants);
  }
  // Company users only see their own tenant
  const tenant = db.tenants.find(t => t.id === req.user?.tenantId);
  res.json(tenant ? [tenant] : []);
});

// Create tenant (Super Admin only)
apiRouter.post('/tenants', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Admin pode criar empresas' });
  }

  const { name, legalName, cnpj, email, phone, city, state, plan } = req.body;
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: name || 'Nova Transportadora',
    legalName: legalName || name,
    cnpj: cnpj || '00.000.000/0001-00',
    email: email || '',
    phone: phone || '',
    zipCode: req.body.zipCode || '01000-000',
    address: req.body.address || 'Av. Principal',
    number: req.body.number || '100',
    neighborhood: req.body.neighborhood || 'Centro',
    city: city || 'São Paulo',
    state: state || 'SP',
    status: 'ATIVA',
    plan: plan || 'PROFISSIONAL',
    planLimits: {
      maxUsers: plan === 'EMPRESARIAL' ? 100 : plan === 'PROFISSIONAL' ? 25 : 5,
      maxDrivers: plan === 'EMPRESARIAL' ? 500 : plan === 'PROFISSIONAL' ? 100 : 20,
      maxFreightsMonthly: plan === 'EMPRESARIAL' ? 2000 : plan === 'PROFISSIONAL' ? 500 : 50,
      customForms: plan !== 'BASICO',
      exportReports: true,
      prioritySupport: plan === 'EMPRESARIAL'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tenants.push(newTenant);

  db.addAuditLog({
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CRIACAO_EMPRESA',
    entity: 'Tenant',
    entityId: newTenant.id,
    details: `Empresa ${newTenant.name} criada com plano ${newTenant.plan}`
  });

  res.status(201).json(newTenant);
});

apiRouter.put('/tenants/:id', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.tenantId !== req.params.id) {
    return res.status(403).json({ error: 'Sem permissão para editar esta empresa' });
  }

  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada' });

  const { name, legalName, cnpj, email, phone, zipCode, address, number, neighborhood, city, state, plan, status } = req.body;
  if (name) tenant.name = name;
  if (legalName) tenant.legalName = legalName;
  if (cnpj) tenant.cnpj = cnpj;
  if (email) tenant.email = email;
  if (phone) tenant.phone = phone;
  if (zipCode) tenant.zipCode = zipCode;
  if (address) tenant.address = address;
  if (number) tenant.number = number;
  if (neighborhood) tenant.neighborhood = neighborhood;
  if (city) tenant.city = city;
  if (state) tenant.state = state;
  if (plan) {
    tenant.plan = plan;
    tenant.planLimits = {
      maxUsers: plan === 'EMPRESARIAL' ? 100 : plan === 'PROFISSIONAL' ? 25 : 5,
      maxDrivers: plan === 'EMPRESARIAL' ? 500 : plan === 'PROFISSIONAL' ? 100 : 20,
      maxFreightsMonthly: plan === 'EMPRESARIAL' ? 2000 : plan === 'PROFISSIONAL' ? 500 : 50,
      customForms: plan !== 'BASICO',
      exportReports: true,
      prioritySupport: plan === 'EMPRESARIAL'
    };
  }
  if (status) {
    tenant.status = status;
    // Auto-approve associated users when the tenant/company is approved
    if (status === 'ATIVA') {
      db.users.forEach(u => {
        if (u.tenantId === tenant.id && u.status === 'PENDENTE') {
          u.status = 'ATIVO';
        }
      });
    }
  }
  tenant.updatedAt = new Date().toISOString();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ATUALIZAR_EMPRESA',
    entity: 'Tenant',
    entityId: tenant.id,
    details: `Empresa ${tenant.name} atualizada`
  });

  res.json(tenant);
});

apiRouter.delete('/tenants/:id', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Admin pode excluir empresas' });
  }

  const index = db.tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Empresa não encontrada' });

  if (db.tenants.length <= 1) {
    return res.status(400).json({ error: 'Não é possível excluir a última empresa do sistema' });
  }

  const tenant = db.tenants[index];
  db.tenants.splice(index, 1);

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'EXCLUIR_EMPRESA',
    entity: 'Tenant',
    entityId: tenant.id,
    details: `Empresa ${tenant.name} excluída`
  });

  res.json({ success: true, message: 'Empresa excluída com sucesso' });
});

/* =========================================================================
   3. USERS MANAGEMENT
   ========================================================================= */

apiRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.users);
  }
  // Company scoped
  const tenantUsers = db.users.filter(u => u.tenantId === req.user?.tenantId);
  res.json(tenantUsers);
});

apiRouter.post('/users', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, role, tenantId } = req.body;
  const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? (tenantId || db.tenants[0].id) : req.user?.tenantId;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    tenantId: targetTenantId || null,
    name,
    email,
    phone: phone || '',
    role: role || 'USUARIO',
    status: 'ATIVO',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  db.addAuditLog({
    tenantId: targetTenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CRIACAO_USUARIO',
    entity: 'User',
    entityId: newUser.id,
    details: `Criado usuário ${newUser.name} com perfil ${newUser.role}`
  });

  res.status(201).json(newUser);
});

apiRouter.put('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Security check: only Super Admin or Admin of same tenant, or user editing their own profile
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isSelf = req.user?.id === user.id;
  const isSameTenantAdmin = req.user?.role === 'ADMIN' && req.user?.tenantId === user.tenantId;

  if (!isSuperAdmin && !isSelf && !isSameTenantAdmin) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este usuário' });
  }

  const { name, email, phone, role, status, password } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (password) user.password = password;

  // Only admins can change role and status
  if ((isSuperAdmin || isSameTenantAdmin) && role) {
    user.role = role;
  }
  if ((isSuperAdmin || isSameTenantAdmin) && status) {
    user.status = status;
  }

  user.updatedAt = new Date().toISOString();

  // If this user is also a driver, sync their name, email, and phone
  if (user.driverId) {
    const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
    if (driver) {
      if (name) driver.name = name;
      if (email) driver.email = email;
      if (phone) driver.phone = phone;
    }
  }

  db.addAuditLog({
    tenantId: user.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZAR_USUARIO',
    entity: 'User',
    entityId: user.id,
    details: `Usuário ${user.name} atualizado com sucesso`
  });

  res.json(user);
});

apiRouter.delete('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const targetUser = db.users[index];

  // Prevent deleting yourself
  if (req.user?.id === targetUser.id) {
    return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário logado' });
  }

  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  const isSameTenantAdmin = req.user?.role === 'ADMIN' && req.user?.tenantId === targetUser.tenantId;

  if (!isSuperAdmin && !isSameTenantAdmin) {
    return res.status(403).json({ error: 'Você não tem permissão para excluir este usuário' });
  }

  db.users.splice(index, 1);

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_USUARIO',
    entity: 'User',
    entityId: targetUser.id,
    details: `Usuário ${targetUser.name} (${targetUser.email}) excluído`
  });

  res.json({ success: true, message: 'Usuário excluído com sucesso' });
});

// Update own profile
apiRouter.put('/auth/profile', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const { name, email, phone, password } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (password) user.password = password;

  user.updatedAt = new Date().toISOString();

  // If driver, sync driver info
  let updatedDriver: Driver | undefined;
  if (user.driverId) {
    const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
    if (driver) {
      if (name) driver.name = name;
      if (email) driver.email = email;
      if (phone) driver.phone = phone;
      if (req.body.address) driver.address = req.body.address;
      if (req.body.city) driver.city = req.body.city;
      if (req.body.state) driver.state = req.body.state;
      if (req.body.zipCode) driver.zipCode = req.body.zipCode;
      updatedDriver = driver;
    }
  }

  db.addAuditLog({
    tenantId: user.tenantId || undefined,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'ATUALIZAR_PERFIL',
    entity: 'User',
    entityId: user.id,
    details: `Perfil de usuário atualizado pelo próprio titular`
  });

  res.json({
    success: true,
    user,
    driver: updatedDriver
  });
});

/* =========================================================================
   4. DRIVERS & VEHICLES MANAGEMENT
   ========================================================================= */

apiRouter.get('/drivers', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.drivers);
  }
  // Scoped to tenant or drivers registered in current company
  const drivers = db.drivers.filter(d => d.tenantId === req.user?.tenantId);
  res.json(drivers);
});

apiRouter.put('/drivers/:id', (req: AuthenticatedRequest, res: Response) => {
  const driver = db.drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Motorista não encontrado' });

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && driver.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este motorista pertence a outra empresa.' });
  }

  const { name, phone, cpf, rg, birthDate, zipCode, address, city, state, cnh, cnhCategory, cnhExpiresAt, status } = req.body;
  if (name) driver.name = name;
  if (phone) driver.phone = phone;
  if (cpf) driver.cpf = cpf;
  if (rg) driver.rg = rg;
  if (birthDate) driver.birthDate = birthDate;
  if (zipCode) driver.zipCode = zipCode;
  if (address) driver.address = address;
  if (city) driver.city = city;
  if (state) driver.state = state;
  if (cnh) driver.cnh = cnh;
  if (cnhCategory) driver.cnhCategory = cnhCategory;
  if (cnhExpiresAt) driver.cnhExpiresAt = cnhExpiresAt;
  if (status) driver.status = status;

  db.addAuditLog({
    tenantId: driver.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZAR_MOTORISTA',
    entity: 'Driver',
    entityId: driver.id,
    details: `Motorista ${driver.name} atualizado`
  });

  res.json(driver);
});

apiRouter.get('/vehicles', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.vehicles);
  }
  const vehicles = db.vehicles.filter(v => v.tenantId === req.user?.tenantId);
  res.json(vehicles);
});

/* =========================================================================
   5. FREIGHTS MANAGEMENT (CRUD, Filter, Concurrency Acceptance, State Machine)
   ========================================================================= */

// List freights with tenant isolation & driver eligibility filters
apiRouter.get('/freights', (req: AuthenticatedRequest, res: Response) => {
  const { status, originCity, destinationCity, vehicleType, onlyMine } = req.query;

  let list = db.freights;

  // Tenant scoping:
  // - SUPER_ADMIN sees all
  // - MOTORISTA sees published/disponível freights within tenant network + freights assigned to them
  // - Company users (EMPRESA_SUPER_ADMIN, ADMIN, etc.) see their own tenant freights
  if (req.user?.role === 'SUPER_ADMIN') {
    // all
  } else if (req.user?.role === 'MOTORISTA') {
    const driverId = req.user.driverId;
    if (onlyMine === 'true') {
      list = list.filter(f => f.assignedDriverId === driverId);
    } else {
      // Driver sees:
      // 1. All DISPONIVEL or PUBLICADO freights for their tenant (or network)
      // 2. Freights assigned to them
      list = list.filter(f => 
        (f.tenantId === req.user?.tenantId && ['DISPONIVEL', 'PUBLICADO'].includes(f.status)) ||
        f.assignedDriverId === driverId
      );
    }
  } else {
    // Company staff
    list = list.filter(f => f.tenantId === req.user?.tenantId);
  }

  // Filters
  if (status) {
    list = list.filter(f => f.status === status);
  }
  if (originCity) {
    list = list.filter(f => f.origin.city.toLowerCase().includes((originCity as string).toLowerCase()));
  }
  if (destinationCity) {
    list = list.filter(f => f.destination.city.toLowerCase().includes((destinationCity as string).toLowerCase()));
  }
  if (vehicleType) {
    list = list.filter(f => f.requirements.vehicleType === vehicleType);
  }

  // Sort newest first
  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

// Get Freight by ID
apiRouter.get('/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(f => f.id === req.params.id);
  if (!freight) {
    return res.status(404).json({ error: 'Frete não encontrado' });
  }

  // Security check: ensure tenant match
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.tenantId !== freight.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado a este frete' });
  }

  // Attach associated forms responses
  const formResponses = db.formResponses.filter(r => r.freightId === freight.id);

  res.json({
    ...freight,
    formResponses
  });
});

// Create new Freight
apiRouter.post('/freights', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'MOTORISTA') {
    return res.status(403).json({ error: 'Motoristas não possuem permissão para cadastrar fretes' });
  }

  const tenantId = req.user?.role === 'SUPER_ADMIN' ? (req.body.tenantId || db.tenants[0].id) : req.user?.tenantId;
  const tenant = db.tenants.find(t => t.id === tenantId);

  const {
    origin,
    destination,
    cargo,
    requirements,
    payment,
    publishImmediately,
    distanceKm,
    customData
  } = req.body;

  if (!origin?.city || !origin?.state || !destination?.city || !destination?.state || !payment?.price) {
    return res.status(400).json({ error: 'Origem, destino e valor são obrigatórios' });
  }

  const initialStatus: FreightStatus = publishImmediately ? 'DISPONIVEL' : 'RASCUNHO';
  const now = new Date().toISOString();
  const nextSeq = db.freights.length + 1;
  const code = `FRT-2026-${String(nextSeq).padStart(4, '0')}`;

  const newFreight: Freight = {
    id: `freight-${Date.now()}`,
    code,
    tenantId: tenantId!,
    tenantName: tenant?.name || 'Transportadora',
    origin: {
      zipCode: origin.zipCode || '15000-000',
      address: origin.address || 'Endereço de Coleta',
      number: origin.number || 'S/N',
      neighborhood: origin.neighborhood || 'Industrial',
      city: origin.city,
      state: origin.state,
      date: origin.date || new Date().toISOString().split('T')[0],
      timeWindow: origin.timeWindow || '08:00 às 17:00',
      contactName: origin.contactName,
      contactPhone: origin.contactPhone
    },
    destination: {
      zipCode: destination.zipCode || '01000-000',
      address: destination.address || 'Endereço de Entrega',
      number: destination.number || 'S/N',
      neighborhood: destination.neighborhood || 'Comercial',
      city: destination.city,
      state: destination.state,
      date: destination.date || new Date().toISOString().split('T')[0],
      timeWindow: destination.timeWindow || '08:00 às 18:00',
      contactName: destination.contactName,
      contactPhone: destination.contactPhone
    },
    distanceKm: Number(distanceKm) || 450,
    cargo: {
      description: cargo?.description || 'Carga geral',
      type: cargo?.type || 'GERAL',
      weightKg: Number(cargo?.weightKg) || 8000,
      volumeCount: Number(cargo?.volumeCount) || 10,
      dimensions: cargo?.dimensions,
      requiresInsurance: cargo?.requiresInsurance ?? true,
      notes: cargo?.notes
    },
    requirements: {
      vehicleType: requirements?.vehicleType || 'TRUCK',
      bodyTypeRequired: requirements?.bodyTypeRequired || 'BAU',
      minCapacityKg: Number(requirements?.minCapacityKg) || 8000,
      helperRequired: requirements?.helperRequired || false,
      trackerRequired: requirements?.trackerRequired ?? true,
      cnhMinCategory: requirements?.cnhMinCategory || 'C'
    },
    payment: {
      price: Number(payment.price),
      paymentMethod: payment.paymentMethod || 'PIX',
      tollIncluded: payment.tollIncluded ?? true,
      advancePercentage: payment.advancePercentage || 70,
      notes: payment.notes
    },
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        changedByUserId: req.user!.id,
        changedByName: req.user!.name,
        notes: publishImmediately ? 'Frete criado e publicado imediatamente' : 'Rascunho criado'
      }
    ],
    createdByUserId: req.user!.id,
    createdByName: req.user!.name,
    createdAt: now,
    updatedAt: now,
    customData
  };

  db.freights.unshift(newFreight);

  db.addAuditLog({
    tenantId: tenantId || undefined,
    tenantName: tenant?.name,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: publishImmediately ? 'CRIACAO_E_PUBLICACAO_FRETE' : 'CRIACAO_RASCUNHO_FRETE',
    entity: 'Freight',
    entityId: newFreight.id,
    details: `Criou frete ${newFreight.code}: ${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} por R$ ${newFreight.payment.price.toFixed(2)}`
  });

  // If published, notify matching drivers in tenant
  if (publishImmediately) {
    const eligibleDrivers = db.drivers.filter(d => d.tenantId === tenantId);
    eligibleDrivers.forEach(d => {
      db.addNotification({
        tenantId,
        userId: d.userId,
        freightId: newFreight.id,
        type: 'FRETE_DISPONIVEL',
        title: '🚚 Novo frete disponível!',
        message: `${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    });

    sendPushNotificationToAll({
      title: '🚚 Novo Frete Disponível na Elo Log!',
      body: `${newFreight.origin.city}/${newFreight.origin.state} ➡️ ${newFreight.destination.city}/${newFreight.destination.state} | R$ ${newFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      url: '/'
    }).catch(console.error);
  }

  res.status(201).json(newFreight);
});

// Update freight details (only while in draft or available)
apiRouter.put('/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const freight = db.freights.find(f => f.id === req.params.id);
  if (!freight) return res.status(404).json({ error: 'Frete não encontrado' });

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este frete pertence a outra empresa.' });
  }

  if (['RESERVADO', 'EM_COLETA', 'COLETADO', 'EM_TRANSITO', 'ENTREGUE', 'FINALIZADO'].includes(freight.status)) {
    return res.status(400).json({ error: 'Não é possível editar frete que já foi reservado ou iniciado' });
  }

  Object.assign(freight, req.body, { updatedAt: new Date().toISOString() });

  db.addAuditLog({
    tenantId: freight.tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'EDICAO_FRETE',
    entity: 'Freight',
    entityId: freight.id,
    details: `Editou dados do frete ${freight.code}`
  });

  res.json(freight);
});

/* =========================================================================
   6. ATOMIC FREIGHT ACCEPTANCE (CONCURRENCY LOCK & GUARANTEE)
   ========================================================================= */

apiRouter.post('/freights/:id/accept', async (req: AuthenticatedRequest, res: Response) => {
  const freightId = req.params.id;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (user.role !== 'MOTORISTA') {
    return res.status(403).json({ error: 'Apenas usuários com perfil Motorista podem aceitar fretes' });
  }

  const driver = db.drivers.find(d => d.id === user.driverId || d.userId === user.id);
  if (!driver) {
    return res.status(400).json({ error: 'Perfil de motorista não configurado para este usuário' });
  }

  const vehicle = db.vehicles.find(v => v.driverId === driver.id);

  // Acquire atomic lock on freightId to guarantee transactional concurrency
  const result = await db.withLock(`freight-accept-${freightId}`, async () => {
    const freight = db.freights.find(f => f.id === freightId);
    
    if (!freight) {
      return { success: false, status: 404, error: 'Frete não encontrado' };
    }

    // Strict state check: Must be DISPONIVEL or PUBLICADO
    if (freight.status !== 'DISPONIVEL' && freight.status !== 'PUBLICADO') {
      return { 
        success: false, 
        status: 409, 
        error: `Frete indisponível para aceite. Status atual: ${freight.status}. Outro motorista pode ter aceitado primeiro.` 
      };
    }

    if (freight.assignedDriverId) {
      return { 
        success: false, 
        status: 409, 
        error: 'Este frete já foi reservado por outro motorista.' 
      };
    }

    const now = new Date().toISOString();

    // Assign driver and update status to RESERVADO
    freight.status = 'RESERVADO';
    freight.assignedDriverId = driver.id;
    freight.assignedDriverName = driver.name;
    freight.assignedDriverPhone = driver.phone;
    freight.assignedVehiclePlate = vehicle?.plate || 'Não inf.';
    freight.assignedVehicleModel = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo padrão';
    freight.assignedAt = now;
    freight.updatedAt = now;

    freight.statusHistory.push({
      status: 'RESERVADO',
      timestamp: now,
      changedByUserId: user.id,
      changedByName: driver.name,
      notes: `Frete aceito e reservado pelo motorista ${driver.name} (Veículo: ${freight.assignedVehiclePlate})`
    });

    // Notify Company Admins
    const companyAdmins = db.users.filter(u => u.tenantId === freight.tenantId && ['EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(u.role));
    companyAdmins.forEach(admin => {
      db.addNotification({
        tenantId: freight.tenantId,
        userId: admin.id,
        freightId: freight.id,
        type: 'FRETE_ACEITO',
        title: `✅ Frete #${freight.code} aceito!`,
        message: `O motorista ${driver.name} aceitou o frete de ${freight.origin.city}/${freight.origin.state} para ${freight.destination.city}/${freight.destination.state}.`
      });
    });

    // Notify the Driver
    db.addNotification({
      tenantId: freight.tenantId,
      userId: user.id,
      freightId: freight.id,
      type: 'FRETE_ACEITO',
      title: '🎉 Frete confirmado para você!',
      message: `Você reservou com sucesso o frete #${freight.code} no valor de R$ ${freight.payment.price.toFixed(2)}.`
    });

    // Audit Log
    db.addAuditLog({
      tenantId: freight.tenantId,
      tenantName: freight.tenantName,
      userId: user.id,
      userName: driver.name,
      userRole: 'MOTORISTA',
      action: 'ACEITE_FRETE_TRANSACIONAL',
      entity: 'Freight',
      entityId: freight.id,
      details: `Motorista ${driver.name} (CPF: ${driver.cpf}) aceitou e reservou o frete ${freight.code}`
    });

    return { success: true, freight };
  });

  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({
    message: 'Frete aceito com sucesso.',
    freight: result.freight
  });
});

/* =========================================================================
   7. STATE MACHINE TRANSITION (EM_COLETA, COLETADO, EM_TRANSITO, ENTREGUE, etc.)
   ========================================================================= */

apiRouter.post('/freights/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { newStatus, notes, location } = req.body as { newStatus: FreightStatus; notes?: string; location?: string };
  const freight = db.freights.find(f => f.id === req.params.id);

  if (!freight) {
    return res.status(404).json({ error: 'Frete não encontrado' });
  }

  // Security check: ensure authorized to update status (driver assigned or same company tenant)
  if (req.user?.role !== 'SUPER_ADMIN') {
    if (req.user?.role === 'MOTORISTA') {
      if (freight.assignedDriverId !== req.user.driverId) {
        return res.status(403).json({ error: 'Acesso não autorizado. Este frete não está atribuído a você.' });
      }
    } else if (freight.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Acesso não autorizado a este frete.' });
    }
  }

  const currentStatus = freight.status;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return res.status(400).json({ 
      error: `Transição inválida: Não é permitido mudar de '${currentStatus}' para '${newStatus}'. Transições permitidas: ${allowedTransitions.join(', ')}` 
    });
  }

  const now = new Date().toISOString();
  freight.status = newStatus;
  freight.updatedAt = now;

  if (newStatus === 'EM_COLETA') freight.startedAt = now;
  if (newStatus === 'COLETADO') freight.collectedAt = now;
  if (newStatus === 'EM_TRANSITO') freight.inTransitAt = now;
  if (newStatus === 'ENTREGUE') freight.deliveredAt = now;
  if (newStatus === 'FINALIZADO') freight.completedAt = now;
  if (newStatus === 'CANCELADO') {
    freight.cancelledAt = now;
    freight.cancelReason = notes || 'Cancelado pelo operador';
  }

  freight.statusHistory.push({
    status: newStatus,
    timestamp: now,
    changedByUserId: req.user!.id,
    changedByName: req.user!.name,
    notes: notes || `Status atualizado para ${newStatus}`,
    location
  });

  // Notify relevant parties
  const targetUserId = req.user?.role === 'MOTORISTA' 
    ? db.users.find(u => u.tenantId === freight.tenantId && u.role === 'ADMIN')?.id 
    : db.users.find(u => u.driverId === freight.assignedDriverId)?.id;

  if (targetUserId) {
    db.addNotification({
      tenantId: freight.tenantId,
      userId: targetUserId,
      freightId: freight.id,
      type: 'STATUS_ATUALIZADO',
      title: `📦 Status do frete #${freight.code} atualizado`,
      message: `Novo status: ${newStatus}${notes ? ` - ${notes}` : ''}`
    });
  }

  db.addAuditLog({
    tenantId: freight.tenantId,
    tenantName: freight.tenantName,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: `STATUS_${newStatus}`,
    entity: 'Freight',
    entityId: freight.id,
    details: `Transição de ${currentStatus} para ${newStatus}${location ? ` (Local: ${location})` : ''}`
  });

  res.json(freight);
});

/* =========================================================================
   8. DYNAMIC FORM BUILDER & FORM RESPONSES
   ========================================================================= */

// List forms for tenant
apiRouter.get('/forms', (req: AuthenticatedRequest, res: Response) => {
  const { triggerEvent } = req.query;
  let forms = db.forms;

  if (req.user?.role !== 'SUPER_ADMIN') {
    forms = forms.filter(f => f.tenantId === req.user?.tenantId);
  }

  if (triggerEvent) {
    forms = forms.filter(f => f.triggerEvent === triggerEvent && f.active);
  }

  res.json(forms);
});

// Create new form definition
apiRouter.post('/forms', (req: AuthenticatedRequest, res: Response) => {
  if (['MOTORISTA', 'USUARIO'].includes(req.user?.role || '')) {
    return res.status(403).json({ error: 'Permissão insuficiente para criar formulários' });
  }

  const { title, description, category, triggerEvent, fields, tenantId } = req.body;
  const targetTenantId = req.user?.role === 'SUPER_ADMIN' ? (tenantId || db.tenants[0].id) : req.user?.tenantId;

  if (!title || !fields || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'Título e campos do formulário são obrigatórios' });
  }

  const newForm: FormDefinition = {
    id: `form-${Date.now()}`,
    tenantId: targetTenantId!,
    title,
    description: description || '',
    category: category || 'CHECKLIST_COLETA',
    triggerEvent: triggerEvent || 'MANUAL',
    fields,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.forms.push(newForm);

  db.addAuditLog({
    tenantId: targetTenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CRIACAO_FORMULARIO',
    entity: 'FormDefinition',
    entityId: newForm.id,
    details: `Formulário '${newForm.title}' criado com ${newForm.fields.length} campos`
  });

  res.status(201).json(newForm);
});

// Submit or Update Form Response (Supports Saving Partial / Retirada / Final Entrega)
apiRouter.post('/forms/responses', (req: AuthenticatedRequest, res: Response) => {
  const { responseId, formId, freightId, answers, stage, isDraft } = req.body;
  const form = db.forms.find(f => f.id === formId);

  if (!form) {
    return res.status(404).json({ error: 'Formulário não encontrado' });
  }

  // Security check: ensure associated freight belongs to user's tenant or assigned driver
  if (freightId) {
    const freight = db.freights.find(f => f.id === freightId);
    if (freight) {
      if (req.user?.role !== 'SUPER_ADMIN') {
        if (req.user?.role === 'MOTORISTA') {
          if (freight.assignedDriverId !== req.user.driverId) {
            return res.status(403).json({ error: 'Acesso não autorizado. Este frete não está atribuído a você.' });
          }
        } else if (freight.tenantId !== req.user?.tenantId) {
          return res.status(403).json({ error: 'Acesso não autorizado a este frete.' });
        }
      }
    }
  }

  // Check if updating an existing response by ID or by freightId + formId
  let existingResponse: FormResponse | undefined;
  if (responseId) {
    existingResponse = db.formResponses.find(r => r.id === responseId);
  } else if (freightId && formId) {
    existingResponse = db.formResponses.find(r => r.freightId === freightId && r.formId === formId);
  }

  const now = new Date().toISOString();

  if (existingResponse) {
    // IMMUTABILITY RULE: If origin was already signed and saved, preserve origin answers and signature
    const prevAnswers = existingResponse.answers || {};
    const originAlreadySigned = Boolean(prevAnswers.origem?.assinado && prevAnswers.origem?.signatureImage);

    let updatedAnswers = {
      ...prevAnswers,
      ...(answers || {})
    };

    if (originAlreadySigned) {
      // Keep locked origin fields strictly untouched
      updatedAnswers.talaoNumber = prevAnswers.talaoNumber || updatedAnswers.talaoNumber;
      updatedAnswers.cliente = prevAnswers.cliente || updatedAnswers.cliente;
      updatedAnswers.clienteEmail = prevAnswers.clienteEmail || updatedAnswers.clienteEmail;
      updatedAnswers.clienteTelefone = prevAnswers.clienteTelefone || updatedAnswers.clienteTelefone;
      updatedAnswers.retirada = prevAnswers.retirada || updatedAnswers.retirada;
      updatedAnswers.veiculo = prevAnswers.veiculo || updatedAnswers.veiculo;
      updatedAnswers.documentos = prevAnswers.documentos || updatedAnswers.documentos;
      updatedAnswers.avarias = prevAnswers.avarias || updatedAnswers.avarias;
      updatedAnswers.equipamentos = prevAnswers.equipamentos || updatedAnswers.equipamentos;
      updatedAnswers.origem = prevAnswers.origem || updatedAnswers.origem;
      updatedAnswers.condutor = prevAnswers.condutor || updatedAnswers.condutor;
      updatedAnswers.condutorTelefone = prevAnswers.condutorTelefone || updatedAnswers.condutorTelefone;
    }

    // Update existing response
    existingResponse.answers = updatedAnswers;
    if (stage) existingResponse.stage = stage;
    if (isDraft !== undefined) existingResponse.isDraft = isDraft;
    existingResponse.updatedAt = now;

    db.addAuditLog({
      tenantId: form.tenantId,
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: isDraft ? 'RASCUNHO_FORMULARIO' : 'ATUALIZACAO_FORMULARIO',
      entity: 'FormResponse',
      entityId: existingResponse.id,
      details: `${isDraft ? 'Salvo rascunho de progresso' : 'Atualizado formulário'} '${form.title}' (Etapa: ${stage || 'Andamento'})${freightId ? ` para o frete #${freightId}` : ''}`
    });

    return res.json(existingResponse);
  }

  const newResponse: FormResponse = {
    id: `resp-${Date.now()}`,
    formId,
    formTitle: form.title,
    tenantId: form.tenantId,
    freightId,
    driverId: req.user?.driverId,
    filledByUserId: req.user!.id,
    filledByName: req.user!.name,
    stage: stage || (isDraft ? 'RETIRADA_INICIADA' : 'COMPLETO'),
    isDraft: isDraft || false,
    answers: answers || {},
    createdAt: now,
    updatedAt: now
  };

  db.formResponses.push(newResponse);

  // Update freight response counter
  if (freightId) {
    const freight = db.freights.find(f => f.id === freightId);
    if (freight) {
      freight.formResponsesCount = (freight.formResponsesCount || 0) + 1;
    }
  }

  db.addAuditLog({
    tenantId: form.tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: isDraft ? 'RASCUNHO_FORMULARIO' : 'RESPOSTA_FORMULARIO',
    entity: 'FormResponse',
    entityId: newResponse.id,
    details: `${isDraft ? 'Iniciou e salvou etapa de retirada' : 'Respondeu e finalizou formulário'} '${form.title}'${freightId ? ` para o frete #${freightId}` : ''}`
  });

  res.status(201).json(newResponse);
});

// Helper to format phone number for the Omnichannel Gateway API
function formatPhoneForWhatsApp(rawPhone: string): string {
  let cleaned = (rawPhone || '').replace(/\D/g, '');
  if (!cleaned) return '';
  // If Brazilian number without country code (10 or 11 digits), prepend 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

// Function to call the external WhatsApp API Gateway matching the Postman specification
async function sendToWhatsAppGateway(config: WhatsAppConfig, payload: {
  number: string;
  body: string;
  externalKey?: string;
  mediaUrl?: string;
  useButtonApi?: boolean;
  buttons?: Array<{ id: string; text: string }>;
}): Promise<{ success: boolean; data?: any; message: string; rawResponse?: any }> {
  const cleanNumber = formatPhoneForWhatsApp(payload.number);
  const extKey = payload.externalKey || `ext-${Date.now()}`;

  if (!config.baseUrl || !config.token) {
    return {
      success: true,
      message: 'Notificação processada em modo de demonstração. Configure a URL e o Token Bearer da API para envio em tempo real.',
      data: { 
        simulated: true, 
        recipient: cleanNumber,
        externalKey: extKey,
        body: payload.body 
      }
    };
  }

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');

  let endpointUrl = cleanBaseUrl;
  let requestBody: any;

  if (payload.useButtonApi && payload.buttons && payload.buttons.length > 0) {
    endpointUrl = `${cleanBaseUrl}/apiplus`;
    requestBody = {
      number: cleanNumber,
      contents: {
        type: 'button',
        body: {
          text: payload.body
        },
        action: {
          buttons: payload.buttons.map((b, idx) => ({
            type: 'reply',
            reply: {
              id: b.id || String(idx + 1),
              title: b.text.slice(0, 20)
            }
          }))
        }
      }
    };
  } else if (payload.mediaUrl) {
    requestBody = {
      body: payload.body,
      number: cleanNumber,
      externalKey: extKey,
      mediaUrl: payload.mediaUrl
    };
  } else {
    // Standard SendMessageAPIText (Postman collection item "SendMessageAPIText")
    requestBody = {
      body: payload.body,
      number: cleanNumber,
      externalKey: extKey
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Gateway WhatsApp retornou erro (HTTP ${response.status}): ${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}`,
        rawResponse: responseData
      };
    }

    return {
      success: true,
      message: 'Mensagem transmitida com sucesso para o canal WhatsApp.',
      data: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro na comunicação com o Gateway (${endpointUrl}): ${error.message || error}`
    };
  }
}

// 1. Get WhatsApp Gateway Configuration
apiRouter.get('/integrations/whatsapp/config', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão exclusiva do Super Admin do Elo Log.' });
  }

  const tenantId = req.user?.tenantId || 'tenant-translog-01';
  let config = db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig;

  // Mask token partially if non-admin or for safety
  const safeConfig = {
    ...config,
    tokenMasked: config.token ? `${config.token.substring(0, 10)}...${config.token.substring(config.token.length - 8)}` : ''
  };

  res.json(safeConfig);
});

// 2. Save / Update WhatsApp Gateway Configuration
apiRouter.post('/integrations/whatsapp/config', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão exclusiva do Super Admin do Elo Log.' });
  }

  const { baseUrl, token, defaultChannelNumber, isActive, autoNotifyChecklist, autoNotifyFreightStatus } = req.body;
  const tenantId = req.user?.tenantId || 'tenant-translog-01';

  const existingConfig = db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig;

  const newConfig: WhatsAppConfig = {
    baseUrl: baseUrl !== undefined ? baseUrl.trim() : existingConfig.baseUrl,
    token: token !== undefined ? token.trim() : existingConfig.token,
    defaultChannelNumber: defaultChannelNumber || existingConfig.defaultChannelNumber,
    isActive: isActive !== undefined ? isActive : existingConfig.isActive,
    autoNotifyChecklist: autoNotifyChecklist !== undefined ? autoNotifyChecklist : existingConfig.autoNotifyChecklist,
    autoNotifyFreightStatus: autoNotifyFreightStatus !== undefined ? autoNotifyFreightStatus : existingConfig.autoNotifyFreightStatus,
    lastTestedAt: existingConfig.lastTestedAt,
    lastTestStatus: existingConfig.lastTestStatus,
    lastTestMessage: existingConfig.lastTestMessage
  };

  db.whatsappConfigs.set(tenantId, newConfig);
  if (req.user?.role === 'SUPER_ADMIN') {
    db.globalWhatsAppConfig = { ...newConfig };
  }

  db.addAuditLog({
    tenantId: req.user?.tenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CONFIG_WHATSAPP',
    entity: 'WhatsAppGateway',
    entityId: `wa-config-${tenantId}`,
    details: `Atualizou configurações do Gateway WhatsApp (Base URL: ${newConfig.baseUrl || 'Vazio'})`
  });

  res.json({ success: true, config: newConfig });
});

// 3. Test WhatsApp Gateway Connection
apiRouter.post('/integrations/whatsapp/test', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão exclusiva do Super Admin do Elo Log.' });
  }

  const { phone, message, baseUrl, token } = req.body;
  const tenantId = req.user?.tenantId || 'tenant-translog-01';
  const savedConfig = db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig;

  const testConfig: WhatsAppConfig = {
    ...savedConfig,
    baseUrl: baseUrl ? baseUrl.trim() : savedConfig.baseUrl,
    token: token ? token.trim() : savedConfig.token
  };

  const targetPhone = phone || testConfig.defaultChannelNumber || '17997451176';
  const testMessage = message || `🚚 [TESTE DE CONEXÃO] Portal de Fretes e Motoristas ELO LOG.\nIntegração WhatsApp API autenticada e operando com sucesso!\nHorário: ${new Date().toLocaleTimeString('pt-BR')}`;

  const result = await sendToWhatsAppGateway(testConfig, {
    number: targetPhone,
    body: testMessage,
    externalKey: `test-${Date.now()}`
  });

  testConfig.lastTestedAt = new Date().toISOString();
  testConfig.lastTestStatus = result.success ? 'SUCCESS' : 'ERROR';
  testConfig.lastTestMessage = result.message;
  db.whatsappConfigs.set(tenantId, testConfig);

  db.addAuditLog({
    tenantId: req.user?.tenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'TESTE_WHATSAPP',
    entity: 'WhatsAppGateway',
    entityId: `wa-test-${Date.now()}`,
    details: `Teste de envio WhatsApp para (${targetPhone}): ${result.success ? 'SUCESSO' : 'FALHA - ' + result.message}`
  });

  res.json({
    success: result.success,
    message: result.message,
    recipient: formatPhoneForWhatsApp(targetPhone),
    details: result.data || result.rawResponse
  });
});

// 4. Send Freight / Checklist WhatsApp Notification
apiRouter.post('/integrations/whatsapp/notify', async (req: AuthenticatedRequest, res: Response) => {
  const { phone, message, freightCode, templateType, externalKey, mediaUrl, useButtonApi, buttons } = req.body;
  const tenantId = req.user?.tenantId || 'tenant-translog-01';
  const config = db.whatsappConfigs.get(tenantId) || db.globalWhatsAppConfig;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios para envio.' });
  }

  const cleanPhone = formatPhoneForWhatsApp(phone);

  const result = await sendToWhatsAppGateway(config, {
    number: cleanPhone,
    body: message,
    externalKey: externalKey || (freightCode ? `freight-${freightCode}` : `notify-${Date.now()}`),
    mediaUrl,
    useButtonApi,
    buttons
  });

  db.addAuditLog({
    tenantId: req.user?.tenantId || undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DISPARO_WHATSAPP',
    entity: 'WhatsAppNotification',
    entityId: `wa-${Date.now()}`,
    details: `Notificação WhatsApp (${templateType || 'Geral'}) para (${cleanPhone}): "${message.slice(0, 80)}..." [${result.success ? 'SUCESSO' : 'FALHA'}]`
  });

  res.json({
    success: result.success,
    messageId: `wa-msg-${Date.now()}`,
    recipient: cleanPhone,
    status: result.success ? 'ENVIADO' : 'ERRO',
    sentAt: new Date().toISOString(),
    details: result.message,
    gatewayResponse: result.data || result.rawResponse
  });
});

// Get Form Responses
apiRouter.get('/forms/responses', (req: AuthenticatedRequest, res: Response) => {
  const { freightId, formId } = req.query;
  let responses = db.formResponses;

  if (req.user?.role !== 'SUPER_ADMIN') {
    responses = responses.filter(r => r.tenantId === req.user?.tenantId);
  }
  if (freightId) {
    responses = responses.filter(r => r.freightId === freightId);
  }
  if (formId) {
    responses = responses.filter(r => r.formId === formId);
  }

  res.json(responses);
});

// Get next sequential talão number (e.g. 001, 002, 003...)
apiRouter.get('/forms/next-talao', (req: AuthenticatedRequest, res: Response) => {
  const nextNumber = db.getNextTalaoNumber();
  res.json({ nextNumber });
});

// Dispatch Digital Checklist Receipt via Email and/or WhatsApp with Masked Data
apiRouter.post('/forms/send-dispatch', async (req: AuthenticatedRequest, res: Response) => {
  const { 
    responseId, 
    stage, 
    talaoNumber, 
    freightCode, 
    recipientType, 
    recipientName, 
    recipientEmail, 
    recipientPhone, 
    maskedData,
    receiptText
  } = req.body;

  const tenantId = req.user?.tenantId || 'tenant-translog-01';
  const cleanPhone = recipientPhone ? formatPhoneForWhatsApp(recipientPhone) : '';

  let emailStatus = 'NAO_INFORMADO';
  if (recipientEmail && recipientEmail.includes('@')) {
    emailStatus = 'ENVIADO';
    // Create system notification for email dispatch
    db.notifications.unshift({
      id: `notif-email-${Date.now()}`,
      tenantId,
      userId: req.user!.id,
      title: `📧 Comprovante de Checklist #${talaoNumber || '001'} Enviado por E-mail`,
      message: `Comprovante da etapa [${stage || 'VISTORIA'}] transmitido com sucesso para ${recipientEmail} (${recipientName || 'Responsável'}).`,
      read: false,
      createdAt: new Date().toISOString(),
      type: 'STATUS_ATUALIZADO'
    });
  }

  // Generate standard WhatsApp share link if phone exists
  let whatsappLink = '';
  if (cleanPhone && receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(receiptText)}`;
  } else if (receiptText) {
    whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
  }

  // Audit log
  db.addAuditLog({
    tenantId,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DISPARO_COMPROVANTE_CHECKLIST',
    entity: 'ChecklistReceipt',
    entityId: responseId || `talao-${talaoNumber}`,
    details: `Disparo de comprovante do Talão Nº ${talaoNumber || '001'} (${stage || 'VISTORIA'}) para ${recipientName || 'Responsável'}. E-mail: ${recipientEmail || 'N/A'} [${emailStatus}], WhatsApp: ${cleanPhone || 'N/A'}`
  });

  res.json({
    success: true,
    emailStatus,
    recipientEmail: recipientEmail || null,
    recipientPhone: cleanPhone || null,
    whatsappLink,
    sentAt: new Date().toISOString()
  });
});

/* =========================================================================
   9. NOTIFICATIONS
   ========================================================================= */

apiRouter.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

  const userNotifs = db.notifications.filter(n => n.userId === req.user?.id);
  res.json(userNotifs);
});

apiRouter.put('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user?.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

apiRouter.put('/notifications/mark-all-read', (req: AuthenticatedRequest, res: Response) => {
  db.notifications.forEach(n => {
    if (n.userId === req.user?.id) {
      n.read = true;
    }
  });
  res.json({ success: true });
});

/* =========================================================================
   10. AUDIT LOGS
   ========================================================================= */

apiRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.auditLogs);
  }
  const logs = db.auditLogs.filter(l => l.tenantId === req.user?.tenantId);
  res.json(logs);
});

/* =========================================================================
   11. DASHBOARD STATS
   ========================================================================= */

apiRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  let freights = db.freights;
  let drivers = db.drivers;
  let vehicles = db.vehicles;
  let users = db.users;

  if (req.user?.role !== 'SUPER_ADMIN') {
    freights = freights.filter(f => f.tenantId === req.user?.tenantId);
    drivers = drivers.filter(d => d.tenantId === req.user?.tenantId);
    vehicles = vehicles.filter(v => v.tenantId === req.user?.tenantId);
    users = users.filter(u => u.tenantId === req.user?.tenantId);
  }

  const availableFreights = freights.filter(f => ['PUBLICADO', 'DISPONIVEL'].includes(f.status)).length;
  const reservedFreights = freights.filter(f => f.status === 'RESERVADO').length;
  const inProgressFreights = freights.filter(f => ['EM_COLETA', 'COLETADO', 'EM_TRANSITO'].includes(f.status)).length;
  const completedFreights = freights.filter(f => ['ENTREGUE', 'FINALIZADO'].includes(f.status)).length;
  const cancelledFreights = freights.filter(f => f.status === 'CANCELADO').length;
  const totalFreightValue = freights.reduce((acc, f) => acc + (f.payment?.price || 0), 0);

  const activeDrivers = drivers.filter(d => d.status === 'DISPONIVEL' || d.status === 'EM_VIAGEM').length;

  res.json({
    totalFreights: freights.length,
    availableFreights,
    reservedFreights,
    inProgressFreights,
    completedFreights,
    cancelledFreights,
    totalFreightValue,
    totalDrivers: drivers.length,
    activeDrivers,
    totalVehicles: vehicles.length,
    totalUsers: users.length,
    recentFreights: freights.slice(0, 5),
    recentActivities: db.auditLogs.filter(l => req.user?.role === 'SUPER_ADMIN' || l.tenantId === req.user?.tenantId).slice(0, 8)
  });
});

/* =========================================================================
   12. DELETE ENDPOINTS
   ========================================================================= */

apiRouter.delete('/freights/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.freights.findIndex(f => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Frete não encontrado' });
  const freight = db.freights[index];

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && freight.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este frete pertence a outra empresa.' });
  }

  db.freights.splice(index, 1);

  db.addAuditLog({
    tenantId: freight.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_FRETE',
    entity: 'Freight',
    entityId: freight.id,
    details: `Frete ${freight.code} excluído`
  });

  res.json({ success: true, message: 'Frete excluído com sucesso' });
});

apiRouter.delete('/drivers/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.drivers.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Motorista não encontrado' });
  const driver = db.drivers[index];

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && driver.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este motorista pertence a outra empresa.' });
  }

  db.drivers.splice(index, 1);

  db.vehicles = db.vehicles.filter(v => v.driverId !== driver.id);
  db.users = db.users.filter(u => u.driverId !== driver.id);

  db.addAuditLog({
    tenantId: driver.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_MOTORISTA',
    entity: 'Driver',
    entityId: driver.id,
    details: `Motorista ${driver.name} excluído`
  });

  res.json({ success: true, message: 'Motorista excluído com sucesso' });
});

apiRouter.delete('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
  const targetUser = db.users[index];

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && targetUser.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este usuário pertence a outra empresa.' });
  }
  
  if (targetUser.id === req.user?.id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
  }

  db.users.splice(index, 1);

  db.addAuditLog({
    tenantId: targetUser.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_USUARIO',
    entity: 'User',
    entityId: targetUser.id,
    details: `Usuário ${targetUser.name} (${targetUser.email}) excluído`
  });

  res.json({ success: true, message: 'Usuário excluído com sucesso' });
});

apiRouter.delete('/forms/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.forms.findIndex(f => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Formulário não encontrado' });
  const form = db.forms[index];

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && form.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este formulário pertence a outra empresa.' });
  }

  db.forms.splice(index, 1);

  db.addAuditLog({
    tenantId: form.tenantId || undefined,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_FORMULARIO',
    entity: 'FormDefinition',
    entityId: form.id,
    details: `Formulário ${form.title} excluído`
  });

  res.json({ success: true, message: 'Formulário excluído com sucesso' });
});

apiRouter.delete('/vehicles/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.vehicles.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Veículo não encontrado' });
  const vehicle = db.vehicles[index];

  // Security check: ensure tenant matches
  if (req.user?.role !== 'SUPER_ADMIN' && vehicle.tenantId !== req.user?.tenantId) {
    return res.status(403).json({ error: 'Acesso não autorizado. Este veículo pertence a outra empresa.' });
  }

  db.vehicles.splice(index, 1);

  db.addAuditLog({
    tenantId: vehicle.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUIR_VEICULO',
    entity: 'Vehicle',
    entityId: vehicle.id,
    details: `Veículo placa ${vehicle.plate} excluído`
  });

  res.json({ success: true, message: 'Veículo excluído com sucesso' });
});

// Web Push Notifications endpoints
apiRouter.get('/push/vapid-key', (req: AuthenticatedRequest, res: Response) => {
  res.json({ publicKey: publicVapidKey });
});

apiRouter.post('/push/subscribe', (req: AuthenticatedRequest, res: Response) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription inválida' });
  }

  if (!(db as any).pushSubscriptions) {
    (db as any).pushSubscriptions = [];
  }

  const subs = (db as any).pushSubscriptions;
  const exists = subs.some((s: any) => s.endpoint === subscription.endpoint);
  if (!exists) {
    subs.push({
      ...subscription,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, message: 'Push subscription registrada com sucesso' });
});

apiRouter.post('/push/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await sendPushNotificationToAll({
      title: '🔔 Teste de Notificação Push - Elo Log',
      body: 'As notificações push em tempo real estão ativas e funcionando perfeitamente!',
      url: '/'
    });
    res.json({ success: true, message: 'Notificação de teste disparada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao enviar notificação de teste' });
  }
});

// SaaS Global Configuration Endpoints
apiRouter.get('/saas/config', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.saasGlobalConfig);
});

apiRouter.post('/saas/config', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Permissão insuficiente para alterar configurações globais do SaaS.' });
  }

  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: 'Configuração inválida.' });
  }

  db.saasGlobalConfig = {
    ...db.saasGlobalConfig,
    ...newConfig
  };

  db.addAuditLog({
    tenantId: undefined,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CONFIG_SAAS',
    entity: 'SaaSConfig',
    entityId: 'global-saas-config',
    details: `Atualizou configurações globais do SaaS (Nome: ${db.saasGlobalConfig.systemName})`
  });

  res.json({ success: true, config: db.saasGlobalConfig });
});

/* =========================================================================
   14. TRIP EXPENSES & ACCOUNTABILITY (PRESTAÇÃO DE CONTAS ELO LOG)
   ========================================================================= */

// List trip expense reports
apiRouter.get('/expenses', (req: AuthenticatedRequest, res: Response) => {
  let list = db.tripExpenses || [];
  const { freightId, driverId, status } = req.query;

  if (req.user?.role === 'MOTORISTA') {
    // Drivers only see their own reports
    list = list.filter(e => e.driverId === req.user?.id || (req.user?.name && e.driverName === req.user.name));
  } else if (req.user?.role !== 'SUPER_ADMIN') {
    // Tenant users see their company's reports
    list = list.filter(e => !e.tenantId || e.tenantId === req.user?.tenantId);
  }

  if (freightId) {
    list = list.filter(e => e.freightId === freightId);
  }

  if (driverId) {
    list = list.filter(e => e.driverId === driverId);
  }

  if (status) {
    list = list.filter(e => e.status === status);
  }

  res.json(list);
});

// Get single report
apiRouter.get('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const report = (db.tripExpenses || []).find(e => e.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Relatório de prestação de contas não encontrado' });
  }

  if (req.user?.role === 'MOTORISTA' && report.driverId !== req.user?.id && report.driverName !== req.user?.name) {
    return res.status(403).json({ error: 'Acesso não autorizado a este relatório' });
  }

  res.json(report);
});

// Create new report
apiRouter.post('/expenses', (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Dados da prestação de contas inválidos' });
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const totalExpenses = items.reduce((acc: number, it: any) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items
    .filter((it: any) => it.category === 'ABASTECIMENTO' && it.liters)
    .reduce((acc: number, it: any) => acc + (Number(it.liters) || 0), 0);

  const initialKm = Number(data.initialKm) || 0;
  const finalKm = Number(data.finalKm) || 0;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : (Number(data.totalKm) || 0);

  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;

  const advanceAmount = Number(data.advanceAmount) || 0;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus = balanceAmount >= 0 ? 'A_DEVOLVER' : 'REEMBOLSO_A_RECEBER';

  const newReport: TripExpenseReport = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId: req.user?.tenantId || data.tenantId,
    freightId: data.freightId,
    freightCode: data.freightCode,
    driverId: req.user?.role === 'MOTORISTA' ? req.user.id : (data.driverId || req.user?.id || 'driver-anon'),
    driverName: req.user?.role === 'MOTORISTA' ? req.user.name : (data.driverName || req.user?.name || 'Motorista'),
    driverPhone: data.driverPhone || req.user?.phone,
    vehiclePlate: data.vehiclePlate,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || new Date().toISOString().split('T')[0],
    tripDays: Number(data.tripDays) || 1,
    initialKm,
    finalKm,
    totalKm,
    totalLiters,
    averageKmPerLiter,
    costPerKm,
    advanceAmount,
    totalExpenses,
    balanceAmount,
    balanceStatus,
    status: data.status || 'ENVIADO',
    items,
    generalNotes: data.generalNotes,
    reviewerNotes: data.reviewerNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.tripExpenses) {
    db.tripExpenses = [];
  }
  db.tripExpenses.unshift(newReport);

  db.addAuditLog({
    tenantId: newReport.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'MOTORISTA',
    action: 'CRIACAO_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: newReport.id,
    details: `Prestação de contas criada para a viagem/frete ${newReport.freightCode || newReport.id} (Total: R$ ${totalExpenses.toFixed(2)})`
  });

  res.status(201).json(newReport);
});

// Update report / change status / approve
apiRouter.put('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = (db.tripExpenses || []).findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Relatório de despesas não encontrado' });
  }

  const existing = db.tripExpenses[index];
  const updates = req.body;

  const items = Array.isArray(updates.items) ? updates.items : existing.items;
  const totalExpenses = items.reduce((acc: number, it: any) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items
    .filter((it: any) => it.category === 'ABASTECIMENTO' && it.liters)
    .reduce((acc: number, it: any) => acc + (Number(it.liters) || 0), 0);

  const initialKm = updates.initialKm !== undefined ? Number(updates.initialKm) : existing.initialKm;
  const finalKm = updates.finalKm !== undefined ? Number(updates.finalKm) : existing.finalKm;
  const totalKm = finalKm > initialKm ? finalKm - initialKm : (updates.totalKm !== undefined ? Number(updates.totalKm) : existing.totalKm);

  const averageKmPerLiter = totalLiters > 0 && totalKm > 0 ? totalKm / totalLiters : existing.averageKmPerLiter;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : existing.costPerKm;

  const advanceAmount = updates.advanceAmount !== undefined ? Number(updates.advanceAmount) : existing.advanceAmount;
  const balanceAmount = advanceAmount - totalExpenses;
  const balanceStatus = updates.balanceStatus || (balanceAmount >= 0 ? 'A_DEVOLVER' : 'REEMBOLSO_A_RECEBER');

  const updatedReport: TripExpenseReport = {
    ...existing,
    ...updates,
    items,
    totalExpenses,
    totalLiters,
    initialKm,
    finalKm,
    totalKm,
    averageKmPerLiter,
    costPerKm,
    advanceAmount,
    balanceAmount,
    balanceStatus,
    updatedAt: new Date().toISOString()
  };

  if (updates.status === 'APROVADO' && existing.status !== 'APROVADO') {
    updatedReport.approvedAt = new Date().toISOString();
    updatedReport.reviewedBy = req.user?.name;
    updatedReport.reviewedAt = new Date().toISOString();
  }

  db.tripExpenses[index] = updatedReport;

  db.addAuditLog({
    tenantId: updatedReport.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'ATUALIZACAO_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: updatedReport.id,
    details: `Prestação de contas #${updatedReport.id.slice(0, 8)} atualizada (Status: ${updatedReport.status})`
  });

  res.json(updatedReport);
});

// Delete report
apiRouter.delete('/expenses/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = (db.tripExpenses || []).findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Relatório não encontrado' });
  }

  const report = db.tripExpenses[index];
  db.tripExpenses.splice(index, 1);

  db.addAuditLog({
    tenantId: report.tenantId,
    userId: req.user?.id || 'system',
    userName: req.user?.name || 'Sistema',
    userRole: req.user?.role || 'ADMIN',
    action: 'EXCLUSAO_PRESTACAO_CONTAS',
    entity: 'TripExpenseReport',
    entityId: report.id,
    details: `Prestação de contas #${report.id} removida`
  });

  res.json({ success: true, message: 'Relatório excluído com sucesso' });
});



