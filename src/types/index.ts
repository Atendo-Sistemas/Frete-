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
  lastLoginAt?: string;
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
  type: CargoType;
  weightKg: number;
  volumeCount: number;
  dimensions?: string;
  requiresInsurance?: boolean;
  notes?: string;
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
  price: number;
  paymentMethod: PaymentMethod;
  tollIncluded: boolean;
  advancePercentage?: number;
  notes?: string;
}

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
