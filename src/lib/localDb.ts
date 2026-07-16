import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  agencies: any[];
  properties: any[];
  leads: any[];
  users: any[];
  events: any[];
  offers: any[];
  rentals: any[];
  tickets: any[];
  conversations: any[];
  google_config?: any;
  lead_interactions?: any[];
  developments?: any[];
  lots?: any[];
  notifications?: any[];
  payments?: any[];
  vehicles?: any[];
  auto_leads?: any[];
  integrations?: {
    mercadolibre: { connected: boolean; username?: string; token?: string };
    facebook: { connected: boolean; pageName?: string; token?: string };
    instagram: { connected: boolean; handle?: string };
    whatsapp: { connected: boolean; phoneNumber?: string };
  };
  vehicle_publications?: Array<{
    id: string;
    vehicle_id: string;
    channel: 'mercadolibre' | 'facebook' | 'instagram';
    status: 'published' | 'pending' | 'failed';
    external_url?: string;
    views?: number;
    questions_count?: number;
    published_at?: string;
  }>;
  inbox_conversations?: Array<{
    id: string;
    lead_id?: string;
    lead_name: string;
    lead_avatar?: string;
    channel: 'whatsapp' | 'mercadolibre' | 'facebook' | 'instagram';
    last_message: string;
    last_message_time: string;
    unread: boolean;
    vehicle_id?: string;
    messages: Array<{
      id: string;
      sender: 'lead' | 'agent';
      text: string;
      time: string;
      status?: 'sent' | 'delivered' | 'read';
    }>;
    notes?: string;
  }>;
}

