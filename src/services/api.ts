import { 
  User, 
  Tenant, 
  Driver, 
  Vehicle, 
  Freight, 
  FreightStatus, 
  AppNotification, 
  FormDefinition, 
  FormResponse, 
  AuditLog, 
  DashboardStats,
  WhatsAppConfig,
  WhatsAppNotificationPayload
} from '../types';

let currentToken: string = 'user-admin-1';

export const setAuthToken = (token: string) => {
  currentToken = token;
  localStorage.setItem('frete_auth_token', token);
};

export const getAuthToken = (): string => {
  if (!currentToken) {
    currentToken = localStorage.getItem('frete_auth_token') || 'user-admin-1';
  }
  return currentToken;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ocorreu um erro na requisição');
  }

  return data as T;
}

export const api = {
  // Auth
  async getMe() {
    return request<{
      user: User;
      tenant: Tenant | null;
      driver?: Driver;
      vehicles: Vehicle[];
      availableDemoAccounts: Array<{ id: string; name: string; email: string; role: string; tenantId: string | null; driverId?: string }>;
    }>('/auth/me');
  },

  async login(email: string, role?: string) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
  },

  async registerDriver(data: any) {
    return request<{ user: User; driver: Driver; vehicle: Vehicle; token: string }>('/auth/register-driver', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Tenants
  async getTenants() {
    return request<Tenant[]>('/tenants');
  },

  async createTenant(data: Partial<Tenant>) {
    return request<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTenant(id: string, data: Partial<Tenant>) {
    return request<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTenant(id: string) {
    return request<{ success: boolean; message: string }>(`/tenants/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  async getUsers() {
    return request<User[]>('/users');
  },

  async createUser(data: Partial<User>) {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Drivers & Vehicles
  async getDrivers() {
    return request<Driver[]>('/drivers');
  },

  async updateDriver(id: string, data: Partial<Driver>) {
    return request<Driver>(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getDriverDetails(id: string) {
    return request<{ driver: Driver; vehicles: Vehicle[]; freightsHistory: Freight[] }>(`/drivers/${id}`);
  },

  async getVehicles() {
    return request<Vehicle[]>('/vehicles');
  },

  // Freights
  async getFreights(params?: { status?: string; originCity?: string; destinationCity?: string; vehicleType?: string; onlyMine?: boolean }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.originCity) query.set('originCity', params.originCity);
    if (params?.destinationCity) query.set('destinationCity', params.destinationCity);
    if (params?.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params?.onlyMine) query.set('onlyMine', 'true');
    
    return request<Freight[]>(`/freights?${query.toString()}`);
  },

  async getFreight(id: string) {
    return request<Freight & { formResponses: FormResponse[] }>(`/freights/${id}`);
  },

  async createFreight(data: any) {
    return request<Freight>('/freights', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateFreight(id: string, data: any) {
    return request<Freight>(`/freights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Atomic Accept (Mutex protected in backend)
  async acceptFreight(id: string) {
    return request<{ message: string; freight: Freight }>(`/freights/${id}/accept`, {
      method: 'POST'
    });
  },

  // Status transition
  async updateFreightStatus(id: string, newStatus: FreightStatus, notes?: string, location?: string) {
    return request<Freight>(`/freights/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, notes, location })
    });
  },

  // Forms
  async getForms(params?: { triggerEvent?: string }) {
    const query = new URLSearchParams();
    if (params?.triggerEvent) query.set('triggerEvent', params.triggerEvent);
    return request<FormDefinition[]>(`/forms?${query.toString()}`);
  },

  async createForm(data: Partial<FormDefinition>) {
    return request<FormDefinition>('/forms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async submitFormResponse(data: { 
    formId: string; 
    freightId?: string; 
    responseId?: string;
    stage?: 'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO';
    isDraft?: boolean;
    answers: Record<string, any>;
  }) {
    return request<FormResponse>('/forms/responses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async sendWhatsAppNotification(data: WhatsAppNotificationPayload) {
    return request<{ 
      success: boolean; 
      messageId: string; 
      recipient: string; 
      status: string; 
      details: string;
      gatewayResponse?: any;
    }>('/integrations/whatsapp/notify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWhatsAppConfig() {
    return request<WhatsAppConfig & { tokenMasked?: string }>('/integrations/whatsapp/config');
  },

  async updateWhatsAppConfig(data: Partial<WhatsAppConfig>) {
    return request<{ success: boolean; config: WhatsAppConfig }>('/integrations/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async testWhatsAppConnection(data: { phone?: string; message?: string; baseUrl?: string; token?: string }) {
    return request<{ success: boolean; message: string; recipient: string; details?: any }>('/integrations/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getFormResponses(params?: { freightId?: string; formId?: string }) {
    const query = new URLSearchParams();
    if (params?.freightId) query.set('freightId', params.freightId);
    if (params?.formId) query.set('formId', params.formId);
    return request<FormResponse[]>(`/forms/responses?${query.toString()}`);
  },

  // Notifications
  async getNotifications() {
    return request<AppNotification[]>('/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'PUT'
    });
  },

  // Audit Logs & Stats
  async getAuditLogs() {
    return request<AuditLog[]>('/audit-logs');
  },

  async getStats() {
    return request<DashboardStats>('/stats');
  },

  // Deletes
  async deleteFreight(id: string) {
    return request<{ success: boolean; message: string }>(`/freights/${id}`, { method: 'DELETE' });
  },
  async deleteDriver(id: string) {
    return request<{ success: boolean; message: string }>(`/drivers/${id}`, { method: 'DELETE' });
  },
  async deleteUser(id: string) {
    return request<{ success: boolean; message: string }>(`/users/${id}`, { method: 'DELETE' });
  },
  async deleteForm(id: string) {
    return request<{ success: boolean; message: string }>(`/forms/${id}`, { method: 'DELETE' });
  },
  async deleteVehicle(id: string) {
    return request<{ success: boolean; message: string }>(`/vehicles/${id}`, { method: 'DELETE' });
  }
};
