/**
 * Script de Seed Data para la cuenta demo mauricio@automotora.com
 * Usa el schema real de la tabla vehicles (sin is_published_web/is_featured_web)
 * 
 * Uso: node scripts/seed_demo_data_v2.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://joadvlatdeyamtspvruu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';
const AGENCY_ID = '00000000-0000-0000-0000-000000000000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Vehículos demo con schema real (sin is_published_web/is_featured_web)
const DEMO_VEHICLES = [
  {
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    kms: 41000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 19800,
    currency: 'USD',
    color: 'Gris Meteorito',
    engine: '1.5L Turbo VTEC',
    doors: 4,
    plate: 'SFF 7830',
    description: 'Honda Civic Turbo 2021. Motor 1.5 turbo 174hp. Impecable, sin choques ni pintura. Honda Sensing, frenado automático de emergencia, alerta de carril, faros LED. Titular vende.',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'],
    status: 'disponible',
  },
  {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2023,
    kms: 12000,
    transmission: 'manual',
    fuel: 'nafta',
    price: 17500,
    currency: 'USD',
    color: 'Azul Atlántico',
    engine: '1.0L TSI 95hp',
    doors: 4,
    plate: 'SLK 2209',
    description: 'VW Polo TSI 2023 casi nuevo. Garantía de fábrica vigente. Pantalla central 8", Bluetooth, conectividad USB, sensor de estacionamiento trasero. Ideal primer auto.',
    images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'],
    status: 'disponible',
  },
  {
    brand: 'Nissan',
    model: 'Frontier',
    year: 2020,
    kms: 68000,
    transmission: 'manual',
    fuel: 'diesel',
    price: 28900,
    currency: 'USD',
    color: 'Blanco',
    engine: '2.3L Diesel 190hp',
    doors: 4,
    plate: 'SBT 9912',
    description: 'Nissan Frontier Pro-4X 2020. Doble cabina, 4x4, diesel. Ideal trabajo y aventura. Barras laterales, caja de herramientas, deflectores. Servicio al día. Financio con Banco República.',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    status: 'disponible',
  },
  {
    brand: 'Chevrolet',
    model: 'Onix Plus',
    year: 2022,
    kms: 35000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 15200,
    currency: 'USD',
    color: 'Rojo Absoluto',
    engine: '1.0L Turbo 116hp',
    doors: 4,
    plate: 'SIC 4401',
    description: 'Chevrolet Onix Plus Premier 2022 automático. Versión tope de gama con cuero, pantalla 8", cámara 360°, sensores delanteros y traseros, arranque sin llave. Acepto auto en parte de pago.',
    images: ['https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?w=800&q=80'],
    status: 'disponible',
  },
  {
    brand: 'Ford',
    model: 'EcoSport',
    year: 2021,
    kms: 52000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 18700,
    currency: 'USD',
    color: 'Gris Magnético',
    engine: '2.0L EcoBoost 170hp',
    doors: 4,
    plate: 'SHE 3318',
    description: 'Ford EcoSport Titanium 2021 automático. SUV familiar ideal para ciudad y ruta. Full equipo: cuero beige, climatizador automático, cámara retroceso, SYNC3 con pantalla 8", control crucero adaptativo.',
    images: ['https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80'],
    status: 'disponible',
  },
  {
    brand: 'Renault',
    model: 'Duster',
    year: 2022,
    kms: 29000,
    transmission: 'manual',
    fuel: 'nafta',
    price: 16400,
    currency: 'USD',
    color: 'Naranja Atacama',
    engine: '1.6L 16V 115hp',
    doors: 4,
    plate: 'SJR 5567',
    description: 'Renault Duster Iconic 2022. Faros LED, llantas de aleación 17", techo negro bicolor, pantalla multimedia 8" con GPS integrado. Único dueño.',
    images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'],
    status: 'disponible',
  },
];

// Leads demo
const DEMO_LEADS = [
  {
    name: 'Sebastián Moreira',
    email: 'sebastian.moreira@gmail.com',
    phone: '+59891234567',
    vehicle: 'Toyota Corolla 2022',
    message: 'Hola, vi el Corolla en su página web. Me interesa mucho, ¿está disponible para verlo este fin de semana? ¿Aceptan parte de pago con mi Gol Trend 2018?',
    status: 'nuevo',
    tags: ['interesado', 'parte-de-pago'],
  },
  {
    name: 'Laura Fernández',
    email: 'laura.fernandez@outlook.com',
    phone: '+59898765432',
    vehicle: 'Volkswagen Polo 2023',
    message: 'Buenas tardes, quiero consultar si el Polo TSI 2023 tiene garantía vigente y si está negociable el precio. Puedo ir a verlo mañana a la tarde.',
    status: 'contactado',
    tags: ['primera-vez', 'financiacion'],
  },
  {
    name: 'Martín García',
    email: 'martin.garcia@empresa.com.uy',
    phone: '+59899001122',
    vehicle: 'Nissan Frontier 2020',
    message: 'Necesito la Frontier para trabajo en el campo. ¿Tiene revisión técnica al día? ¿Cuál es el precio final con transferencia? Tengo efectivo disponible.',
    status: 'test_drive',
    tags: ['urgente', 'efectivo'],
  },
  {
    name: 'Valentina Rodríguez',
    email: 'valen.rodriguez@gmail.com',
    phone: '+59894556677',
    vehicle: 'Honda Civic 2021',
    message: 'Hola! Vi el Civic en Facebook y me encantó. ¿Puede enviarme más fotos del interior y del motor? También quiero saber si tiene el segundo juego de llaves.',
    status: 'contactado',
    tags: ['facebook-lead', 'interesada'],
  },
  {
    name: 'Diego Suárez',
    email: 'diego.suarez.uy@gmail.com',
    phone: '+59895112233',
    vehicle: 'Chevrolet Onix Plus 2022',
    message: 'Buenas, ¿el Onix Plus tiene el tapizado de cuero original o es aftermarket? ¿Cuántas personas puede llevar de manera cómoda? Consulto para mi familia de 5.',
    status: 'nuevo',
    tags: ['consulta-tecnica'],
  },
  {
    name: 'Ana Couto',
    email: 'ana.couto@correo.uy',
    phone: '+59892334455',
    vehicle: 'Ford EcoSport 2021',
    message: 'Hola buenas! Estoy buscando una SUV para uso familiar. La EcoSport me gusta, pero ¿tiene tracción 4x4? ¿Puedo llevarla a mi mecánico antes de decidir?',
    status: 'negociacion',
    tags: ['revision-precompra', 'familia'],
  },
  {
    name: 'Pablo Acosta',
    email: 'pablo.acosta.moto@gmail.com',
    phone: '+59891778899',
    vehicle: 'Renault Duster 2022',
    message: 'Buen día, me interesa el Duster naranja. Soy del interior, ¿hacen envíos o puedo coordinar para verlo el próximo sábado? ¿Aceptan tarjeta de crédito para la seña?',
    status: 'test_drive',
    tags: ['interior', 'seña'],
  },
  {
    name: 'Camila Torres',
    email: 'camila.torres@hotmail.com',
    phone: '+59893445566',
    vehicle: 'Toyota Corolla 2022',
    message: 'Vi el Corolla en Instagram y me parece excelente relación precio-valor. ¿Tienen financiación propia o trabajan con algún banco? ¿Puedo simular cuotas en 36 meses?',
    status: 'cerrado',
    tags: ['instagram-lead', 'financiado', 'venta-concretada'],
  },
];

async function main() {
  console.log('\n🚀 Iniciando seed de datos demo (v2) para mauricio@automotora.com\n');
  console.log(`📦 Agency ID: ${AGENCY_ID}\n`);

  // --- Insertar vehículos ---
  console.log('🚗 Insertando vehículos demo...');
  let vehiclesInserted = 0;

  for (const vehicle of DEMO_VEHICLES) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ ...vehicle, agency_id: AGENCY_ID }])
      .select('id, brand, model, year');
    
    if (error) {
      console.warn(`  ⚠️  Error insertando ${vehicle.brand} ${vehicle.model}:`, error.message);
    } else {
      console.log(`  ✅ ${vehicle.brand} ${vehicle.model} ${vehicle.year} — ID: ${data?.[0]?.id}`);
      vehiclesInserted++;
    }
  }

  console.log(`\n✅ ${vehiclesInserted}/${DEMO_VEHICLES.length} vehículos insertados.\n`);

  // --- Insertar leads ---
  console.log('👥 Insertando leads/contactos demo...');
  let leadsInserted = 0;

  for (const lead of DEMO_LEADS) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 23);
    const createdAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('auto_leads')
      .insert([{
        ...lead,
        agency_id: AGENCY_ID,
        created_at: createdAt,
      }])
      .select('id, name');
    
    if (error) {
      console.warn(`  ⚠️  Error insertando lead ${lead.name}:`, error.message);
    } else {
      console.log(`  ✅ ${lead.name} (${lead.status}) — ID: ${data?.[0]?.id}`);
      leadsInserted++;
    }
  }

  console.log(`\n✅ ${leadsInserted}/${DEMO_LEADS.length} leads insertados.\n`);

  // Verificar estado final
  const { data: finalVehicles } = await supabase.from('vehicles').select('id, brand, model, price').eq('agency_id', AGENCY_ID);
  const { data: finalLeads } = await supabase.from('auto_leads').select('id, name, status').eq('agency_id', AGENCY_ID);
  
  console.log(`\n📊 Estado final:`);
  console.log(`  - Vehículos totales: ${finalVehicles?.length || 0}`);
  console.log(`  - Leads totales: ${finalLeads?.length || 0}`);
  console.log('\n🎉 ¡Seed completado!\n');
}

main().catch(console.error);