const defaultDb: DatabaseSchema = {
  agencies: [
    {
      id: "demo-agency-id",
      name: "Inmobiliaria Demo",
      subdomain: "demo",
      logo_url: "",
      primary_color: "#2563eb",
      secondary_color: "#1e3a8a",
      created_at: new Date().toISOString()
    }
  ],
  properties: [
    { id: "prop-1", agency_id: "demo-agency-id", title: "Hermosa Casa en Carrasco", price: 450000, type: "casa", operation: "venta", status: "disponible", bedrooms: 3, bathrooms: 2, created_at: new Date().toISOString() },
    { id: "prop-2", agency_id: "demo-agency-id", title: "Apartamento a Estrenar", price: 120000, type: "apartamento", operation: "venta", status: "reservada", bedrooms: 1, bathrooms: 1, created_at: new Date().toISOString() },
    { id: "prop-3", agency_id: "demo-agency-id", title: "Local Comercial Centro", price: 80000, type: "local", operation: "venta", status: "vendida", bedrooms: 0, bathrooms: 1, created_at: new Date().toISOString() },
  ],
  leads: [
    { id: "lead-1", agency_id: "demo-agency-id", name: "Juan Pérez", property: "Casa en Carrasco", time: "2h", status: "Nuevo" },
    { id: "lead-2", agency_id: "demo-agency-id", name: "María Gómez", property: "Apto. en Pocitos", time: "5h", status: "Nuevo" },
    { id: "lead-3", agency_id: "demo-agency-id", name: "Carlos López", property: "Local Centro", time: "1d", status: "Contactado" },
    { id: "lead-4", agency_id: "demo-agency-id", name: "Ana Martínez", property: "Casa en Carrasco", time: "2d", status: "Visita" },
    { id: "lead-5", agency_id: "demo-agency-id", name: "Lucía Silva", property: "Terreno Este", time: "3d", status: "Visita" },
    { id: "lead-6", agency_id: "demo-agency-id", name: "Pedro Rodríguez", property: "Apto. a Estrenar", time: "5d", status: "Negociación" },
  ],
  users: [
    { id: "agent-1", agency_id: "demo-agency-id", name: "Mauricio Negrin", email: "mauricio@inmobiliaria.com", role: "admin", status: "active", created_at: new Date().toISOString() },
    { id: "agent-2", agency_id: "demo-agency-id", name: "Laura Silva", email: "laura@inmobiliaria.com", role: "manager", status: "active", created_at: new Date().toISOString() },
    { id: "agent-3", agency_id: "demo-agency-id", name: "Carlos Ruiz", email: "carlos@inmobiliaria.com", role: "agent", status: "inactive", created_at: new Date().toISOString() },
  ],
  events: [
    { id: "evt-1", agency_id: "demo-agency-id", title: "Visita Casa Carrasco (Mauricio)", start: new Date(new Date().setHours(10, 0)).toISOString(), end: new Date(new Date().setHours(11, 30)).toISOString(), type: "visita" },
    { id: "evt-2", agency_id: "demo-agency-id", title: "Firma Contrato Apto Pocitos", start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), type: "reunion" },
    { id: "evt-3", agency_id: "demo-agency-id", title: "Llamada Propietario", start: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), end: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), type: "llamada" },
  ],
  offers: [
    { id: "off-1", agency_id: "demo-agency-id", client: "Fernando Giménez", property: "Casa en Carrasco", amount: 430000, date: "Hace 2 horas", status: "pendiente" },
    { id: "off-2", agency_id: "demo-agency-id", client: "Sofía Arana", property: "Apto. en Pocitos", amount: 115000, date: "Ayer", status: "contraoferta" },
    { id: "off-3", agency_id: "demo-agency-id", client: "Roberto Silva", property: "Local Centro", amount: 78000, date: "Hace 3 días", status: "aceptada" },
    { id: "off-4", agency_id: "demo-agency-id", client: "Lucía Méndez", property: "Casa en Carrasco", amount: 400000, date: "Hace 5 días", status: "rechazada" },
  ],
  rentals: [
    { id: "ren-1", agency_id: "demo-agency-id", property: "Apto. en Pocitos", tenant: "Juan Pérez", price: 35000, currency: "UYU", endDate: "2024-12-01", status: "activo" },
    { id: "ren-2", agency_id: "demo-agency-id", property: "Casa en Carrasco", tenant: "María Gómez", price: 2500, currency: "USD", endDate: "2023-11-15", status: "vencido" },
    { id: "ren-3", agency_id: "demo-agency-id", property: "Local Centro", tenant: "Carlos López", price: 45000, currency: "UYU", endDate: "2025-06-30", status: "activo" },
  ],
  tickets: [
    { id: "tkt-1", agency_id: "demo-agency-id", title: "Nuevo campo en propiedades", desc: "Necesito agregar un campo 'Cochera techada'.", priority: "Baja", stage: "Pendiente" },
    { id: "tkt-2", agency_id: "demo-agency-id", title: "Error en buscador", desc: "No filtra correctamente por precio máximo.", priority: "Alta", stage: "Pendiente" },
    { id: "tkt-3", agency_id: "demo-agency-id", title: "Reporte por sucursal", desc: "Necesitamos separar métricas por oficina.", priority: "Media", stage: "En Análisis" },
    { id: "tkt-4", agency_id: "demo-agency-id", title: "Integración con WhatsApp", desc: "Botón de compartir funcionando.", priority: "Media", stage: "Entregado" },
  ],
  conversations: [],
  lead_interactions: [
    {
      id: "int-1",
      lead_id: "lead-1",
      agent_name: "Mauricio Negrin",
      type: "llamada",
      content: "Llamada telefónica inicial: El cliente solicita coordinar visita para el fin de semana.",
      created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
    },
    {
      id: "int-2",
      lead_id: "lead-1",
      agent_name: "Mauricio Negrin",
      type: "email",
      content: "Envío de ficha técnica de la propiedad por correo electrónico.",
      created_at: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString()
    }
  ],
  vehicles: [
    {
      id: "veh-1",
      agency_id: "demo-agency-id",
      brand: "Chevrolet",
      model: "Cruze 1.4 Turbo LTZ",
      year: 2022,
      kms: 42000,
      transmission: "automatica",
      fuel: "nafta",
      price: 21500,
      currency: "USD",
      color: "Gris Plata",
      engine: "1.4T",
      doors: 5,
      plate: "SBH 1234",
      description: "Excelente estado, único dueño, todos los servicios oficiales al día. Cubiertas nuevas.",
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
      ],
      status: "disponible",
      created_at: new Date().toISOString()
    },
    {
      id: "veh-2",
      agency_id: "demo-agency-id",
      brand: "Toyota",
      model: "Hilux SRX 4x4",
      year: 2020,
      kms: 98000,
      transmission: "automatica",
      fuel: "diesel",
      price: 38900,
      currency: "USD",
      color: "Blanco",
      engine: "2.8 TDI",
      doors: 4,
      plate: "MAA 5678",
      description: "Camioneta en impecable estado de uso familiar. Tapizados de cuero, estribos y lona marítima original.",
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
      ],
      status: "reservado",
      created_at: new Date().toISOString()
    },
    {
      id: "veh-3",
      agency_id: "demo-agency-id",
      brand: "Ford",
      model: "Mustang GT 5.0 V8",
      year: 2019,
      kms: 18000,
      transmission: "manual",
      fuel: "nafta",
      price: 67000,
      currency: "USD",
      color: "Rojo",
      engine: "5.0 V8",
      doors: 2,
      plate: "TXS 9999",
      description: "Un clásico americano moderno. Muy poco uso, guardado siempre en garage climatizado. Realmente nuevo.",
      images: [
        "https://images.unsplash.com/photo-1611245801312-a1d89b4b1278?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
      ],
      status: "disponible",
      created_at: new Date().toISOString()
    }
  ],
  auto_leads: [
    {
      id: "alead-1",
      agency_id: "demo-agency-id",
      name: "Daniela Rodríguez",
      email: "daniela@gmail.com",
      phone: "099123456",
      vehicle: "Chevrolet Cruze (Ref: veh-1)",
      vehicle_id: "veh-1",
      message: "Hola, me gustaría coordinar un test drive para el Chevrolet Cruze esta semana.",
      status: "nuevo",
      time: "1h",
      created_at: new Date().toISOString(),
      assigned_agent_id: "agent-1"
    },
    {
      id: "alead-2",
      agency_id: "demo-agency-id",
      name: "Juan Manuel Ortiz",
      email: "ortiz.jm@outlook.com",
      phone: "098765432",
      vehicle: "Toyota Hilux (Ref: veh-2)",
      vehicle_id: "veh-2",
      message: "Me interesa financiar el 50% de la Toyota Hilux, ¿qué planes tienen?",
      status: "contactado",
      time: "4h",
      created_at: new Date().toISOString(),
      assigned_agent_id: "agent-2"
    }
  ]
};

