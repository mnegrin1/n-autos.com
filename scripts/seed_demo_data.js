const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_AGENCY_ID = '00000000-0000-0000-0000-000000000000';

const agencyData = {
  id: DEMO_AGENCY_ID,
  name: 'Automotora Mauricio Negrin',
  subdomain: 'carmax',
  whatsapp: '+598 99 123 456',
  primary_color: '#2563eb',
  secondary_color: '#1d4ed8',
  font_family: 'Manrope',
  web_template: 'standard',
  logo_url: '',
  cover_url: '',
  hero_eyebrow: 'AUTOMOTORA MAURICIO NEGRIN',
  hero_title: 'Vehículos Seleccionados & Garantizados',
  hero_subtitle: 'Descubre nuestra flota exclusiva de vehículos con certificación mecánica de 100 puntos, garantía escrita y entrega inmediata.',
  footer_text: 'Automotora Mauricio Negrin — Tu concesionario de confianza en Montevideo.',
  location_address: 'Av. Italia 4567, Malvín, Montevideo, Uruguay',
  business_hours: 'Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs',
  contact_description: '¿Tienes alguna duda sobre una unidad o deseas agendar una prueba de manejo? Escríbenos directamente o visita nuestro showroom.',
  about_text: 'En Automotora Mauricio Negrin nos especializamos en la comercialización de vehículos 0km y usados seleccionados de alta gama y semi-nuevos. Ofrecemos respaldo total, financiación ágil y cotización transparente.',
  show_trust_section: true,
  contact_email: 'mauricio@automotora.com',
  latitude: -34.8871,
  longitude: -56.1102,
  trust_pillar1_title: 'Garantía Certificada',
  trust_pillar1_desc: 'Revisión mecánica rigurosa de 100 puntos.',
  trust_pillar2_title: 'Financiación a Medida',
  trust_pillar2_desc: 'Planes flexibles adaptados a tu presupuesto.',
  trust_pillar3_title: 'Tomamos Tu Usado',
  trust_pillar3_desc: 'Cotización justa e inmediata de tu unidad.',
  trust_pillar4_title: 'Posventa Exclusiva',
  trust_pillar4_desc: 'Atención y respaldo posterior a la entrega.'
};

