-- ==============================================================================
-- ELO LOG - SCHEMA DE BANCO DE DADOS RELACIONAL SQL (POSTGRESQL 14+ / 16+)
-- ==============================================================================
-- Este arquivo DDL inicializa todas as tabelas, tipos enumerados, índices, chaves
-- estrangeiras e sementes iniciais para a plataforma SaaS Multi-Tenant Elo Log.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE TENANTS (EMPRESAS / TRANSPORTADORAS / OPERADORES)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    zip_code VARCHAR(16),
    address VARCHAR(255),
    number VARCHAR(32),
    complement VARCHAR(128),
    neighborhood VARCHAR(128),
    city VARCHAR(128) NOT NULL,
    state VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDENTE_APROVACAO', -- 'ATIVA', 'SUSPENSA', 'PENDENTE_APROVACAO'
    plan VARCHAR(32) NOT NULL DEFAULT 'BASICO', -- 'BASICO', 'PROFISSIONAL', 'EMPRESARIAL'
    plan_limits JSONB NOT NULL DEFAULT '{"maxUsers": 5, "maxDrivers": 10, "maxFreightsMonthly": 30, "customForms": false, "exportReports": true, "prioritySupport": false}'::jsonb,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 3. TABELA DE USUÁRIOS DO SISTEMA (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'USUARIO', -- 'SUPER_ADMIN', 'EMPRESA_SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'OPERACIONAL', 'FINANCEIRO', 'MOTORISTA', 'CLIENTE'
    status VARCHAR(32) NOT NULL DEFAULT 'ATIVO', -- 'ATIVO', 'INATIVO', 'BLOQUEADO'
    password_hash VARCHAR(255),
    driver_id VARCHAR(64),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. TABELA DE MOTORISTAS
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(32) UNIQUE NOT NULL,
    rg VARCHAR(32),
    birth_date DATE,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    zip_code VARCHAR(16),
    address VARCHAR(255),
    city VARCHAR(128),
    state VARCHAR(8),
    cnh VARCHAR(32) NOT NULL,
    cnh_category VARCHAR(8) NOT NULL,
    cnh_expires_at DATE,
    cnh_photo_url TEXT,
    profile_photo_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'DISPONIVEL', -- 'DISPONIVEL', 'EM_VIAGEM', 'INATIVO', 'BLOQUEADO'
    rating NUMERIC(3,2) DEFAULT 5.00,
    completed_trips INTEGER DEFAULT 0,
    rntrc VARCHAR(32),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_cpf ON drivers(cpf);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- 5. TABELA DE VEÍCULOS
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    plate VARCHAR(16) NOT NULL,
    renavam VARCHAR(32),
    brand VARCHAR(64),
    model VARCHAR(128) NOT NULL,
    model_year INTEGER,
    type VARCHAR(32) NOT NULL, -- 'VUC', 'TOCO', 'TRUCK', 'BITRUCK', 'CARRETA', 'BITREM', 'RODOTREM'
    body_type VARCHAR(32) NOT NULL, -- 'BAU', 'SIDER', 'GRADE_BAIXA', 'GRANELEIRO', 'FRIGORIFICO', 'PRANCHA', 'TANQUE'
    capacity_kg NUMERIC(10,2) NOT NULL,
    tracker_brand VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'DISPONIVEL', -- 'DISPONIVEL', 'EM_TRANSITO', 'MANUTENCAO', 'INATIVO'
    crlv_photo_url TEXT,
    vehicle_photo_url TEXT,
    assigned_driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- 6. TABELA DE FRETES E CARGAS
CREATE TABLE IF NOT EXISTS freights (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    tenant_name VARCHAR(255),
    origin JSONB NOT NULL, -- { zipCode, address, number, neighborhood, city, state, date, timeWindow, contactName, contactPhone }
    destination JSONB NOT NULL, -- { zipCode, address, number, neighborhood, city, state, date, timeWindow, contactName, contactPhone }
    distance_km NUMERIC(10,2) DEFAULT 0,
    cargo JSONB NOT NULL, -- { description, type, weightKg, volumeCount, dimensions, requiresInsurance, notes }
    requirements JSONB NOT NULL, -- { vehicleType, bodyTypeRequired, minCapacityKg, trackerRequired, cnhMinCategory }
    payment JSONB NOT NULL, -- { price, paymentMethod, tollIncluded, advancePercentage, notes }
    status VARCHAR(32) NOT NULL DEFAULT 'DISPONIVEL', -- 'DISPONIVEL', 'RESERVADO', 'A_COLETAR', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO'
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(255),
    assigned_driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_driver_name VARCHAR(255),
    assigned_driver_phone VARCHAR(32),
    assigned_vehicle_plate VARCHAR(16),
    assigned_vehicle_model VARCHAR(128),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ,
    in_transit_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    pod_url TEXT, -- Proof of delivery (canhoto digital)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_freights_tenant_id ON freights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_freights_code ON freights(code);
CREATE INDEX IF NOT EXISTS idx_freights_status ON freights(status);
CREATE INDEX IF NOT EXISTS idx_freights_assigned_driver_id ON freights(assigned_driver_id);

-- 7. TABELA DE PRESTAÇÃO DE CONTAS E DESPESAS DE VIAGEM
CREATE TABLE IF NOT EXISTS trip_expenses (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    freight_id VARCHAR(64) REFERENCES freights(id) ON DELETE SET NULL,
    freight_code VARCHAR(32),
    driver_id VARCHAR(64) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(32),
    vehicle_plate VARCHAR(16),
    vehicle_model VARCHAR(128),
    chassis VARCHAR(64),
    client_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trip_days INTEGER DEFAULT 1,
    initial_km NUMERIC(10,2) DEFAULT 0,
    final_km NUMERIC(10,2) DEFAULT 0,
    total_km NUMERIC(10,2) DEFAULT 0,
    total_liters NUMERIC(10,2) DEFAULT 0,
    average_km_per_liter NUMERIC(10,2) DEFAULT 0,
    cost_per_km NUMERIC(10,2) DEFAULT 0,
    advance_amount NUMERIC(12,2) DEFAULT 0,
    driver_labor_amount NUMERIC(12,2) DEFAULT 0,
    total_expenses NUMERIC(12,2) DEFAULT 0,
    balance_amount NUMERIC(12,2) DEFAULT 0,
    balance_status VARCHAR(32) NOT NULL DEFAULT 'QUITADO', -- 'A_DEVOLVER', 'A_RECEBER', 'QUITADO'
    status VARCHAR(32) NOT NULL DEFAULT 'RASCUNHO', -- 'RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'QUITADO'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_notes TEXT,
    reviewer_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_tenant_id ON trip_expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_driver_id ON trip_expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_freight_id ON trip_expenses(freight_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_status ON trip_expenses(status);

-- 8. TABELA DE FORMULÁRIOS CUSTOMIZADOS & CHECKLISTS
CREATE TABLE IF NOT EXISTS form_definitions (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL, -- 'CHECKLIST_ENTREGA', 'CHECKLIST_COLETA', 'COMPROVANTE_ENTREGA', 'INSPECAO_VEICULAR'
    trigger_event VARCHAR(64) NOT NULL, -- 'NA_ENTREGA', 'DURANTE_COLETA', 'AO_INICIAR_VIAGEM', 'MANUAL'
    active BOOLEAN NOT NULL DEFAULT TRUE,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_tenant_id ON form_definitions(tenant_id);

-- 9. TABELA DE RESPOSTAS E SUBMISSÕES DE FORMULÁRIOS (CHECKLISTS PREENCHIDOS)
CREATE TABLE IF NOT EXISTS form_responses (
    id VARCHAR(64) PRIMARY KEY,
    form_id VARCHAR(64) REFERENCES form_definitions(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    freight_id VARCHAR(64) REFERENCES freights(id) ON DELETE SET NULL,
    driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    signatures JSONB NOT NULL DEFAULT '{}'::jsonb, -- { originSignature, destSignature }
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    location JSONB, -- { latitude, longitude, address }
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_form_responses_tenant_id ON form_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_freight_id ON form_responses(freight_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_driver_id ON form_responses(driver_id);

-- 10. TABELA DE LOGS DE AUDITORIA (TRILHA DE CONFORMIDADE E SEGURANÇA)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    tenant_name VARCHAR(255),
    user_id VARCHAR(64),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT,
    ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 11. TABELA DE CONFIGURAÇÕES DE WHATSAPP (MULTI-TENANT & GLOBAL)
CREATE TABLE IF NOT EXISTS whatsapp_configs (
    id VARCHAR(64) PRIMARY KEY, -- 'global' ou tenant_id
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    base_url VARCHAR(255),
    token VARCHAR(255),
    default_channel_number VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    auto_notify_checklist BOOLEAN NOT NULL DEFAULT TRUE,
    auto_notify_freight_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. TABELA DE TOKENS DE AUTENTICAÇÃO (PERSISTÊNCIA)
CREATE TABLE IF NOT EXISTS auth_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- 13. TABELA DE CONFIGURAÇÃO GLOBAL DO SAAS (SINGLETON ROW)
CREATE TABLE IF NOT EXISTS saas_global_config (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
    system_name VARCHAR(128) NOT NULL DEFAULT 'Elo Log',
    support_phone VARCHAR(32) DEFAULT '(17) 99745-1176',
    support_email VARCHAR(128) DEFAULT 'contato@elolog.com.br',
    default_commission_percent NUMERIC(5,2) DEFAULT 12.00,
    require_checklist_photos BOOLEAN DEFAULT TRUE,
    min_driver_age INTEGER DEFAULT 18,
    otp_expiration_minutes INTEGER DEFAULT 5,
    allow_self_registration BOOLEAN DEFAULT TRUE,
    plans JSONB NOT NULL,
    layout JSONB NOT NULL,
    form_fields JSONB NOT NULL,
    email_config JSONB,
    database_config JSONB,
    image_compression JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. SEMENTES INICIAIS (SEED DATA)
INSERT INTO tenants (id, name, legal_name, cnpj, email, phone, city, state, status, plan)
VALUES 
('tenant-translog-01', 'TransLog Brasil Transportes', 'TransLog Brasil Logística e Cargas Ltda', '12.345.678/0001-90', 'operacional@translogbrasil.com.br', '(17) 3214-5500', 'São José do Rio Preto', 'SP', 'ATIVA', 'EMPRESARIAL')
ON CONFLICT (id) DO NOTHING;

-- Senha padrão com hash bcrypt: 'Admin@123'
INSERT INTO users (id, tenant_id, name, email, phone, role, status, password_hash)
VALUES 
('user-superadmin', NULL, 'Administrador Geral da Plataforma', 'superadmin@portaldefretes.com.br', '(11) 99999-0001', 'SUPER_ADMIN', 'ATIVO', '$2a$10$iI8G6U7VqC3Jg74y7F7p.O1qP2c2Wp3Xw4Y5Z6A7B8C9D0E1F2G3H')
ON CONFLICT (id) DO NOTHING;

-- Configuração padrão inicial do SaaS
INSERT INTO saas_global_config (
    id, system_name, support_phone, support_email, plans, layout, form_fields, image_compression, database_config
) VALUES (
    'primary',
    'Elo Log',
    '(17) 99745-1176',
    'contato@elolog.com.br',
    '[{"id":"BASICO","name":"Plano Básico","price":299,"maxFreightsPerMonth":15,"maxUsers":2,"maxDrivers":5,"isActive":true},{"id":"PROFISSIONAL","name":"Plano Profissional","price":599,"maxFreightsPerMonth":150,"maxUsers":10,"maxDrivers":30,"isActive":true},{"id":"EMPRESARIAL","name":"Plano Empresarial","price":1499,"maxFreightsPerMonth":9999,"maxUsers":50,"maxDrivers":200,"isActive":true}]'::jsonb,
    '{"primaryColor":"#059669","borderRadius":"xl","fontFamily":"sans","navbarStyle":"dark","logoText":"ELO LOG","systemBackground":"minimal","homeBadgeText":"Solução Completa Multi-Tenant de Carga","homeTitle":"Gestão e Publicação de Fretes em","homeTitleAccent":"Tempo Real","homeSubtitle":"O Elo Log conecta transportadoras e motoristas com total isolamento e segurança."}'::jsonb,
    '{}'::jsonb,
    '{"enabled":true,"maxWidth":1600,"maxHeight":1600,"quality":0.8,"format":"image/jpeg","autoCompressDocuments":true,"maxFileSizeKB":400}'::jsonb,
    '{"enabled":true,"dbType":"postgres","host":"postgres","port":5432,"database":"elolog","username":"elolog_user","ssl":false,"autoMigrate":true}'::jsonb
) ON CONFLICT (id) DO NOTHING;