let cachedDb: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }

  let dbData: DatabaseSchema = defaultDb;

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      dbData = parsed;
    } else {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
      } catch (e) {
        console.warn("No se pudo escribir database.json inicial (entorno serverless/lectura):", e);
      }
    }
  } catch (e) {
    console.error("Error al leer database.json, usando fallback:", e);
    dbData = defaultDb;
  }

  // Migración: inicializar campos que pueden no existir en el JSON persisted
  if (!dbData.conversations) dbData.conversations = [];
  if (!dbData.lead_interactions) dbData.lead_interactions = [];
  if (!dbData.developments) dbData.developments = [];
  if (!dbData.lots) dbData.lots = [];
  if (!dbData.notifications) dbData.notifications = [];
  if (!dbData.payments) dbData.payments = [];
  if (!dbData.vehicles) dbData.vehicles = [];
  if (!dbData.auto_leads) dbData.auto_leads = [];
  
  // Migración para integraciones y mensajería
  if (!dbData.integrations) {
    dbData.integrations = {
      mercadolibre: { connected: false, username: "", token: "" },
      facebook: { connected: false, pageName: "", token: "" },
      instagram: { connected: false, handle: "" },
      whatsapp: { connected: false, phoneNumber: "" }
    };
  }
  if (!dbData.vehicle_publications) {
    dbData.vehicle_publications = [];
  }
  if (!dbData.inbox_conversations || dbData.inbox_conversations.length === 0) {
    dbData.inbox_conversations = [
      {
        id: "conv-1",
        lead_id: "alead-1",
        lead_name: "Daniela Rodríguez",
        lead_avatar: "DR",
        channel: "whatsapp",
        last_message: "Hola, me gustaría coordinar un test drive para el Chevrolet Cruze esta semana.",
        last_message_time: "10:15",
        unread: true,
        vehicle_id: "veh-1",
        messages: [
          { id: "m1", sender: "lead", text: "Buenas tardes, vi el Chevrolet Cruze 2022 en su web.", time: "10:12", status: "read" },
          { id: "m2", sender: "agent", text: "Hola Daniela! Un gusto saludarte. Sí, lo tenemos disponible en nuestro showroom. ¿Te gustaría coordinar una visita o conocer detalles de financiación?", time: "10:14", status: "read" },
          { id: "m3", sender: "lead", text: "Hola, me gustaría coordinar un test drive para el Chevrolet Cruze esta semana.", time: "10:15", status: "delivered" }
        ]
      },
      {
        id: "conv-2",
        lead_id: "alead-2",
        lead_name: "Juan Manuel Ortiz",
        lead_avatar: "JO",
        channel: "mercadolibre",
        last_message: "Perfecto, pásame los requisitos para el crédito bancario.",
        last_message_time: "Ayer",
        unread: false,
        vehicle_id: "veh-2",
        messages: [
          { id: "m4", sender: "lead", text: "Buenas, sigue disponible la Hilux? Aceptan permuta?", time: "Ayer 15:30", status: "read" },
          { id: "m5", sender: "agent", text: "Hola Juan! Sí, la Hilux SRX está disponible. Tomamos permutas llave por llave previa tasación en nuestro taller. ¿De qué año y modelo es tu vehículo?", time: "Ayer 15:45", status: "read" },
          { id: "m6", sender: "lead", text: "Es una Ford Ranger 2017 manual con 120mil kms. Además quería financiar el saldo.", time: "Ayer 15:48", status: "read" },
          { id: "m7", sender: "agent", text: "Excelente, la Ranger es muy comercial. Podemos tomarla y financiar el saldo en hasta 36 cuotas en dólares o UI. Te puedo enviar la cotización hoy mismo.", time: "Ayer 15:52", status: "read" },
          { id: "m8", sender: "lead", text: "Perfecto, pásame los requisitos para el crédito bancario.", time: "Ayer 15:55", status: "read" }
        ]
      },
      {
        id: "conv-3",
        lead_name: "Carlos Mendoza",
        lead_avatar: "CM",
        channel: "facebook",
        last_message: "Hola! ¿Qué precio tiene el Ford Mustang?",
        last_message_time: "Hace 2 días",
        unread: false,
        vehicle_id: "veh-3",
        messages: [
          { id: "m9", sender: "lead", text: "Hola! ¿Qué precio tiene el Ford Mustang?", time: "Hace 2 días 11:20", status: "read" }
        ]
      },
      {
        id: "conv-4",
        lead_name: "Sofía Vergara",
        lead_avatar: "SV",
        channel: "instagram",
        last_message: "Me encanta el color rojo. ¿Se puede ver mañana por la tarde?",
        last_message_time: "Hace 3 días",
        unread: false,
        vehicle_id: "veh-3",
        messages: [
          { id: "m10", sender: "lead", text: "Hola, me encanta la foto del Mustang rojo que subieron. ¿Sigue disponible?", time: "Hace 3 días 14:02", status: "read" },
          { id: "m11", sender: "agent", text: "Hola Sofía! Sí, está disponible y en exhibición en nuestro showroom principal.", time: "Hace 3 días 14:15", status: "read" },
          { id: "m12", sender: "lead", text: "Me encanta el color rojo. ¿Se puede ver mañana por la tarde?", time: "Hace 3 días 14:20", status: "read" }
        ]
      }
    ];
  }
  cachedDb = dbData;
  return cachedDb;
}

export function saveDb(data: DatabaseSchema) {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn("No se pudo escribir database.json en guardado (entorno serverless/lectura):", e);
  }
}