const demoVehicles = [
  {
    id: 'f1a2b3c4-1111-4000-8000-000000000001',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Toyota',
    model: 'Corolla Cross 2.0 VVT-i Hybrid',
    year: 2024,
    kms: 0,
    transmission: 'automatica',
    fuel: 'hibrido',
    price: 34900,
    currency: 'USD',
    color: 'Blanco Perla',
    engine: '2.0 Hybrid 122 HP',
    doors: 5,
    plate: 'AAA 1024',
    description: 'Toyota Corolla Cross 0km versión Hybrid SEG Top de línea. Equipada con paquete de seguridad Toyota Safety Sense, control de crucero adaptativo, frenado autónomo de emergencia, pantalla táctil 9 pulgadas con Apple CarPlay / Android Auto inalámbrico, tapizado en cuero bi-tono y techo solar. Garantía oficial de 3 años o 100.000 km.',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-2222-4000-8000-000000000002',
    agency_id: DEMO_AGENCY_ID,
    brand: 'BMW',
    model: '320i M Sport 2.0 Turbo',
    year: 2023,
    kms: 18500,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 54500,
    currency: 'USD',
    color: 'Azul Portimao',
    engine: '2.0 Turbo TwinPower 184 HP',
    doors: 4,
    plate: 'BMA 3200',
    description: 'Impecable BMW 320i paquete M Sport original de fábrica. Service al día realizado en representante oficial. Cuenta con llantas de aleación M de 18 pulgadas, volante deportivo M con levas al volante, suspensión deportiva M, cuadro de instrumentos 100% digital BMW Live Cockpit Professional, sonido Hi-Fi y molduras interiores en aluminio Tetragon. Estado idéntico a 0km.',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-3333-4000-8000-000000000003',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Ford',
    model: 'Ranger Limited 3.2 4x4',
    year: 2023,
    kms: 24000,
    transmission: 'automatica',
    fuel: 'diesel',
    price: 46800,
    currency: 'USD',
    color: 'Gris Magnetita',
    engine: '3.2 Duratorq 200 HP',
    doors: 4,
    plate: 'FRA 3244',
    description: 'Ford Ranger versión tope de gama Limited 4x4. Equipada con motor Puma 3.2 de 5 cilindros y 200 HP, caja automática de 6 velocidades, tracción 4x4 con alta y baja, asistente de mantenimiento de carril, sensor de lluvia y luces, lona marítima, protector de caja rígido y enganche de remolque homologado.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-4444-4000-8000-000000000004',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Volkswagen',
    model: 'Golf GTI 2.0 TSI',
    year: 2022,
    kms: 32000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 42000,
    currency: 'USD',
    color: 'Rojo Tornado',
    engine: '2.0 TSI 230 HP',
    doors: 5,
    plate: 'VWG 2022',
    description: 'Espectacular Volkswagen Golf GTI MK7.5 en inmejorable estado de conservación. Transmisión automática DSG de doble embrague de 6 marchas con Launch Control, bloqueo de diferencial electrónico XDS+, tapizado icónico Clark en tela/cuero, techo panorámico corredizo y sistema Discover Pro de 9.2 pulgadas con control de gestos.',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-5555-4000-8000-000000000005',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Chevrolet',
    model: 'Tracker Premier 1.2 Turbo',
    year: 2024,
    kms: 12000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 26900,
    currency: 'USD',
    color: 'Plata Switchblade',
    engine: '1.2 Turbo 132 HP',
    doors: 5,
    plate: 'CHT 1240',
    description: 'Chevrolet Tracker Premier 1.2 Turbo 0km recién atendida en service oficial. Incluye alerta de colisión frontal con frenado automático a baja velocidad, alerta de punto ciego, techo solar panorámico, estacionamiento semi-autónomo Easy Park, WiFi nativo OnStar a bordo y tapizado en cuero capitoné.',
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-6666-4000-8000-000000000006',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Audi',
    model: 'A4 2.0 TFSI S-Line',
    year: 2021,
    kms: 41000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 39500,
    currency: 'USD',
    color: 'Negro Mythos',
    engine: '2.0 TFSI Mild Hybrid 190 HP',
    doors: 4,
    plate: 'ADA 4200',
    description: 'Audi A4 S-Line 40 TFSI con tecnología Mild-Hybrid (MHEV). Paquete exterior e interior S-Line con asientos deportivos en cuero/Alcántara grabados en relieve S, Audi Virtual Cockpit Plus de 12.3 pulgadas, faros Matrix LED delanteros y dinámicos traseros, climatizador tri-zona y equipo de audio Bang & Olufsen 3D.',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-7777-4000-8000-000000000007',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Hyundai',
    model: 'Tucson 2.0 GL Automatic',
    year: 2023,
    kms: 19800,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 32400,
    currency: 'USD',
    color: 'Gris Selva',
    engine: '2.0 Nu Smartstream 156 HP',
    doors: 5,
    plate: 'HYT 2023',
    description: 'Nueva generación Hyundai Tucson GL. Diseño paramétrico futurista con luces LED ocultas en la parrilla, caja automática de 6 velocidades, pantalla multimedia flotante de 8 pulgadas, selector de modos de manejo (Eco/Normal/Sport), cámara de retroceso con guías dinámicas y llantas diamantadas de 18 pulgadas.',
    images: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  },
  {
    id: 'f1a2b3c4-8888-4000-8000-000000000008',
    agency_id: DEMO_AGENCY_ID,
    brand: 'Honda',
    model: 'Civic 2.0 EXL',
    year: 2021,
    kms: 45000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 24800,
    currency: 'USD',
    color: 'Blanco Nacarado',
    engine: '2.0 i-VTEC 154 HP',
    doors: 4,
    plate: 'HNC 2021',
    description: 'Honda Civic EXL de único dueño. Todos los mantenimientos registrados en concesionario oficial Honda. Transmisión CVT con levas de cambio al volante de 7 marchas simuladas, sistema LaneWatch con cámara en retrovisor lateral derecho, 6 airbags, frenos de disco en las 4 ruedas con ABS/EBD/BA y freno de mano eléctrico con Brake Hold.',
    images: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'disponible'
  }
];

