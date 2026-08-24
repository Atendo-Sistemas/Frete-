export interface WebPage {
  id: string;
  tenantId: string | null; // null for global/superadmin
  slug: string;
  title: string;
  content: string; // HTML or Markdown
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  tenantId: string | null; // null for global/superadmin
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  author: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'EMPRESA_SUPER_ADMIN' 
  | 'ADMIN' 
  | 'SUPERVISOR' 
  | 'USUARIO' 
  | 'MOTORISTA';

export type TenantStatus = 'ATIVA' | 'INATIVA' | 'BLOQUEADA' | 'PENDENTE';
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'PENDENTE';
export type DriverStatus = 'DISPONIVEL' | 'EM_VIAGEM' | 'INATIVO' | 'PENDENTE';
export type VehicleStatus = 'ATIVO' | 'MANUTENCAO' | 'INATIVO';

export type VehicleType = 
  | 'TRUCK' 
  | 'TOCO' 
  | 'CARRETA' 
  | 'BITREM' 
  | 'RODOTREM'
  | 'VUC' 
  | 'FIORINO' 
  | 'UTILITARIO' 
  | 'VAN';

export type BodyType = 
  | 'BAU' 
  | 'SIDER' 
  | 'GRADE_BAIXA' 
  | 'GRANELEIRO' 
  | 'REFRIGERADO' 
  | 'CACAMBA' 
  | 'PLATAFORMA'
  | 'TANQUE';

export type CargoType = 
  | 'GERAL' 
  | 'FRAGIL' 
  | 'REFRIGERADA' 
  | 'PERIGOSA' 
  | 'ALIMENTOS' 
  | 'CONSTRUCAO' 
  | 'MAQUINARIO'
  | 'GRAOS';

export type PaymentMethod = 
  | 'TRANSFERENCIA' 
  | 'PIX' 
  | 'A_VISTA' 
  | 'FATURADO_30D'
  | 'FATURADO_15D'
  | 'ADIANTAMENTO_70_30';

export type FreightStatus = 
  | 'RASCUNHO' 
  | 'PUBLICADO' 
  | 'DISPONIVEL' 
  | 'RESERVADO' 
  | 'EM_COLETA' 
  | 'COLETADO' 
  | 'EM_TRANSITO' 
  | 'ENTREGUE' 
  | 'FINALIZADO' 
  | 'CANCELADO';

export interface TenantPlanLimits {
  maxUsers: number;
  maxDrivers: number;
  maxFreightsMonthly: number;
  customForms: boolean;
  exportReports: boolean;
  prioritySupport: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  status: TenantStatus;
  plan: 'BASICO' | 'PROFISSIONAL' | 'EMPRESARIAL';
  planLimits: TenantPlanLimits;
  allowedOperations?: OperationType[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string | null; // null for SUPER_ADMIN
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  driverId?: string; // If role is MOTORISTA
  password?: string; // For company logins
  lastLoginAt?: string;
  termsAcceptedAt?: string;
  privacyAcceptedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  zipCode: string;
  address: string;
  city: string;
  state: string;
  cnh: string;
  cnhCategory: 'B' | 'C' | 'D' | 'E';
  cnhExpiresAt: string;
  status: DriverStatus;
  rating: number;
  completedTrips: number;
  vehiclesCount?: number;
  rntrc?: string;
  notes?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKeyType?: string;
  pixKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  tenantId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  renavam: string;
  capacityKg: number;
  capacityVolumeM3?: number;
  bodyType: BodyType;
  status: VehicleStatus;
  trackerInstalled?: boolean;
  createdAt: string;
}

export interface FreightLocation {
  zipCode: string;
  address: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  date: string;
  timeWindow?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface FreightCargo {
  description: string;
  type: CargoType | 'VEICULO';
  weightKg: number;
  volumeCount: number;
  dimensions?: string;
  requiresInsurance?: boolean;
  notes?: string;
  
  // Detalhes da Carga / Veículo Transportado (Liberado após aceite)
  vehicleProduct?: string;
  chassis?: string;
  nfVehicleSale?: string;
  nfFacchini?: string;
  trackerStatus?: string;
  platesStatus?: string;
}

export interface FreightRequirements {
  vehicleType: VehicleType;
  vehicleBrand?: string;
  bodyTypeRequired?: BodyType;
  minCapacityKg: number;
  helperRequired?: boolean;
  trackerRequired?: boolean;
  cnhMinCategory?: 'B' | 'C' | 'D' | 'E';
}

export interface FreightPayment {
  price: number; // Used for general cargo or as a fallback
  clientRevenue?: number; // Valor cobrado do cliente (NF/CT-e)
  driverCost?: number; // Valor repassado ao motorista
  paymentMethod: PaymentMethod;
  tollIncluded: boolean;
  advancePercentage?: number;
  notes?: string;
}

export type OperationType = 'CARGA_GERAL' | 'LOGISTICA_VEICULOS';

export interface FreightStatusHistoryEntry {
  status: FreightStatus;
  timestamp: string;
  changedByUserId: string;
  changedByName: string;
  notes?: string;
  location?: string;
}

export interface Freight {
  id: string;
  code: string;
  tenantId: string;
  tenantName?: string;
  operationType?: OperationType;
  origin: FreightLocation;
  destination: FreightLocation;
  distanceKm: number;
  cargo: FreightCargo;
  requirements: FreightRequirements;
  payment: FreightPayment;
  status: FreightStatus;
  statusHistory: FreightStatusHistoryEntry[];
  createdByUserId: string;
  createdByName: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehiclePlate?: string;
  assignedVehicleModel?: string;
  assignedAt?: string;
  startedAt?: string;
  collectedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  formResponsesCount?: number;
  createdAt: string;
  updatedAt: string;
  customData?: Record<string, any>;
}

export type NotificationType = 
  | 'FRETE_DISPONIVEL' 
  | 'FRETE_ACEITO' 
  | 'STATUS_ATUALIZADO' 
  | 'FRETE_CANCELADO' 
  | 'SISTEMA';

export interface AppNotification {
  id: string;
  tenantId: string | null;
  userId: string;
  freightId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'cpf' 
  | 'cnpj' 
  | 'phone' 
  | 'email' 
  | 'date' 
  | 'time' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'file' 
  | 'photo' 
  | 'signature';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select, radio, checkbox
  order: number;
}

export type FormEventTrigger = 
  | 'ANTES_COLETA' 
  | 'DURANTE_COLETA' 
  | 'EM_TRANSITO' 
  | 'NA_ENTREGA' 
  | 'FINALIZACAO' 
  | 'MANUAL';

export interface FormDefinition {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: 'CHECKLIST_COLETA' | 'CHECKLIST_ENTREGA' | 'COMPROVANTE_ENTREGA' | 'AVALIACAO_MOTORISTA' | 'CADASTRO_MOTORISTA' | 'OCORRENCIA';
  fields: FormField[];
  triggerEvent: FormEventTrigger;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  tenantId: string;
  freightId?: string;
  driverId?: string;
  filledByUserId: string;
  filledByName: string;
  stage?: 'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO';
  isDraft?: boolean;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  tenantName?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ip?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalFreights: number;
  availableFreights: number;
  reservedFreights: number;
  inProgressFreights: number;
  completedFreights: number;
  cancelledFreights: number;
  totalFreightValue: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  totalUsers: number;
  recentFreights: Freight[];
  recentActivities: AuditLog[];
}

export interface WhatsAppConfig {
  baseUrl: string;
  token: string;
  defaultChannelNumber?: string;
  isActive: boolean;
  autoNotifyChecklist: boolean;
  autoNotifyFreightStatus: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'ERROR';
  lastTestMessage?: string;
}

export interface WhatsAppNotificationPayload {
  phone: string;
  message: string;
  freightCode?: string;
  templateType?: string;
  externalKey?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  useButtonApi?: boolean;
  buttons?: Array<{ id: string; text: string }>;
}

export interface PlanConfig {
  id: 'BASICO' | 'PROFISSIONAL' | 'EMPRESARIAL';
  name: string;
  price: number;
  maxFreightsPerMonth: number;
  maxUsers: number;
  maxDrivers: number;
  isActive: boolean;
}

export interface SaaSLayoutConfig {
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  navbarStyle: 'dark' | 'light' | 'colored';
  logoText?: string;
  systemBackground: 'minimal' | 'warm' | 'slate';
  homeBadgeText?: string;
  homeTitle?: string;
  homeTitleAccent?: string;
  homeSubtitle?: string;
}

export interface FormFieldSetting {
  id: string;
  originalLabel: string;
  label: string;
  placeholder: string;
  enabled: boolean;
  required: boolean;
}

export interface SaaSFormFieldsConfig {
  userForm: FormFieldSetting[];
  freightForm: FormFieldSetting[];
  driverForm: FormFieldSetting[];
  expenseForm: FormFieldSetting[];
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password?: string; // Should be handled carefully, maybe just for display
  senderEmail: string;
  testEmail?: string;
  isActive: boolean;
}

export interface SqlDatabaseConfig {
  enabled: boolean;
  dbType: 'postgres' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl: boolean;
  poolMax?: number;
  autoMigrate: boolean;
  connectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  lastTestedAt?: string;
}

export interface ImageCompressionConfig {
  enabled: boolean;
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.1 to 1.0
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  autoCompressDocuments: boolean;
  maxFileSizeKB: number;
}

export interface MapboxConfig {
  enabled: boolean;
  apiKey: string;
  defaultZoom: number;
  defaultStyle: 'streets-v12' | 'satellite-streets-v12' | 'dark-v11' | 'light-v11' | 'navigation-night-v1';
  enableLiveTracking: boolean;
  updateIntervalSeconds: number;
}

export interface SaaSGlobalConfig {
  systemName: string;
  supportPhone: string;
  supportEmail: string;
  defaultCommissionPercent: number;
  requireChecklistPhotos: boolean;
  minDriverAge: number;
  otpExpirationMinutes: number;
  allowSelfRegistration: boolean;
  plans: PlanConfig[];
  layout?: SaaSLayoutConfig;
  formFields?: SaaSFormFieldsConfig;
  emailConfig?: EmailConfig;
  databaseConfig?: SqlDatabaseConfig;
  imageCompression?: ImageCompressionConfig;
  mapboxConfig?: MapboxConfig;
}

export type ExpenseCategory = 
  | 'ABASTECIMENTO'
  | 'HOSPEDAGEM'
  | 'PEDAGIO'
  | 'LOCOMOCAO_URBANA' // Uber, Táxi, Ônibus, Metrô
  | 'PASSAGEM_AEREA'
  | 'PASSAGEM_RODOVIARIA'
  | 'ALIMENTACAO'
  | 'MANUTENCAO_BORRACHARIA'
  | 'ESTACIONAMENTO'
  | 'BALSA'
  | 'OUTROS';

export interface TripExpenseItem {
  id: string;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  description: string;
  establishmentName?: string; // Nome do Posto / Hotel / Cia / Estabelecimento
  documentNumber?: string; // Nº Cupom Fiscal / NF / Bilhete
  amount: number;
  paymentMethod: 'ADIANTAMENTO_EMPRESA' | 'CARTAO_CORPORATIVO' | 'DINHEIRO_PROPRIO' | 'PIX_PROPRIO' | 'TAG_AUTOMATICA';
  
  // Specific category fields
  liters?: number; // For Abastecimento
  pricePerLiter?: number; // For Abastecimento
  odometerKm?: number; // Km no momento do abastecimento
  fuelType?: 'DIESEL_S10' | 'DIESEL_S500' | 'GASOLINA' | 'ETANOL' | 'ARLA_32';
  arlaLiters?: number; // Quantidade de Arla
  arlaAmount?: number; // Valor gasto com Arla
  
  nightsCount?: number; // For Hospedagem
  transportOrigin?: string; // For Passagens / Locomoção
  transportDestination?: string; // For Passagens / Locomoção
  
  receiptPhotoUrl?: string; // Deprecated: keep for backwards compatibility
  receiptPhotoUrls?: string[]; // Multiple photos support
  notes?: string;
  createdAt: string;
}

export type TripExpenseStatus = 
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'QUITADO';

export interface TripExpenseReport {
  id: string;
  tenantId?: string;
  freightId?: string;
  freightCode?: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  vehiclePlate?: string;
  chassis?: string;
  vehicleModel?: string;
  clientName?: string;
  
  // Trip general info
  startDate: string; // YYYY-MM-DD or ISO
  endDate: string; // YYYY-MM-DD or ISO
  tripDays: number;
  initialKm: number;
  finalKm: number;
  totalKm: number;
  totalLiters: number;
  averageKmPerLiter: number;
  costPerKm: number;
  
  // Financial Summary
  advanceAmount: number; // Adiantamento recebido da empresa
  driverLaborAmount?: number; // Mão de obra do motorista
  totalExpenses: number; // Total de despesas comprovadas
  balanceAmount: number; // advanceAmount - totalExpenses (Positivo = A Devolver / Negativo = A Reembolsar)
  balanceStatus: 'A_DEVOLVER' | 'REEMBOLSO_A_RECEBER' | 'QUITADO';
  
  status: TripExpenseStatus;
  items: TripExpenseItem[];
  
  generalNotes?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

