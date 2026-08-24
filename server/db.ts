import { 
  Tenant, 
  User, 
  Driver, 
  Vehicle, 
  Freight, 
  FreightStatus, 
  AppNotification, 
  FormDefinition, 
  FormResponse, 
  AuditLog,
  UserRole,
  WhatsAppConfig,
  SaaSGlobalConfig,
  PlanConfig,
  TripExpenseReport,
  WebPage,
  BlogPost
} from '../src/types';

// In-Memory Multi-Tenant Store with realistic seed data
class DatabaseStore {
  tenants: Tenant[] = [];
  users: User[] = [];
  drivers: Driver[] = [];
  vehicles: Vehicle[] = [];
  freights: Freight[] = [];
  tripExpenses: TripExpenseReport[] = [];
  notifications: AppNotification[] = [];
  pushSubscriptions: any[] = [];
  forms: FormDefinition[] = [];
  formResponses: FormResponse[] = [];
  auditLogs: AuditLog[] = [];
  pages: WebPage[] = [];
  posts: BlogPost[] = [];
  helpPages: { role: string; content: string }[] = [
    { role: 'ADMIN', content: '' },
    { role: 'SUPERVISOR', content: '' },
    { role: 'USER', content: '' },
    { role: 'DRIVER', content: '' }
  ];
  whatsappConfigs: Map<string, WhatsAppConfig> = new Map();
  globalWhatsAppConfig: WhatsAppConfig = {
    baseUrl: process.env.WHATSAPP_API_URL || '',
    token: process.env.WHATSAPP_API_TOKEN || '',
    defaultChannelNumber: '5517997451176',
    isActive: true,
    autoNotifyChecklist: true,
    autoNotifyFreightStatus: true
  };
  saasGlobalConfig: SaaSGlobalConfig = {
    systemName: 'Elo Log',
    supportPhone: '(17) 99745-1176',
    supportEmail: 'contato@elolog.com.br',
    defaultCommissionPercent: 12,
    requireChecklistPhotos: true,
    minDriverAge: 18,
    otpExpirationMinutes: 5,
    allowSelfRegistration: true,
    plans: [
      { id: 'BASICO', name: 'Plano Básico', price: 299, maxFreightsPerMonth: 15, maxUsers: 2, maxDrivers: 5, isActive: true },
      { id: 'PROFISSIONAL', name: 'Plano Profissional', price: 599, maxFreightsPerMonth: 150, maxUsers: 10, maxDrivers: 30, isActive: true },
      { id: 'EMPRESARIAL', name: 'Plano Empresarial', price: 1499, maxFreightsPerMonth: 9999, maxUsers: 50, maxDrivers: 200, isActive: true }
    ],
    layout: {
      primaryColor: '#059669',
      borderRadius: 'xl',
      fontFamily: 'sans',
      navbarStyle: 'dark',
      logoText: 'ELO LOG',
      systemBackground: 'slate'
    },
    formFields: {
      userForm: [
        { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Digite o nome completo', enabled: true, required: true },
        { id: 'email', originalLabel: 'E-mail Corporativo', label: 'E-mail Corporativo', placeholder: 'Digite o e-mail corporativo', enabled: true, required: true },
        { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(99) 99999-9999', enabled: true, required: true },
        { id: 'role', originalLabel: 'Nível de Permissão', label: 'Nível de Permissão', placeholder: 'Selecione a permissão', enabled: true, required: true }
      ],
      freightForm: [
        { id: 'cargoDescription', originalLabel: 'Descrição da Carga', label: 'Descrição da Carga', placeholder: 'Ex: Carga de milho ensacado', enabled: true, required: true },
        { id: 'cargoType', originalLabel: 'Tipo de Carga', label: 'Tipo de Carga', placeholder: 'Selecione o tipo', enabled: true, required: true },
        { id: 'weight', originalLabel: 'Peso Total (Kg)', label: 'Peso Total (Kg)', placeholder: 'Ex: 15000', enabled: true, required: true },
        { id: 'volumes', originalLabel: 'Volumes', label: 'Volumes', placeholder: 'Ex: 30', enabled: true, required: true },
        { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: 'Selecione o veículo', enabled: true, required: true },
        { id: 'bodyType', originalLabel: 'Carroceria', label: 'Carroceria', placeholder: 'Selecione a carroceria', enabled: true, required: true },
        { id: 'brand', originalLabel: 'Marca do Veículo', label: 'Marca do Veículo', placeholder: 'Marca recomendada', enabled: true, required: true },
        { id: 'value', originalLabel: 'Valor do Frete (R$)', label: 'Valor do Frete (R$)', placeholder: '0.00', enabled: true, required: true },
        { id: 'paymentMethod', originalLabel: 'Forma de Pagamento', label: 'Forma de Pagamento', placeholder: 'Ex: Pix, Transferência', enabled: true, required: true },
        { id: 'originCity', originalLabel: 'Cidade Origem', label: 'Cidade Origem', placeholder: 'Cidade de coleta', enabled: true, required: true },
        { id: 'originState', originalLabel: 'UF Origem', label: 'UF Origem', placeholder: 'UF', enabled: true, required: true },
        { id: 'originAddress', originalLabel: 'Endereço Origem', label: 'Endereço Origem', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true },
        { id: 'originNumber', originalLabel: 'Número Origem', label: 'Número Origem', placeholder: 'Número', enabled: true, required: true },
        { id: 'destCity', originalLabel: 'Cidade Destino', label: 'Cidade Destino', placeholder: 'Cidade de entrega', enabled: true, required: true },
        { id: 'destState', originalLabel: 'UF Destino', label: 'UF Destino', placeholder: 'UF', enabled: true, required: true },
        { id: 'destAddress', originalLabel: 'Endereço Destino', label: 'Endereço Destino', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true },
        { id: 'destNumber', originalLabel: 'Número Destino', label: 'Número Destino', placeholder: 'Número', enabled: true, required: true }
      ],
      driverForm: [
        { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Nome completo do motorista', enabled: true, required: true },
        { id: 'email', originalLabel: 'E-mail', label: 'E-mail', placeholder: 'email@provedor.com', enabled: true, required: true },
        { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(99) 99999-9999', enabled: true, required: true },
        { id: 'cpf', originalLabel: 'CPF', label: 'CPF', placeholder: '000.000.000-00', enabled: true, required: true },
        { id: 'rg', originalLabel: 'RG', label: 'RG', placeholder: 'RG do motorista', enabled: true, required: true },
        { id: 'city', originalLabel: 'Cidade', label: 'Cidade', placeholder: 'Cidade', enabled: true, required: true },
        { id: 'state', originalLabel: 'Estado (UF)', label: 'Estado (UF)', placeholder: 'UF', enabled: true, required: true },
        { id: 'cnh', originalLabel: 'Nº CNH', label: 'Nº CNH', placeholder: 'Número da habilitação', enabled: true, required: true },
        { id: 'cnhCategory', originalLabel: 'Categoria CNH', label: 'Categoria CNH', placeholder: 'Selecione a categoria', enabled: true, required: true },
        { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: 'Tipo do caminhão', enabled: true, required: true },
        { id: 'vehicleModel', originalLabel: 'Marca / Modelo', label: 'Marca / Modelo', placeholder: 'Ex: Volvo FH 540', enabled: true, required: true },
        { id: 'vehiclePlate', originalLabel: 'Placa', label: 'Placa', placeholder: 'Placa do veículo', enabled: true, required: true }
      ],
      expenseForm: [
        { id: 'driverName', originalLabel: 'Nome do Motorista', label: 'Nome do Motorista', placeholder: 'Nome...', enabled: true, required: true },
        { id: 'clientName', originalLabel: 'Cliente', label: 'Cliente', placeholder: 'Nome do Cliente...', enabled: true, required: true },
        { id: 'vehicleModel', originalLabel: 'Modelo do Veículo', label: 'Modelo do Veículo', placeholder: 'Ex: FH 540', enabled: true, required: true },
        { id: 'vehiclePlate', originalLabel: 'Placa do Caminhão / Veículo', label: 'Placa do Caminhão / Veículo', placeholder: 'ABC-1234', enabled: true, required: true },
        { id: 'chassis', originalLabel: 'Placa / Chassis', label: 'Placa / Chassis', placeholder: 'Nº Chassis', enabled: true, required: true },
        { id: 'startDate', originalLabel: 'Data de Início da Viagem', label: 'Data de Início da Viagem', placeholder: '', enabled: true, required: true },
        { id: 'endDate', originalLabel: 'Data de Término da Viagem', label: 'Data de Término da Viagem', placeholder: '', enabled: true, required: true },
        { id: 'initialKm', originalLabel: 'Km Inicial', label: 'Km Inicial', placeholder: '0', enabled: true, required: true },
        { id: 'finalKm', originalLabel: 'Km Final', label: 'Km Final', placeholder: '0', enabled: true, required: true },
        { id: 'advanceAmount', originalLabel: 'Adiantamento Pago pela Empresa (R$)', label: 'Adiantamento Pago pela Empresa (R$)', placeholder: '0.00', enabled: true, required: true },
        { id: 'driverLaborAmount', originalLabel: 'Mão de Obra Motorista (R$)', label: 'Mão de Obra Motorista (R$)', placeholder: '0.00', enabled: true, required: true }
      ]
    },
    databaseConfig: {
      enabled: true,
      dbType: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'elolog',
      username: process.env.DB_USER || 'elolog_user',
      password: process.env.DB_PASSWORD || 'elolog_secret_password_2026',
      ssl: process.env.DB_SSL === 'true',
      autoMigrate: true,
      connectionStatus: 'UNCONFIGURED'
    },
    imageCompression: {
      enabled: true,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
      format: 'image/jpeg',
      autoCompressDocuments: true,
      maxFileSizeKB: 400
    },
    mapboxConfig: {
      enabled: false,
      apiKey: process.env.MAPBOX_API_KEY || '',
      defaultZoom: 12,
      defaultStyle: 'streets-v12',
      enableLiveTracking: true,
      updateIntervalSeconds: 30
    }
  };

  // Mutex locks for atomic operations (e.g. freight acceptance)
  private locks: Map<string, Promise<void>> = new Map();
  
  // Storage for auth tokens
  private authTokens: Map<string, { userId: string, expiresAt: Date }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // Mutex wrapper to guarantee single atomic transaction for a given key
  async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(key, promise);

    try {
      return await operation();
    } finally {
      this.locks.delete(key);
      release();
    }
  }

  // Helper to log audit trail
  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  // Helper to dispatch in-app notifications
  addNotification(entry: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
    const notif: AppNotification = {
      ...entry,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    return notif;
  }

  // Auth token persistence methods
  saveAuthToken(token: string, userId: string, expiresAt: Date) {
    this.authTokens.set(token, { userId, expiresAt });
  }

  getUserIdFromToken(token: string): string | null {
    const tokenData = this.authTokens.get(token);
    if (!tokenData) return null;
    if (tokenData.expiresAt < new Date()) {
      this.authTokens.delete(token);
      return null;
    }
    return tokenData.userId;
  }

  private seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Tenants (Empresas)
    const tenant1: Tenant = {
      id: 'tenant-translog-01',
      name: 'TransLog Brasil Transportes',
      legalName: 'TransLog Brasil Logística e Cargas Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'operacional@translogbrasil.com.br',
      phone: '(17) 3214-5500',
      zipCode: '15015-000',
      address: 'Av. Alberto Andaló',
      number: '3100',
      neighborhood: 'Centro',
      city: 'São José do Rio Preto',
      state: 'SP',
      status: 'ATIVA',
      plan: 'EMPRESARIAL',
      allowedOperations: ['CARGA_GERAL', 'LOGISTICA_VEICULOS'],
      planLimits: {
        maxUsers: 50,
        maxDrivers: 200,
        maxFreightsMonthly: 1000,
        customForms: true,
        exportReports: true,
        prioritySupport: true
      },
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: isoNow
    };

    const tenant2: Tenant = {
      id: 'tenant-expresso-02',
      name: 'Expresso Rodoviário Paulista',
      legalName: 'Expresso Rodoviário Paulista S.A.',
      cnpj: '98.765.432/0001-10',
      email: 'contato@expressorps.com.br',
      phone: '(19) 3512-8899',
      zipCode: '13080-000',
      address: 'Rodovia Anhanguera',
      number: 'Km 104',
      neighborhood: 'Distrito Industrial',
      city: 'Campinas',
      state: 'SP',
      status: 'ATIVA',
      plan: 'PROFISSIONAL',
      allowedOperations: ['CARGA_GERAL'],
      planLimits: {
        maxUsers: 15,
        maxDrivers: 50,
        maxFreightsMonthly: 250,
        customForms: true,
        exportReports: true,
        prioritySupport: false
      },
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: isoNow
    };

    this.tenants = [tenant1, tenant2];

    // 2. Users with RBAC
    this.users = [
      {
        id: 'user-superadmin',
        tenantId: null,
        name: 'Administrador Geral da Plataforma',
        email: 'superadmin@portaldefretes.com.br',
        phone: '(11) 99999-0001',
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-01T08:00:00.000Z'
      },
      {
        id: 'user-empresa-superadmin-1',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Alberto Ferreira (Diretor)',
        email: 'carlos.ferreira@translogbrasil.com.br',
        phone: '(17) 99781-1122',
        role: 'EMPRESA_SUPER_ADMIN',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-10T10:10:00.000Z'
      },
      {
        id: 'user-admin-1',
        tenantId: 'tenant-translog-01',
        name: 'Mariana Silveira (Gerente de Fretes)',
        email: 'mariana.fretes@translogbrasil.com.br',
        phone: '(17) 99782-3344',
        role: 'ADMIN',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-12T14:00:00.000Z'
      },
      {
        id: 'user-supervisor-1',
        tenantId: 'tenant-translog-01',
        name: 'Roberto Dias (Supervisor de Pátio)',
        email: 'roberto.dias@translogbrasil.com.br',
        phone: '(17) 99783-5566',
        role: 'SUPERVISOR',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-15T09:00:00.000Z'
      },
      {
        id: 'user-op-1',
        tenantId: 'tenant-translog-01',
        name: 'Juliana Castro (Operadora de Cargas)',
        email: 'juliana.castro@translogbrasil.com.br',
        phone: '(17) 99784-7788',
        role: 'USUARIO',
        status: 'ATIVO',
        lastLoginAt: isoNow,
        createdAt: '2026-01-20T11:00:00.000Z'
      },
      {
        id: 'user-driver-joao',
        tenantId: 'tenant-translog-01',
        name: 'João da Silva',
        email: 'joao.silva.motorista@gmail.com',
        phone: '(17) 98112-9090',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-joao-01',
        lastLoginAt: isoNow,
        createdAt: '2026-01-15T15:30:00.000Z'
      },
      {
        id: 'user-driver-carlos',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Eduardo Mendes',
        email: 'carlos.mendes.cargas@gmail.com',
        phone: '(17) 99654-3210',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-carlos-02',
        lastLoginAt: isoNow,
        createdAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: 'user-driver-marcos',
        tenantId: 'tenant-translog-01',
        name: 'Marcos Antônio Rocha',
        email: 'marcos.rocha.truck@gmail.com',
        phone: '(19) 98765-4321',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-marcos-03',
        lastLoginAt: isoNow,
        createdAt: '2026-02-05T09:30:00.000Z'
      },
      {
        id: 'user-driver-test-17',
        tenantId: 'tenant-translog-01',
        name: 'Motorista Teste WhatsApp',
        email: 'motorista.17991163961@elolog.com.br',
        phone: '(17) 99116-3961',
        role: 'MOTORISTA',
        status: 'ATIVO',
        driverId: 'driver-test-17',
        lastLoginAt: isoNow,
        createdAt: '2026-02-20T10:00:00.000Z'
      }
    ];

    // 3. Drivers
    this.drivers = [
      {
        id: 'driver-test-17',
        userId: 'user-driver-test-17',
        tenantId: 'tenant-translog-01',
        name: 'Motorista Teste WhatsApp',
        cpf: '456.789.012-33',
        rg: '55.443.221-X SSP/SP',
        birthDate: '1990-05-12',
        phone: '(17) 99116-3961',
        email: 'motorista.17991163961@elolog.com.br',
        zipCode: '15010-000',
        address: 'Rua Teste WhatsApp, 100',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '09876543210',
        cnhCategory: 'E',
        cnhExpiresAt: '2030-01-01',
        status: 'DISPONIVEL',
        rating: 5.0,
        completedTrips: 15,
        rntrc: '99887766',
        notes: 'Motorista de teste criado especificamente para validação do login via WhatsApp (17) 99116-3961.',
        createdAt: '2026-02-20T10:00:00.000Z'
      },
      {
        id: 'driver-joao-01',
        userId: 'user-driver-joao',
        tenantId: 'tenant-translog-01',
        name: 'João da Silva',
        cpf: '123.456.789-00',
        rg: '25.678.901-X SSP/SP',
        birthDate: '1984-06-14',
        phone: '(17) 98112-9090',
        email: 'joao.silva.motorista@gmail.com',
        zipCode: '15050-000',
        address: 'Rua das Palmeiras, 450',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '04598712340',
        cnhCategory: 'E',
        cnhExpiresAt: '2028-09-15',
        status: 'DISPONIVEL',
        rating: 4.9,
        completedTrips: 42,
        rntrc: '12345678',
        notes: 'Motorista com mais de 10 anos de experiência em rotas interestaduais SP/PR/MG.',
        createdAt: '2026-01-15T15:30:00.000Z'
      },
      {
        id: 'driver-carlos-02',
        userId: 'user-driver-carlos',
        tenantId: 'tenant-translog-01',
        name: 'Carlos Eduardo Mendes',
        cpf: '234.567.890-11',
        rg: '32.114.556-7 SSP/SP',
        birthDate: '1989-11-22',
        phone: '(17) 99654-3210',
        email: 'carlos.mendes.cargas@gmail.com',
        zipCode: '15043-000',
        address: 'Av. Fortunato Ernesto Vetorasso, 1120',
        city: 'São José do Rio Preto',
        state: 'SP',
        cnh: '05874123690',
        cnhCategory: 'D',
        cnhExpiresAt: '2027-11-20',
        status: 'DISPONIVEL',
        rating: 4.8,
        completedTrips: 28,
        rntrc: '87654321',
        notes: 'Especialista em cargas secas e distribuição urbana/intermunicipal.',
        createdAt: '2026-01-18T10:00:00.000Z'
      },
      {
        id: 'driver-marcos-03',
        userId: 'user-driver-marcos',
        tenantId: 'tenant-translog-01',
        name: 'Marcos Antônio Rocha',
        cpf: '345.678.901-22',
        rg: '41.987.234-5 SSP/SP',
        birthDate: '1979-03-08',
        phone: '(19) 98765-4321',
        email: 'marcos.rocha.truck@gmail.com',
        zipCode: '13090-000',
        address: 'Av. José de Souza Campos, 890',
        city: 'Campinas',
        state: 'SP',
        cnh: '03214569870',
        cnhCategory: 'E',
        cnhExpiresAt: '2029-01-10',
        status: 'DISPONIVEL',
        rating: 5.0,
        completedTrips: 65,
        rntrc: '45678912',
        notes: 'Disponibilidade para fretes longos em todo território nacional.',
        createdAt: '2026-02-05T09:30:00.000Z'
      }
    ];

    // 4. Vehicles
    this.vehicles = [
      {
        id: 'vehicle-truck-01',
        driverId: 'driver-joao-01',
        tenantId: 'tenant-translog-01',
        type: 'TRUCK',
        brand: 'Mercedes-Benz',
        model: 'Atego 2426',
        year: 2022,
        plate: 'BRA2E19',
        renavam: '00987654321',
        capacityKg: 14000,
        capacityVolumeM3: 45,
        bodyType: 'BAU',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-01-15T15:40:00.000Z'
      },
      {
        id: 'vehicle-toco-02',
        driverId: 'driver-carlos-02',
        tenantId: 'tenant-translog-01',
        type: 'TOCO',
        brand: 'Volkswagen',
        model: 'Delivery 11.180',
        year: 2023,
        plate: 'RPO4C55',
        renavam: '00123456789',
        capacityKg: 7500,
        capacityVolumeM3: 32,
        bodyType: 'SIDER',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-01-18T10:15:00.000Z'
      },
      {
        id: 'vehicle-carreta-03',
        driverId: 'driver-marcos-03',
        tenantId: 'tenant-translog-01',
        type: 'CARRETA',
        brand: 'Scania',
        model: 'R450 6x2',
        year: 2021,
        plate: 'FXS8G90',
        renavam: '00456789123',
        capacityKg: 28000,
        capacityVolumeM3: 95,
        bodyType: 'GRADE_BAIXA',
        status: 'ATIVO',
        trackerInstalled: true,
        createdAt: '2026-02-05T09:45:00.000Z'
      }
    ];

    // 5. Freights (Initial set matching the MVP prompt)
    this.freights = [
      {
        id: 'freight-0001',
        code: 'FRT-2026-0001',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '15015-000',
          address: 'Av. Alberto Andaló',
          number: '3100',
          neighborhood: 'Centro',
          city: 'São José do Rio Preto',
          state: 'SP',
          date: '2026-08-25',
          timeWindow: '08:00 às 11:00',
          contactName: 'Almoxarifado Central TransLog',
          contactPhone: '(17) 3214-5500'
        },
        destination: {
          zipCode: '01001-000',
          address: 'Praça da Sé / CD Mooca',
          number: '850',
          neighborhood: 'Mooca',
          city: 'São Paulo',
          state: 'SP',
          date: '2026-08-26',
          timeWindow: '14:00 às 18:00',
          contactName: 'Recepção CD Capital',
          contactPhone: '(11) 3344-9000'
        },
        distanceKm: 440,
        cargo: {
          description: 'Carga geral paletizada - Peças industriais e componentes automotivos',
          type: 'GERAL',
          weightKg: 8500,
          volumeCount: 16,
          dimensions: '16 pallets padrão PBR (1,00 x 1,20m)',
          requiresInsurance: true,
          notes: 'Carga com nota fiscal e manifesto eletrônico já emitidos. Necessário lonamento ou baú fechado.'
        },
        requirements: {
          vehicleType: 'TRUCK',
          bodyTypeRequired: 'BAU',
          minCapacityKg: 8000,
          helperRequired: false,
          trackerRequired: true,
          cnhMinCategory: 'C'
        },
        payment: {
          price: 1850.00,
          paymentMethod: 'PIX',
          tollIncluded: true,
          advancePercentage: 70,
          notes: '70% de adiantamento na confirmação do carregamento e 30% no comprovante de entrega assinado via app.'
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'RASCUNHO',
            timestamp: '2026-08-22T14:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Criação do pedido de frete inicial'
          },
          {
            status: 'PUBLICADO',
            timestamp: '2026-08-22T14:30:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Aprovado pelo operacional'
          },
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T15:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Liberado para aceite de motoristas com veículo Truck'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T14:00:00.000Z',
        updatedAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'freight-0002',
        code: 'FRT-2026-0002',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '13080-000',
          address: 'Rodovia Dom Pedro I',
          number: 'Km 132',
          neighborhood: 'Barão Geraldo',
          city: 'Campinas',
          state: 'SP',
          date: '2026-08-25',
          timeWindow: '07:00 às 10:00',
          contactName: 'Centro de Distribuição Sul',
          contactPhone: '(19) 3871-1200'
        },
        destination: {
          zipCode: '80010-000',
          address: 'Av. das Indústrias',
          number: '1420',
          neighborhood: 'CIC',
          city: 'Curitiba',
          state: 'PR',
          date: '2026-08-27',
          timeWindow: '08:00 às 12:00',
          contactName: 'Logística Paraná',
          contactPhone: '(41) 3232-4400'
        },
        distanceKm: 420,
        cargo: {
          description: 'Eletroeletrônicos e insumos de informática lacrados',
          type: 'GERAL',
          weightKg: 6200,
          volumeCount: 22,
          dimensions: '22 caixas paletizadas',
          requiresInsurance: true,
          notes: 'Carga de alto valor agregado com monitoramento obrigatório.'
        },
        requirements: {
          vehicleType: 'TOCO',
          bodyTypeRequired: 'SIDER',
          minCapacityKg: 6000,
          trackerRequired: true,
          cnhMinCategory: 'D'
        },
        payment: {
          price: 3200.00,
          paymentMethod: 'TRANSFERENCIA',
          tollIncluded: true,
          advancePercentage: 50,
          notes: 'Pagamento 50% saída + 50% após canhoto digital.'
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T16:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Frete disponibilizado para tocos e trucks'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T16:00:00.000Z',
        updatedAt: '2026-08-22T16:00:00.000Z'
      },
      {
        id: 'freight-0003',
        code: 'FRT-2026-0003',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '14055-000',
          address: 'Av. Bandeirantes',
          number: '2500',
          neighborhood: 'Vila Tibério',
          city: 'Ribeirão Preto',
          state: 'SP',
          date: '2026-08-26',
          timeWindow: '09:00 às 13:00'
        },
        destination: {
          zipCode: '30110-000',
          address: 'Anel Rodoviário',
          number: 'Km 12',
          neighborhood: 'Olhos D’Água',
          city: 'Belo Horizonte',
          state: 'MG',
          date: '2026-08-28',
          timeWindow: '08:00 às 16:00'
        },
        distanceKm: 510,
        cargo: {
          description: 'Bebidas embaladas em garrafas e latas',
          type: 'ALIMENTOS',
          weightKg: 24000,
          volumeCount: 30,
          requiresInsurance: true
        },
        requirements: {
          vehicleType: 'CARRETA',
          bodyTypeRequired: 'GRADE_BAIXA',
          minCapacityKg: 22000,
          cnhMinCategory: 'E'
        },
        payment: {
          price: 4950.00,
          paymentMethod: 'PIX',
          tollIncluded: true,
          advancePercentage: 70
        },
        status: 'DISPONIVEL',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-22T16:45:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira',
            notes: 'Frete pesado para Carreta liberado'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        createdAt: '2026-08-22T16:45:00.000Z',
        updatedAt: '2026-08-22T16:45:00.000Z'
      },
      {
        id: 'freight-0004',
        code: 'FRT-2026-0004',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        origin: {
          zipCode: '11013-000',
          address: 'Avenida Portuária',
          number: '400',
          neighborhood: 'Porto',
          city: 'Santos',
          state: 'SP',
          date: '2026-08-21',
          timeWindow: '08:00'
        },
        destination: {
          zipCode: '74000-000',
          address: 'Distrito Agroindustrial',
          number: '120',
          neighborhood: 'Setor Sul',
          city: 'Goiânia',
          state: 'GO',
          date: '2026-08-24',
          timeWindow: '14:00'
        },
        distanceKm: 980,
        cargo: {
          description: 'Insumos agrícolas e adubos especiais',
          type: 'GERAL',
          weightKg: 12500,
          volumeCount: 20
        },
        requirements: {
          vehicleType: 'TRUCK',
          bodyTypeRequired: 'BAU',
          minCapacityKg: 12000,
          cnhMinCategory: 'C'
        },
        payment: {
          price: 5400.00,
          paymentMethod: 'PIX',
          tollIncluded: true
        },
        status: 'EM_TRANSITO',
        statusHistory: [
          {
            status: 'DISPONIVEL',
            timestamp: '2026-08-21T08:00:00.000Z',
            changedByUserId: 'user-admin-1',
            changedByName: 'Mariana Silveira'
          },
          {
            status: 'RESERVADO',
            timestamp: '2026-08-21T09:15:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva',
            notes: 'Frete aceito pelo motorista João da Silva'
          },
          {
            status: 'EM_COLETA',
            timestamp: '2026-08-21T11:00:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva'
          },
          {
            status: 'COLETADO',
            timestamp: '2026-08-21T13:30:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva'
          },
          {
            status: 'EM_TRANSITO',
            timestamp: '2026-08-22T08:00:00.000Z',
            changedByUserId: 'user-driver-joao',
            changedByName: 'João da Silva',
            location: 'Rod. Transbrasiliana - Km 340'
          }
        ],
        createdByUserId: 'user-admin-1',
        createdByName: 'Mariana Silveira',
        assignedDriverId: 'driver-joao-01',
        assignedDriverName: 'João da Silva',
        assignedDriverPhone: '(17) 98112-9090',
        assignedVehiclePlate: 'BRA2E19',
        assignedVehicleModel: 'Mercedes-Benz Atego 2426',
        assignedAt: '2026-08-21T09:15:00.000Z',
        startedAt: '2026-08-21T11:00:00.000Z',
        collectedAt: '2026-08-21T13:30:00.000Z',
        inTransitAt: '2026-08-22T08:00:00.000Z',
        createdAt: '2026-08-21T08:00:00.000Z',
        updatedAt: '2026-08-22T08:00:00.000Z'
      }
    ];

    // 6. Configurable Forms (SaaS Form Builder)
    this.forms = [
      {
        id: 'form-checklist-elolog',
        tenantId: 'tenant-translog-01',
        title: 'Checklist / Vistoria de Entrega e Retirada de Veículo e Carga (Modelo Elo Log)',
        description: 'Modelo oficial de vistoria e checklist de entrega/retirada com conferência de documentos, avarias, 17 itens de equipamentos, odômetro (KM) e assinaturas de origem/destino.',
        category: 'CHECKLIST_ENTREGA',
        triggerEvent: 'NA_ENTREGA',
        active: true,
        fields: [
          { id: 'el_cliente', name: 'cliente', label: 'Cliente', type: 'text', required: true, order: 1 },
          { id: 'el_cliente_email', name: 'cliente_email', label: 'E-mail do Cliente / Notificação', type: 'email', required: false, order: 2 },
          { id: 'el_cliente_telefone', name: 'cliente_telefone', label: 'Telefone / WhatsApp Cliente', type: 'phone', required: false, order: 3 },
          { id: 'el_data_retirada', name: 'data_retirada', label: 'Data Retirada', type: 'date', required: true, order: 4 },
          { id: 'el_km_retirada', name: 'km_retirada', label: 'KM Retirada', type: 'number', required: true, order: 5 },
          { id: 'el_local_retirada', name: 'local_retirada', label: 'Local Retirada', type: 'text', required: true, order: 6 },
          { id: 'el_data_entrega', name: 'data_entrega', label: 'Data Entrega', type: 'date', required: true, order: 7 },
          { id: 'el_km_entrega', name: 'km_entrega', label: 'KM Entrega', type: 'number', required: true, order: 8 },
          { id: 'el_local_entrega', name: 'local_entrega', label: 'Local Entrega', type: 'text', required: true, order: 9 },
          { id: 'el_marca_veiculo', name: 'marca_veiculo', label: 'Marca do Veículo', type: 'select', options: ['Volkswagen', 'Mercedes-Benz', 'Iveco', 'Scania', 'Ford', 'Volvo', 'Outro'], required: true, order: 10 },
          { id: 'el_modelo', name: 'modelo', label: 'Modelo do Veículo', type: 'text', required: true, order: 11 },
          { id: 'el_cor', name: 'cor', label: 'Cor', type: 'text', required: true, order: 12 },
          { id: 'el_placa', name: 'placa', label: 'Placa', type: 'text', required: true, order: 13 },
          { id: 'el_chassi', name: 'chassi', label: 'Chassi', type: 'text', required: false, order: 14 },
          { id: 'el_docs', name: 'documentos', label: 'Documentos Presentes (CRLV, Danfe Veículo, Manual, Danfe Equipamento)', type: 'checkbox', options: ['CRLV', 'Danfe Veículo', 'Manual', 'Danfe Equipamento'], required: false, order: 15 },
          { id: 'el_avarias', name: 'avarias_resumo', label: 'Apontamento de Avarias (Lataria, Pintura, Parabrisa, Interior, Pneus)', type: 'textarea', placeholder: 'Detalhe se houver avarias...', required: false, order: 16 },
          { id: 'el_equipamentos', name: 'equipamentos_status', label: 'Conferência dos 17 Equipamentos Obrigatórios', type: 'radio', options: ['100% Conforme (Todos itens presentes)', 'Com Pendências / Ausências'], required: true, order: 17 },
          { id: 'el_resp_origem_nome', name: 'resp_origem_nome', label: 'Responsável Vistoria (Origem) - Nome', type: 'text', required: true, order: 18 },
          { id: 'el_resp_origem_cpf', name: 'resp_origem_cpf', label: 'Responsável Vistoria (Origem) - CPF', type: 'cpf', required: true, order: 19 },
          { id: 'el_resp_origem_email', name: 'resp_origem_email', label: 'Responsável Vistoria (Origem) - Email', type: 'email', required: false, order: 20 },
          { id: 'el_resp_origem_telefone', name: 'resp_origem_telefone', label: 'Responsável Vistoria (Origem) - Telefone', type: 'phone', required: false, order: 21 },
          { id: 'el_resp_origem_assinatura', name: 'resp_origem_assinatura', label: 'Assinatura Digital (Origem / Retirada)', type: 'signature', required: true, order: 22 },
          { id: 'el_resp_destino_nome', name: 'resp_destino_nome', label: 'Responsável Vistoria (Destino) - Nome', type: 'text', required: true, order: 23 },
          { id: 'el_resp_destino_cpf', name: 'resp_destino_cpf', label: 'Responsável Vistoria (Destino) - CPF', type: 'cpf', required: true, order: 24 },
          { id: 'el_resp_destino_email', name: 'resp_destino_email', label: 'Responsável Vistoria (Destino) - Email', type: 'email', required: false, order: 25 },
          { id: 'el_resp_destino_telefone', name: 'resp_destino_telefone', label: 'Responsável Vistoria (Destino) - Telefone', type: 'phone', required: false, order: 26 },
          { id: 'el_resp_destino_assinatura', name: 'resp_destino_assinatura', label: 'Assinatura Digital (Destino / Entrega)', type: 'signature', required: true, order: 27 },
          { id: 'el_condutor', name: 'condutor_elo', label: 'Condutor da ELO (Motorista)', type: 'text', required: true, order: 28 },
          { id: 'el_fotos', name: 'fotos_vistoria', label: 'Fotos do Veículo / Avarias / Painel KM', type: 'photo', required: false, order: 29 }
        ],
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: isoNow
      },
      {
        id: 'form-checklist-coleta',
        tenantId: 'tenant-translog-01',
        title: 'Checklist de Coleta e Inspeção de Carga',
        description: 'Formulário obrigatório executado pelo motorista no momento do carregamento da mercadoria.',
        category: 'CHECKLIST_COLETA',
        triggerEvent: 'DURANTE_COLETA',
        active: true,
        fields: [
          {
            id: 'f1',
            name: 'carga_conferida_com_nf',
            label: 'A quantidade de volumes confere com a Nota Fiscal?',
            type: 'radio',
            required: true,
            options: ['Sim, 100% conferido', 'Divergência parcial', 'Não foi possível contar'],
            order: 1
          },
          {
            id: 'f2',
            name: 'estado_embalagem',
            label: 'Qual o estado aparente das embalagens/pallets?',
            type: 'select',
            required: true,
            options: ['Excelente / Lacrado', 'Bom estado', 'Pequenas avarias superficiais', 'Embalagens rasgadas/danificadas'],
            order: 2
          },
          {
            id: 'f3',
            name: 'numero_lacre',
            label: 'Número do lacre do baú/sider (se aplicável)',
            type: 'text',
            placeholder: 'Ex: LCR-887412',
            required: false,
            order: 3
          },
          {
            id: 'f4',
            name: 'foto_carga_coleta',
            label: 'Foto da carga estivada no veículo',
            type: 'photo',
            required: true,
            order: 4
          },
          {
            id: 'f5',
            name: 'observacoes_coleta',
            label: 'Observações adicionais da coleta',
            type: 'textarea',
            placeholder: 'Descreva qualquer detalhe relevante sobre o carregamento...',
            required: false,
            order: 5
          }
        ],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: isoNow
      },
      {
        id: 'form-comprovante-entrega',
        tenantId: 'tenant-translog-01',
        title: 'Comprovante Digital de Entrega (Canhoto & Assinatura)',
        description: 'Formulário para finalização do frete com captura do canhoto assinado e dados do recebedor.',
        category: 'COMPROVANTE_ENTREGA',
        triggerEvent: 'NA_ENTREGA',
        active: true,
        fields: [
          {
            id: 'f10',
            name: 'nome_recebedor',
            label: 'Nome completo do recebedor na descarga',
            type: 'text',
            placeholder: 'Nome de quem recebeu e conferiu',
            required: true,
            order: 1
          },
          {
            id: 'f11',
            name: 'documento_recebedor',
            label: 'CPF ou RG do recebedor',
            type: 'text',
            placeholder: 'Ex: 123.456.789-00',
            required: true,
            order: 2
          },
          {
            id: 'f12',
            name: 'foto_canhoto_assinado',
            label: 'Foto nítida do canhoto da Nota Fiscal assinado e carimbado',
            type: 'photo',
            required: true,
            order: 3
          },
          {
            id: 'f13',
            name: 'assinatura_digital',
            label: 'Assinatura digital do recebedor na tela',
            type: 'signature',
            required: true,
            order: 4
          },
          {
            id: 'f14',
            name: 'ocorrencia_descarga',
            label: 'Houve alguma ressalva ou ocorrência na entrega?',
            type: 'radio',
            required: true,
            options: ['Entrega realizada sem ressalvas', 'Avaria parcial apontada no canhoto', 'Falta de mercadoria'],
            order: 5
          }
        ],
        createdAt: '2026-01-22T14:00:00.000Z',
        updatedAt: isoNow
      }
    ];

    // 7. Notifications
    this.notifications = [
      {
        id: 'notif-001',
        tenantId: 'tenant-translog-01',
        userId: 'user-driver-joao',
        freightId: 'freight-0001',
        type: 'FRETE_DISPONIVEL',
        title: '🚚 Novo frete disponível para seu perfil!',
        message: 'São José do Rio Preto/SP ➡️ São Paulo/SP | Valor: R$ 1.850,00 (Veículo Truck)',
        read: false,
        createdAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'notif-002',
        tenantId: 'tenant-translog-01',
        userId: 'user-admin-1',
        freightId: 'freight-0004',
        type: 'STATUS_ATUALIZADO',
        title: '📍 Frete #FRT-2026-0004 em trânsito',
        message: 'O motorista João da Silva iniciou a viagem de Santos/SP para Goiânia/GO.',
        read: true,
        createdAt: '2026-08-22T08:05:00.000Z'
      }
    ];

    // 8. Audit Logs
    this.auditLogs = [
      {
        id: 'audit-001',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-admin-1',
        userName: 'Mariana Silveira',
        userRole: 'ADMIN',
        action: 'PUBLICACAO_FRETE',
        entity: 'Freight',
        entityId: 'freight-0001',
        details: 'Publicou o frete FRT-2026-0001 (São José do Rio Preto/SP -> São Paulo/SP, R$ 1.850,00)',
        ip: '189.45.112.90',
        createdAt: '2026-08-22T15:00:00.000Z'
      },
      {
        id: 'audit-002',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-driver-joao',
        userName: 'João da Silva',
        userRole: 'MOTORISTA',
        action: 'ACEITE_FRETE',
        entity: 'Freight',
        entityId: 'freight-0004',
        details: 'Motorista aceitou e reservou o frete FRT-2026-0004 (Santos/SP -> Goiânia/GO)',
        ip: '177.33.201.12',
        createdAt: '2026-08-21T09:15:00.000Z'
      },
      {
        id: 'audit-003',
        tenantId: 'tenant-translog-01',
        tenantName: 'TransLog Brasil Transportes',
        userId: 'user-empresa-superadmin-1',
        userName: 'Carlos Alberto Ferreira',
        userRole: 'EMPRESA_SUPER_ADMIN',
        action: 'CRIACAO_FORMULARIO',
        entity: 'FormDefinition',
        entityId: 'form-comprovante-entrega',
        details: 'Configurou o formulário de Comprovante Digital de Entrega',
        ip: '189.45.112.90',
        createdAt: '2026-01-22T14:00:00.000Z'
      }
    ];

    // Seed Trip Expenses & Accountability Reports
    this.tripExpenses = [
      {
        id: 'exp-rep-001',
        tenantId: 'tenant-translog-01',
        freightId: 'freight-001',
        freightCode: 'FRT-2026-0001',
        driverId: 'driver-001',
        driverName: 'Marcos Vinicius da Silva',
        driverPhone: '(11) 98765-4321',
        vehiclePlate: 'BRA2E19',
        startDate: '2026-08-20',
        endDate: '2026-08-23',
        tripDays: 4,
        initialKm: 142300,
        finalKm: 144180,
        totalKm: 1880,
        totalLiters: 650,
        averageKmPerLiter: 2.89,
        costPerKm: 2.38,
        advanceAmount: 5000.00,
        totalExpenses: 4478.50,
        balanceAmount: 521.50,
        balanceStatus: 'A_DEVOLVER',
        status: 'ENVIADO',
        generalNotes: 'Viagem tranquila entre Santos/SP e Cuiabá/MT. Abastecimentos realizados nos postos conveniados.',
        items: [
          {
            id: 'item-exp-1',
            category: 'ABASTECIMENTO',
            date: '2026-08-20',
            description: 'Abastecimento Diesel S10 320L',
            establishmentName: 'Posto Graal Rodovia dos Bandeirantes',
            documentNumber: 'NF-e 883921',
            amount: 1984.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            liters: 320,
            pricePerLiter: 6.20,
            odometerKm: 142450,
            fuelType: 'DIESEL_S10',
            createdAt: '2026-08-20T11:30:00Z'
          },
          {
            id: 'item-exp-2',
            category: 'PEDAGIO',
            date: '2026-08-20',
            description: 'Recarga de Tag Sem Parar',
            establishmentName: 'AutoBAn Concessionária',
            documentNumber: 'REC-3901',
            amount: 420.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            createdAt: '2026-08-20T08:00:00Z'
          },
          {
            id: 'item-exp-3',
            category: 'HOSPEDAGEM',
            date: '2026-08-21',
            description: 'Pernoite e Estacionamento Seguro',
            establishmentName: 'Hotel Trevo Rondonópolis',
            documentNumber: 'NFS-e 4492',
            amount: 180.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            nightsCount: 1,
            createdAt: '2026-08-21T21:00:00Z'
          },
          {
            id: 'item-exp-4',
            category: 'ABASTECIMENTO',
            date: '2026-08-22',
            description: 'Abastecimento Diesel S10 330L',
            establishmentName: 'Posto Ipiranga Rondonópolis MT',
            documentNumber: 'NF-e 992014',
            amount: 2079.00,
            paymentMethod: 'ADIANTAMENTO_EMPRESA',
            liters: 330,
            pricePerLiter: 6.30,
            odometerKm: 143600,
            fuelType: 'DIESEL_S10',
            createdAt: '2026-08-22T14:45:00Z'
          },
          {
            id: 'item-exp-5',
            category: 'ALIMENTACAO',
            date: '2026-08-22',
            description: 'Almoço e janta no trajeto',
            establishmentName: 'Restaurante Estrada Real',
            documentNumber: 'CF 5591',
            amount: 85.50,
            paymentMethod: 'DINHEIRO_PROPRIO',
            createdAt: '2026-08-22T19:30:00Z'
          },
          {
            id: 'item-exp-6',
            category: 'LOCOMOCAO_URBANA',
            date: '2026-08-23',
            description: 'Deslocamento Uber do pátio ao hotel',
            establishmentName: 'Uber Brasil',
            documentNumber: 'UBR-99201',
            amount: 40.00,
            paymentMethod: 'PIX_PROPRIO',
            transportOrigin: 'Pátio Logístico Cuiabá',
            transportDestination: 'Hotel Central',
            createdAt: '2026-08-23T18:00:00Z'
          }
        ],
        createdAt: '2026-08-23T14:00:00.000Z',
        updatedAt: '2026-08-23T14:00:00.000Z'
      }
    ];
  }

  getNextTalaoNumber(): string {
    let highest = 0;
    for (const resp of this.formResponses) {
      if (resp.answers && resp.answers.talaoNumber) {
        const raw = String(resp.answers.talaoNumber).replace(/\D/g, '');
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n > highest && n < 100000) {
          highest = n;
        }
      }
    }
    const nextVal = highest + 1;
    return String(nextVal).padStart(3, '0');
  }
}

// Export singleton instance
export const db = new DatabaseStore();