const demoLeads = [
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Valentina Rossi',
    email: 'valentina.rossi@gmail.com',
    phone: '+598 99 458 123',
    vehicle: 'Toyota Corolla Cross 2.0 VVT-i Hybrid',
    message: 'Buenas tardes, estoy interesada en el Corolla Cross Hybrid. Me gustaría saber si aceptan mi unidad usada (Nissan Versa 2019) como parte de pago y opciones de financiación bancaria.',
    status: 'negociacion',
    tags: ['VIP', 'Financiación', 'Toma Usado'],
    time: 'Hace 2 horas',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Gonzalo Menéndez',
    email: 'g.menendez@outlook.com',
    phone: '+598 98 712 344',
    vehicle: 'BMW 320i M Sport 2.0 Turbo',
    message: 'Hola Mauricio, vi la publicación del BMW 320i M Sport. ¿Se puede agendar un Test Drive para este viernes por la tarde? Pago al contado efectivo.',
    status: 'visita',
    tags: ['Test Drive', 'Al Contado'],
    time: 'Ayer',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Mariana Fernández',
    email: 'mfernandez@empresa.com.uy',
    phone: '+598 91 223 988',
    vehicle: 'Chevrolet Tracker Premier 1.2 Turbo',
    message: 'Consulta por la Tracker Premier Plata. Quisiera saber qué porcentaje financian a través de Banco Santander y valor final con transferencia incluida.',
    status: 'contactado',
    tags: ['Consulta Web', 'Financiación'],
    time: 'Hace 3 días',
    created_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString()
  },
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@hotmail.com',
    phone: '+598 94 331 092',
    vehicle: 'Ford Ranger Limited 3.2 4x4',
    message: 'Hola, necesito una camioneta 4x4 para trabajo de campo en Durazno. ¿Tiene ficha completa de mantenimientos la Ranger Limited?',
    status: 'nuevo',
    tags: ['Permuta', 'Empresa'],
    time: 'Hace 10 minutos',
    created_at: new Date(Date.now() - 600 * 1000).toISOString()
  },
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Sofía Benítez',
    email: 'sofia.benitez@gmail.com',
    phone: '+598 99 881 765',
    vehicle: 'Volkswagen Golf GTI 2.0 TSI',
    message: 'Hola! Me apasionan los Golf GTI. Quisiera saber si la unidad Rojo Tornado tiene alguna modificación de motor o si está 100% original de fábrica.',
    status: 'visita',
    tags: ['Test Drive', 'Fanatic'],
    time: 'Hace 1 día',
    created_at: new Date(Date.now() - 86400 * 1000).toISOString()
  },
  {
    agency_id: DEMO_AGENCY_ID,
    name: 'Diego Silva',
    email: 'dsilva.uy@gmail.com',
    phone: '+598 92 654 321',
    vehicle: 'Audi A4 2.0 TFSI S-Line',
    message: 'Estimados, vi el Audi A4 en MercadoLibre. Quisiera recibir fotos adicionales del interior y coordinar visita en el local de Av. Italia.',
    status: 'nuevo',
    tags: ['Consulta MercadoLibre'],
    time: 'Hace 4 horas',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

const demoConversations = [
  {
    id: 'conv-001',
    agency_id: DEMO_AGENCY_ID,
    lead_name: 'Valentina Rossi',
    lead_avatar: 'VR',
    channel: 'whatsapp',
    last_message: 'Excelente Mauricio, mañana me paso por el showroom con el Versa para la tasación.',
    last_message_time: '14:32',
    unread: false,
    notes: 'Interesada en Toyota Corolla Cross Hybrid. Ofrece Nissan Versa 2019 de permuta.',
    messages: [
      { id: 'm1', sender: 'lead', text: 'Buenas tardes, estoy interesada en el Corolla Cross Hybrid. Me gustaría saber si aceptan mi unidad usada.', timestamp: '14:10', status: 'read' },
      { id: 'm2', sender: 'agent', text: 'Hola Valentina! Sí, tomamos tu permuta previa revisión mecánica. ¿Podrías traerlo mañana para tasar?', timestamp: '14:20', status: 'read' },
      { id: 'm3', sender: 'lead', text: 'Excelente Mauricio, mañana me paso por el showroom con el Versa para la tasación.', timestamp: '14:32', status: 'read' }
    ]
  },
  {
    id: 'conv-002',
    agency_id: DEMO_AGENCY_ID,
    lead_name: 'Gonzalo Menéndez',
    lead_avatar: 'GM',
    channel: 'whatsapp',
    last_message: 'Confirmo para este viernes a las 16:30 hs. Saludos!',
    last_message_time: '11:15',
    unread: true,
    notes: 'Coordinado Test Drive BMW 320i M Sport para Viernes 16:30 hs. Pago al contado.',
    messages: [
      { id: 'm1', sender: 'lead', text: 'Hola Mauricio, vi la publicación del BMW 320i M Sport. ¿Se puede agendar un Test Drive para este viernes por la tarde?', timestamp: '10:50', status: 'read' },
      { id: 'm2', sender: 'agent', text: 'Hola Gonzalo! Por supuesto, te agendo para las 16:30 hs en nuestro local de Av. Italia. Te esperamos con la unidad lista.', timestamp: '11:05', status: 'read' },
      { id: 'm3', sender: 'lead', text: 'Confirmo para este viernes a las 16:30 hs. Saludos!', timestamp: '11:15', status: 'received' }
    ]
  },
  {
    id: 'conv-003',
    agency_id: DEMO_AGENCY_ID,
    lead_name: 'Mariana Fernández',
    lead_avatar: 'MF',
    channel: 'mercadolibre',
    last_message: 'Muchas gracias por la respuesta. Lo analizo con mi esposo y les aviso.',
    last_message_time: 'Ayer 18:40',
    unread: false,
    notes: 'Consultó por financiación de Chevrolet Tracker Premier.',
    messages: [
      { id: 'm1', sender: 'lead', text: 'Consulta por la Tracker Premier Plata. Quisiera saber qué porcentaje financian a través de Banco Santander.', timestamp: 'Ayer 17:15', status: 'read' },
      { id: 'm2', sender: 'agent', text: 'Hola Mariana, financiamos hasta el 50% en 36 cuotas fijas en UI o USD con aprobación en el día.', timestamp: 'Ayer 18:00', status: 'read' },
      { id: 'm3', sender: 'lead', text: 'Muchas gracias por la respuesta. Lo analizo con mi esposo y les aviso.', timestamp: 'Ayer 18:40', status: 'read' }
    ]
  },
  {
    id: 'conv-004',
    agency_id: DEMO_AGENCY_ID,
    lead_name: 'Carlos Rodríguez',
    lead_avatar: 'CR',
    channel: 'web_chat',
    last_message: 'Hola, necesito una camioneta 4x4 para trabajo de campo en Durazno. ¿Tiene ficha completa?',
    last_message_time: '11:47',
    unread: true,
    notes: 'Consulta web recien ingresada para Ford Ranger Limited.',
    messages: [
      { id: 'm1', sender: 'lead', text: 'Hola, necesito una camioneta 4x4 para trabajo de campo en Durazno. ¿Tiene ficha completa?', timestamp: '11:47', status: 'received' }
    ]
  }
];

async function seed() {
  console.log('--- SEEDING REALISTIC DEMO DATA FOR MAURICIO@AUTOMOTORA.COM ---');

  // 1. Update / Upsert Agency in DB (clean payload)
  const cleanAgencyPayload = {
    id: DEMO_AGENCY_ID,
    name: agencyData.name,
    subdomain: agencyData.subdomain,
    logo_url: agencyData.logo_url,
    primary_color: agencyData.primary_color,
    secondary_color: agencyData.secondary_color
  };
  const { error: agencyErr } = await supabase.from('agencies').upsert(cleanAgencyPayload);
  if (agencyErr) {
    console.error('Error updating agency:', agencyErr);
  } else {
    console.log('✅ Agency successfully updated in DB.');
  }

  // 2. Update persistent local json file .agency_settings.json
  try {
    const jsonPath = path.join(__dirname, '..', '.agency_settings.json');
    let settings = { agencies: {} };
    if (fs.existsSync(jsonPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {}
    }
    settings.agencies = settings.agencies || {};
    settings.agencies[DEMO_AGENCY_ID] = agencyData;
    settings.agencies['carmax'] = agencyData;
    settings.agencies['demo'] = agencyData;
    fs.writeFileSync(jsonPath, JSON.stringify(settings, null, 2));
    console.log('✅ Local .agency_settings.json updated.');
  } catch (err) {
    console.error('Error writing .agency_settings.json:', err);
  }

  // 3. Clear old vehicles for demo agency and insert 8 realistic vehicles
  const { error: delVehErr } = await supabase.from('vehicles').delete().eq('agency_id', DEMO_AGENCY_ID);
  if (delVehErr) console.warn('Warning deleting old vehicles:', delVehErr);

  const { data: insertedVehicles, error: vehErr } = await supabase.from('vehicles').insert(demoVehicles).select();
  if (vehErr) {
    console.error('Error inserting demo vehicles:', vehErr);
  } else {
    console.log(`✅ Successfully seeded ${insertedVehicles ? insertedVehicles.length : demoVehicles.length} vehicles.`);
  }

  // 4. Insert demo leads (insert without select)
  const { error: leadErr } = await supabase.from('auto_leads').insert(demoLeads);
  if (leadErr) {
    console.error('Error inserting demo leads:', leadErr);
  } else {
    console.log(`✅ Successfully seeded ${demoLeads.length} CRM leads.`);
  }

  // 5. Insert demo inbox conversations
  const { error: delConvsErr } = await supabase.from('inbox_conversations').delete().eq('agency_id', DEMO_AGENCY_ID);
  if (delConvsErr) console.warn('Warning deleting old conversations:', delConvsErr);

  const { data: insertedConvs, error: convErr } = await supabase.from('inbox_conversations').insert(demoConversations).select();
  if (convErr) {
    console.error('Error inserting demo conversations:', convErr);
  } else {
    console.log(`✅ Successfully seeded ${insertedConvs ? insertedConvs.length : demoConversations.length} inbox conversations.`);
  }

  console.log('--- SEEDING COMPLETE ---');
}

seed();
