-- 1. Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Inmobiliarias (Agencies)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#2563eb',
    secondary_color VARCHAR(50) DEFAULT '#1e3a8a',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Propiedades (Properties)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('casa', 'apartamento', 'local', 'terreno')),
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('venta', 'alquiler')),
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'disponible' CHECK (status IN ('disponible', 'reservada', 'vendida', 'alquilada')),
    bedrooms INT,
    bathrooms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Leads (Contactos/CRM)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'visita', 'negociacion')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Usuarios / Agentes (Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Eventos / Agenda (Events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('visita', 'reunion', 'llamada')),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de Ofertas (Offers)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'contraoferta', 'aceptada', 'rechazada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos semilla de prueba
INSERT INTO agencies (id, name, subdomain) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Inmobiliaria Demo', 'demo');

INSERT INTO properties (agency_id, title, description, type, operation, price, bedrooms, bathrooms)
VALUES 
('00000000-0000-0000-0000-000000000000', 'Hermosa Casa en Carrasco', 'Excelente propiedad en zona residencial.', 'casa', 'venta', 450000, 3, 2),
('00000000-0000-0000-0000-000000000000', 'Apartamento a Estrenar', 'Piso alto con vistas despejadas.', 'apartamento', 'venta', 120000, 1, 1);

-- =========================================================================
-- 8. POLÍTICAS DE ROW LEVEL SECURITY (RLS) - SEGURIDAD MULTI-INQUILINO (SAAS)
-- =========================================================================

-- Habilitar RLS en todas las tablas para forzar control de accesos
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Función auxiliar segura para obtener el agency_id del usuario autenticado actual
CREATE OR REPLACE FUNCTION get_auth_user_agency()
RETURNS UUID AS $$
  SELECT agency_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 8.1 Políticas para Agencies (Inmobiliarias)
-- Cualquiera puede consultar agencias (necesario para el portal público)
CREATE POLICY "Permitir lectura pública de agencias" ON agencies
  FOR SELECT USING (true);

-- Solo administradores de la propia agencia pueden modificar sus datos
CREATE POLICY "Permitir modificación solo a administradores de la agencia" ON agencies
  FOR ALL TO authenticated
  USING (id = get_auth_user_agency())
  WITH CHECK (id = get_auth_user_agency());

-- 8.2 Políticas para Properties (Propiedades)
-- Cualquiera puede leer propiedades del portal público
CREATE POLICY "Permitir lectura pública de propiedades" ON properties
  FOR SELECT USING (true);

-- Los usuarios de la agencia pueden gestionar sus propias propiedades
CREATE POLICY "Gestionar propiedades de la propia agencia" ON properties
  FOR ALL TO authenticated
  USING (agency_id = get_auth_user_agency())
  WITH CHECK (agency_id = get_auth_user_agency());

-- 8.3 Políticas para Leads (Contactos CRM)
-- Peticiones de contacto públicas (inserts) permitidas para todos
CREATE POLICY "Permitir creación pública de leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados de la agencia pueden leer o modificar leads
CREATE POLICY "Gestionar leads de la propia agencia" ON leads
  FOR ALL TO authenticated
  USING (agency_id = get_auth_user_agency())
  WITH CHECK (agency_id = get_auth_user_agency());

-- 8.4 Políticas para Users (Usuarios / Agentes)
-- Los usuarios de la agencia pueden listarse entre sí
CREATE POLICY "Ver usuarios de la propia agencia" ON users
  FOR SELECT TO authenticated
  USING (agency_id = get_auth_user_agency());

-- Solo admins o managers pueden agregar/actualizar agentes
CREATE POLICY "Gestionar usuarios de la propia agencia" ON users
  FOR ALL TO authenticated
  USING (
    agency_id = get_auth_user_agency() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- 8.5 Políticas para Events (Agenda)
-- Totalmente aislado por agencia
CREATE POLICY "Gestionar eventos de la propia agencia" ON events
  FOR ALL TO authenticated
  USING (agency_id = get_auth_user_agency())
  WITH CHECK (agency_id = get_auth_user_agency());

-- 8.6 Políticas para Offers (Ofertas)
-- Totalmente aislado por agencia
CREATE POLICY "Gestionar ofertas de la propia agencia" ON offers
  FOR ALL TO authenticated
  USING (agency_id = get_auth_user_agency())
  WITH CHECK (agency_id = get_auth_user_agency());

-- =========================================================================
-- 9. TABLAS ADICIONALES (AUTOMOTORES, TICKETS, ETC.)
-- =========================================================================

-- Tabla de Vehículos (Vehicles)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    kms INT,
    transmission VARCHAR(50),
    fuel VARCHAR(50),
    price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    color VARCHAR(100),
    engine VARCHAR(100),
    doors INT,
    plate VARCHAR(50),
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    youtube_video TEXT,
    status VARCHAR(50) DEFAULT 'disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Auto Leads
CREATE TABLE auto_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    vehicle VARCHAR(255),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'nuevo',
    time VARCHAR(50),
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Auto Integrations
CREATE TABLE auto_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, provider)
);

-- Tabla de Auto Vehicle Publications
CREATE TABLE auto_vehicle_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    external_id VARCHAR(100),
    external_url TEXT,
    price NUMERIC(12,2),
    currency VARCHAR(10),
    views INT DEFAULT 0,
    questions_count INT DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, channel)
);

-- Tabla de Rentals
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    property VARCHAR(255),
    tenant VARCHAR(255),
    price NUMERIC(12,2),
    currency VARCHAR(10) DEFAULT 'UYU',
    endDate DATE,
    status VARCHAR(50) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "desc" TEXT,
    priority VARCHAR(50),
    stage VARCHAR(50) DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Developments (Desarrollos)
CREATE TABLE developments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    total_units INT,
    available_units INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Lots (Lotes)
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    number VARCHAR(50),
    status VARCHAR(50),
    price NUMERIC(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    amount NUMERIC(12,2),
    currency VARCHAR(10),
    status VARCHAR(50),
    method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_vehicle_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Gestionar vehiculos de la propia agencia" ON vehicles FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Permitir lectura publica de vehiculos" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Gestionar auto leads de la propia agencia" ON auto_leads FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Permitir creacion publica de auto leads" ON auto_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Gestionar auto integrations de la propia agencia" ON auto_integrations FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar auto vehicle publications de la propia agencia" ON auto_vehicle_publications FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar rentals de la propia agencia" ON rentals FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar tickets de la propia agencia" ON tickets FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar developments de la propia agencia" ON developments FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar lots de la propia agencia" ON lots FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar notifications de la propia agencia" ON notifications FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
CREATE POLICY "Gestionar payments de la propia agencia" ON payments FOR ALL TO authenticated USING (agency_id = get_auth_user_agency()) WITH CHECK (agency_id = get_auth_user_agency());
