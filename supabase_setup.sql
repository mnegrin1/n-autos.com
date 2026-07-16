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

