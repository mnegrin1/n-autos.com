/**
 * Script de Seed de Datos Demo para mauricionegrinmogni1@gmail.com
 * Inserta y actualiza agencia, usuario admin, vehículos, leads y conversaciones en Supabase y .agency_settings.json
 * 
 * Uso: node scripts/seed_mauricio_demo.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const AGENCY_ID = '7bdc2014-f7e0-44c3-a8b4-33152937bfa6';
const USER_EMAIL = 'mauricionegrinmogni1@gmail.com';
const SUBDOMAIN = 'mn-automotores';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" fill="none"><rect width="400" height="100" rx="16" fill="%230f172a"/><path d="M40 68 L60 32 L80 32 L100 68 M60 52 L80 52" stroke="%232563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M95 68 L115 32 L135 68 L155 32 L175 68" stroke="%233b82f6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="190" y="52" fill="%23ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="26" letter-spacing="1">M%26N AUTOS</text><text x="190" y="72" fill="%2394a3b8" font-family="system-ui, sans-serif" font-weight="600" font-size="13" letter-spacing="3">SELECTION</text></svg>`;

const AGENCY_DATA_DB = {
  name: 'M&N Automotores Selection',
  subdomain: SUBDOMAIN,
  logo_url: LOGO_SVG,
  primary_color: '#0f172a',
  secondary_color: '#2563eb'
};

const AGENCY_DATA_FULL = {
  id: AGENCY_ID,
  ...AGENCY_DATA_DB,
  cover_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&q=80',
  font_family: 'Inter',
  web_template: 'standard',
  hero_eyebrow: 'AUTOMOTORA OFICIAL & SELECCIÓN EXCLUSIVA',
  hero_title: 'Vehículos Seleccionados con Garantía Total',
  hero_subtitle: 'Descubre nuestra flota de unidades seminuevas y 0km. Certificación mecánica de 100 puntos, financiación flexible y toma de permutas al mejor valor.',
  footer_text: 'M&N Automotores Selection - Pasión por los autos y compromiso con la transparencia. Atención personalizada y respaldo posventa.',
  location_address: 'Av. Italia 3840, Montevideo, Uruguay',
  business_hours: 'Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:30 hs',
  contact_description: '¿Quieres agendar una prueba de manejo o cotizar tu permuta? Escríbenos directamente o visítanos en nuestro showroom.',
  about_text: 'Somos una automotora líder enfocada en brindar una experiencia transparente, ágil y de excelencia. Todas nuestras unidades pasan por una inspección rigurosa antes de la venta.',
  show_trust_section: true,
  contact_email: USER_EMAIL,
  whatsapp: '+598 99 123 456',
  latitude: -34.8872,
  longitude: -56.1315,
  trust_pillar1_title: 'Revisión de 100 Puntos',
  trust_pillar1_desc: 'Inspección técnica minuciosa y certificación de origen.',
  trust_pillar2_title: 'Financiación Flexible',
  trust_pillar2_desc: 'Planes bancarios hasta en 60 cuotas en UI o USD.',
  trust_pillar3_title: 'Toma de Usados',
  trust_pillar3_desc: 'Tasación profesional e inmediata de tu unidad.',
  trust_pillar4_title: 'Garantía & Posventa',
  trust_pillar4_desc: 'Respaldo técnico garantizado en cada vehículo.',
  updated_at: new Date().toISOString()
};

const DEMO_VEHICLES = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    agency_id: AGENCY_ID,
    brand: 'BMW',
    model: 'X3 xDrive30i M Sport',
    year: 2022,
    kms: 28000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 54900,
    currency: 'USD',
    color: 'Blanco Alpine',
    engine: '2.0L Turbo 252hp',
    doors: 5,
    plate: 'SBM 3022',
    description: 'SUV de lujo en estado inmaculado. Paquete M Sport exterior e interior, tracción integral xDrive, techo solar panorámico, pantalla Live Cockpit Professional 12.3", asientos de cuero Vernasca, audio Harman Kardon. Service oficial al día.',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    agency_id: AGENCY_ID,
    brand: 'Toyota',
    model: 'Hilux SRV 4x4 2.8 TDI',
    year: 2023,
    kms: 19500,
    transmission: 'automatica',
    fuel: 'diesel',
    price: 48500,
    currency: 'USD',
    color: 'Gris Oscuro Metalizado',
    engine: '2.8L Turbo Diesel 204hp',
    doors: 4,
    plate: 'STH 2023',
    description: 'Pick-up imponente en garantía oficial de fábrica. Motor 2.8L 204 CV, tracción 4x4 con reductora y bloqueo de diferencial, estribos de aluminio, barra anti-vuelco, protector de caja Rhino, pantalla táctil 9" con Apple CarPlay & Android Auto.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    agency_id: AGENCY_ID,
    brand: 'Audi',
    model: 'A4 2.0 TFSI S-Line',
    year: 2021,
    kms: 42000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 39800,
    currency: 'USD',
    color: 'Gris Daytona',
    engine: '2.0L TFSI Mild-Hybrid 190hp',
    doors: 4,
    plate: 'SAD 4400',
    description: 'Sedán premium deportivo. Equipamiento S-Line completo, faros Matrix LED dinámicos, Audi Virtual Cockpit digital, sistema Mild-Hybrid de bajísimo consumo, tapizado combinado alcántara/cuero y climatizador tri-zona.',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    agency_id: AGENCY_ID,
    brand: 'Volkswagen',
    model: 'Tiguan Allspace Highline',
    year: 2022,
    kms: 31000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 41200,
    currency: 'USD',
    color: 'Negro Profundo',
    engine: '2.0L TSI 220hp',
    doors: 5,
    plate: 'SVT 2022',
    description: 'SUV de 3 filas de asientos (7 pasajeros) tope de gama. Tracción integral 4Motion, techo corredizo panorámico, asientos eléctricos con memoria y calefacción, baúl con apertura manos libres "Easy Open". Único dueño.',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'
    ],
    status: 'reservada',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    agency_id: AGENCY_ID,
    brand: 'Honda',
    model: 'Civic Turbo Touring',
    year: 2021,
    kms: 38000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 26500,
    currency: 'USD',
    color: 'Plata Lunar',
    engine: '1.5L Turbo VTEC 174hp',
    doors: 4,
    plate: 'SHC 1500',
    description: 'Impecable unidad en estado original sin detalles. Paquete Honda Sensing (asistencias a la conducción), encendido remoto desde la llave, cargador inalámbrico de celular, faros full LED y sistema de sonido premium de 10 parlantes.',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    agency_id: AGENCY_ID,
    brand: 'Chevrolet',
    model: 'Tracker Premier Turbo',
    year: 2023,
    kms: 14000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 24900,
    currency: 'USD',
    color: 'Rojo Místico',
    engine: '1.2L Turbo 132hp',
    doors: 5,
    plate: 'SCT 1200',
    description: 'SUV compacta de última generación con poquísimo kilometraje. Techo solar panorámico, asistente de estacionamiento automático, alerta de colisión frontal, frenado de emergencia y punto ciego. Ficha técnica oficial.',
    images: [
      'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    agency_id: AGENCY_ID,
    brand: 'Jeep',
    model: 'Compass Limited Turbo',
    year: 2022,
    kms: 25000,
    transmission: 'automatica',
    fuel: 'nafta',
    price: 34800,
    currency: 'USD',
    color: 'Azul Bicolor',
    engine: '1.3L Turbo T270 175hp',
    doors: 5,
    plate: 'SJC 2700',
    description: 'Versión Limited con pantalla Uconnect 10.1", instrumental 100% digital 10.25", tapizados de cuero beige, sonido Beats con subwoofer, faros Full LED y techo bi-tono negro.',
    images: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    agency_id: AGENCY_ID,
    brand: 'Hyundai',
    model: 'HB20X 1.6 Premium',
    year: 2022,
    kms: 33000,
    transmission: 'manual',
    fuel: 'nafta',
    price: 16800,
    currency: 'USD',
    color: 'Blanco Polar',
    engine: '1.6L Gamma 123hp',
    doors: 5,
    plate: 'SHB 1600',
    description: 'Hatchback aventurero con excelente despeje del suelo. Muy económico y confiable. Equipado con llantas de aleación 16", pantalla táctil 8" con Apple CarPlay/Android Auto, cámara de retroceso y sensor de luz.',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    agency_id: AGENCY_ID,
    brand: 'Ford',
    model: 'Ranger Limited 3.2 4x4',
    year: 2021,
    kms: 55000,
    transmission: 'automatica',
    fuel: 'diesel',
    price: 42000,
    currency: 'USD',
    color: 'Plata Gris',
    engine: '3.2L Duratorq 200hp',
    doors: 4,
    plate: 'SFR 3200',
    description: 'La camioneta más equipada de su categoría. Motor 5 cilindros 3.2 L de 200 CV y 470 Nm. Control crucero adaptativo, mantenedor de carril, enganche de remolque reforzado y lona marítima.',
    images: [
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80'
    ],
    status: 'disponible',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000000',
    agency_id: AGENCY_ID,
    brand: 'Tesla',
    model: 'Model 3 Long Range Dual',
    year: 2022,
    kms: 22000,
    transmission: 'automatica',
    fuel: 'electrico',
    price: 49000,
    currency: 'USD',
    color: 'Blanco Perla',
    engine: 'Dual Motor AWD 441hp',
    doors: 4,
    plate: 'STM 3000',
    description: '100% Eléctrico. Autonomía EPA de 580 km por carga. Tracción en las 4 ruedas Dual Motor, Autopilot activado, aceleración 0-100 km/h en 4.4 segundos, pantalla de 15", interior premium en cuero negro y techo panorámico de cristal.',
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80'
    ],
    status: 'vendida',
  }
];

const DEMO_LEADS = [
  {
    agency_id: AGENCY_ID,
    name: 'Carlos Benítez',
    email: 'carlos.benitez@gmail.com',
    phone: '+59899234567',
    vehicle: 'BMW X3 xDrive30i M Sport',
    vehicle_id: '11111111-1111-4111-8111-111111111111',
    message: 'Hola Mauricio, me interesa mucho la BMW X3 2022. Quisiera saber si puedo agendar una prueba de manejo para este viernes a la tarde. Entrego una Audi Q5 2019 como parte de pago.',
    tags: ['VIP', 'Permuta', 'Test Drive'],
    status: 'test_drive',
    time: 'Hace 2 horas'
  },
  {
    agency_id: AGENCY_ID,
    name: 'María José Rodríguez',
    email: 'majorodriguez@outlook.com',
    phone: '+59898765432',
    vehicle: 'Toyota Hilux SRV 4x4',
    vehicle_id: '22222222-2222-4222-8222-222222222222',
    message: 'Buenas tardes! Quisiera consultar las opciones de financiación para la Hilux 2023. Dispongo de USD 25.000 de entrega inicial y saldo a financiar en 36 cuotas bancarias.',
    tags: ['Financiacion', 'Entrega Inmediata'],
    status: 'negociacion',
    time: 'Hace 5 horas'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Fernando Silva',
    email: 'fsilva.uy@empresa.com.uy',
    phone: '+59894112233',
    vehicle: 'Audi A4 2.0 TFSI S-Line',
    vehicle_id: '33333333-3333-4333-8333-333333333333',
    message: 'Hola, vi el Audi A4 en la web. ¿Tiene ficha de mantenimientos al día en el representante oficial? ¿Se puede revisar con un mecánico de mi confianza antes de definir la compra?',
    tags: ['Interesado', 'Service Oficial'],
    status: 'nuevo',
    time: 'Hace 1 día'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Sofía Alvez',
    email: 'sofia.alvez@gmail.com',
    phone: '+59891556677',
    vehicle: 'Volkswagen Tiguan Allspace Highline',
    vehicle_id: '44444444-4444-4444-8444-444444444444',
    message: 'Hola Mauricio! Ya coordinamos la reserva de la Tiguan 7 asientos. Te adjunto el comprobante de transferencia de la seña por WhatsApp.',
    tags: ['Reserva', 'Familia'],
    status: 'reservada',
    time: 'Hace 1 día'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Gonzalo Méndez',
    email: 'gmendez@hotmail.com',
    phone: '+59895998877',
    vehicle: 'Chevrolet Tracker Premier Turbo',
    vehicle_id: '66666666-6666-4666-8666-666666666666',
    message: 'Hola, me comunico por la Tracker 2023 roja. ¿Aceptan permuta por un Onix Joy 2018 con 55.000 km únicos dueños?',
    tags: ['Permuta Usado'],
    status: 'contactado',
    time: 'Hace 2 días'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Lucía Pereyra',
    email: 'lpereyra@yahoo.com',
    phone: '+59892443322',
    vehicle: 'Jeep Compass Limited Turbo',
    vehicle_id: '77777777-7777-4777-8777-777777777777',
    message: 'Buenas, vi la Jeep Compass en Instagram. ¿El precio es negociable con pago al contado?',
    tags: ['Instagram Lead', 'Efectivo'],
    status: 'nuevo',
    time: 'Hace 3 días'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Rodrigo Morales',
    email: 'rodrigo.morales@gmail.com',
    phone: '+59899881122',
    vehicle: 'Ford Ranger Limited 3.2 4x4',
    vehicle_id: '99999999-9999-4999-8999-999999999999',
    message: 'Estimado Mauricio, me interesa probar la Ranger 3.2 4x4 esta semana. Trabajo en el interior y viajo el jueves.',
    tags: ['Trabajo', 'Test Drive'],
    status: 'test_drive',
    time: 'Hace 4 días'
  },
  {
    agency_id: AGENCY_ID,
    name: 'Valentina Castro',
    email: 'valen.castro@gmail.com',
    phone: '+59893332211',
    vehicle: 'Tesla Model 3 Long Range Dual',
    vehicle_id: 'a0000000-0000-4000-8000-000000000000',
    message: '¡Excelente atención Mauricio! Ya firmamos la transferencia del Tesla Model 3. Muchas gracias por la gestión impecable.',
    tags: ['Venta Concretada', 'Cliente Satisfecho'],
    status: 'cerrado',
    time: 'Hace 5 días'
  }
];

const DEMO_CONVERSATIONS = [
  {
    id: 'conv-carlos-benitez',
    agency_id: AGENCY_ID,
    lead_name: 'Carlos Benítez',
    lead_avatar: 'CB',
    channel: 'whatsapp',
    channel_sender_id: '+59899234567',
    last_message: 'Excelente Mauricio, coordinamos para el viernes a las 15:30 hs con la Audi Q5 para tasar.',
    last_message_time: 'Hace 20 min',
    unread: true,
    notes: 'Cliente muy interesado. Quiere entregar Audi Q5 2019 (aprox USD 32.000) y abonar la diferencia contado por la BMW X3.',
    messages: [
      { sender: 'client', text: 'Hola Mauricio! Vi la BMW X3 2022 en la web. ¿La tienen en el showroom para ir a verla?', time: '14:10' },
      { sender: 'agent', text: '¡Hola Carlos! Buenas tardes. Sí, la tenemos disponible en nuestro showroom de Av. Italia 3840. Estado inmaculado con 28.000 km.', time: '14:15' },
      { sender: 'client', text: 'Buenísimo. ¿Aceptan mi Audi Q5 2019 como parte de pago?', time: '14:22' },
      { sender: 'agent', text: 'Por supuesto. Hacemos tasación inmediata en el local. Si gustas, coordinamos una prueba de manejo de la X3 este viernes.', time: '14:30' },
      { sender: 'client', text: 'Excelente Mauricio, coordinamos para el viernes a las 15:30 hs con la Audi Q5 para tasar.', time: '14:45' }
    ],
    updated_at: new Date().toISOString()
  },
  {
    id: 'conv-maria-jose-rodriguez',
    agency_id: AGENCY_ID,
    lead_name: 'María José Rodríguez',
    lead_avatar: 'MR',
    channel: 'whatsapp',
    channel_sender_id: '+59898765432',
    last_message: 'Te acabo de enviar la documentación de recibo de sueldo por mail. Quedo atenta a la aprobación del banco.',
    last_message_time: 'Hace 2 horas',
    unread: false,
    notes: 'Pre-aprobación solicitada con Banco Santander en UI a 36 meses.',
    messages: [
      { sender: 'client', text: 'Hola Mauricio! Consulta por la Hilux SRV 2023. Tengo USD 25.000 de entrega. ¿Se puede financiar el resto?', time: '10:05' },
      { sender: 'agent', text: '¡Hola María José! Sí, claro. Trabajamos con Scotia, Santander y BBVA. Podemos financiar el saldo restante en hasta 36 o 48 cuotas.', time: '10:20' },
      { sender: 'client', text: '¿Qué documentación necesito enviarte para evaluar el crédito?', time: '10:40' },
      { sender: 'agent', text: 'Precisamos cédula, comprobante de domicilio y los últimos 3 recibos de sueldo o certificado de ingresos.', time: '11:00' },
      { sender: 'client', text: 'Te acabo de enviar la documentación de recibo de sueldo por mail. Quedo atenta a la aprobación del banco.', time: '12:15' }
    ],
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'conv-fernando-silva',
    agency_id: AGENCY_ID,
    lead_name: 'Fernando Silva',
    lead_avatar: 'FS',
    channel: 'web',
    channel_sender_id: 'web-lead-fsilva',
    last_message: 'Perfecto, coordinamos con el taller para llevarlo mañana a las 10 am.',
    last_message_time: 'Hace 4 horas',
    unread: false,
    notes: 'Interesado en Audi A4. Coordinada revisión técnica externa con taller especialista.',
    messages: [
      { sender: 'client', text: 'Buenas tardes. ¿El Audi A4 S-Line tiene algún detalle de pintura o mecánico?', time: '09:00' },
      { sender: 'agent', text: 'Hola Fernando, cero detalles. El vehículo cuenta con certificación de 100 puntos y ficha oficial al día.', time: '09:12' },
      { sender: 'client', text: '¿Puedo llevar a mi mecánico de confianza a escanearlo?', time: '09:30' },
      { sender: 'agent', text: 'Totalmente. Transparencia 100%. Te esperamos en el showroom cuando desees.', time: '09:45' },
      { sender: 'client', text: 'Perfecto, coordinamos con el taller para llevarlo mañana a las 10 am.', time: '10:15' }
    ],
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'conv-gonzalo-mendez',
    agency_id: AGENCY_ID,
    lead_name: 'Gonzalo Méndez',
    lead_avatar: 'GM',
    channel: 'instagram',
    channel_sender_id: 'ig-gmendez99',
    last_message: 'Bárbaro Mauricio, te paso fotos del Onix por mensaje para una primera cotización.',
    last_message_time: 'Hace 1 día',
    unread: false,
    notes: 'Evaluando permuta de Onix Joy por Chevrolet Tracker Premier.',
    messages: [
      { sender: 'client', text: 'Hola! Me interesa la Tracker roja 2023. ¿Toman usados?', time: 'Ayer 16:00' },
      { sender: 'agent', text: '¡Hola Gonzalo! Sí, tomamos vehículos usados de todas las marcas. ¿Qué modelo y año es tu vehículo?', time: 'Ayer 16:10' },
      { sender: 'client', text: 'Un Onix Joy 2018 blanco con 55.000 km.', time: 'Ayer 16:30' },
      { sender: 'agent', text: 'Excelente. Pásame algunas fotos e info de km/estado y te mandamos una cotización estimativa.', time: 'Ayer 16:45' },
      { sender: 'client', text: 'Bárbaro Mauricio, te paso fotos del Onix por mensaje para una primera cotización.', time: 'Ayer 17:00' }
    ],
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'conv-valentina-castro',
    agency_id: AGENCY_ID,
    lead_name: 'Valentina Castro',
    lead_avatar: 'VC',
    channel: 'mercadolibre',
    channel_sender_id: 'ml-user-vcastro',
    last_message: '¡Muchas gracias por la entrega impecable y por cargar la batería al 100%!',
    last_message_time: 'Hace 3 días',
    unread: false,
    notes: 'Venta concretada con éxito. Tesla Model 3 entregado.',
    messages: [
      { sender: 'client', text: 'Hola Mauricio! ¿Ya tienen pronta la libreta de propiedad a mi nombre?', time: 'Hace 3 días' },
      { sender: 'agent', text: '¡Hola Valentina! Sí, la escribanía completó la transferencia. Tu Tesla Model 3 te espera listo para retirar.', time: 'Hace 3 días' },
      { sender: 'client', text: '¡Muchas gracias por la entrega impecable y por cargar la batería al 100%!', time: 'Hace 3 días' }
    ],
    updated_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
  }
];

async function main() {
  console.log('🚀 Iniciando Seed Demo para mauricionegrinmogni1@gmail.com\n');

  // 1. Actualizar agencia en Supabase
  console.log('🏢 Actualizando agencia en Supabase (agencies)...');
  const { data: agencyResult, error: agencyError } = await supabase
    .from('agencies')
    .update(AGENCY_DATA_DB)
    .eq('id', AGENCY_ID)
    .select();

  if (agencyError) {
    console.error('❌ Error actualizando agencia en Supabase:', agencyError.message);
  } else {
    console.log(`✅ Agencia actualizada en DB: ${AGENCY_DATA_DB.name} (${AGENCY_DATA_DB.subdomain})`);
  }

  // 2. Upsert de Vehículos
  console.log('\n🚗 Upserting stock de vehículos (vehicles)...');
  let vehiclesSuccess = 0;
  for (const v of DEMO_VEHICLES) {
    const { error } = await supabase.from('vehicles').upsert(v, { onConflict: 'id' });
    if (error) {
      console.warn(`  ⚠️ Error insertando ${v.brand} ${v.model}:`, error.message);
    } else {
      console.log(`  ✅ ${v.brand} ${v.model} (${v.year}) - USD ${v.price.toLocaleString()}`);
      vehiclesSuccess++;
    }
  }
  console.log(`✅ ${vehiclesSuccess}/${DEMO_VEHICLES.length} vehículos procesados.`);

  // 3. Insertar Leads (vía INSERT público directo)
  console.log('\n👥 Insertando leads CRM (auto_leads)...');
  let leadsSuccess = 0;
  for (const l of DEMO_LEADS) {
    const { error } = await supabase.from('auto_leads').insert([l]);
    if (error) {
      console.warn(`  ⚠️ Error insertando lead ${l.name}:`, error.message);
    } else {
      console.log(`  ✅ Lead ${l.name} (${l.status})`);
      leadsSuccess++;
    }
  }
  console.log(`✅ ${leadsSuccess}/${DEMO_LEADS.length} leads procesados.`);

  // 4. Upsert de Conversaciones Inbox
  console.log('\n💬 Upserting conversaciones (inbox_conversations)...');
  let convsSuccess = 0;
  for (const c of DEMO_CONVERSATIONS) {
    const { error } = await supabase.from('inbox_conversations').upsert(c, { onConflict: 'id' });
    if (error) {
      console.warn(`  ⚠️ Error insertando conversación ${c.lead_name}:`, error.message);
    } else {
      console.log(`  ✅ Conversación con ${c.lead_name} (${c.channel})`);
      convsSuccess++;
    }
  }
  console.log(`✅ ${convsSuccess}/${DEMO_CONVERSATIONS.length} conversaciones procesadas.`);

  // 5. Actualizar almacenamiento local persistente (.agency_settings.json)
  console.log('\n💾 Sincronizando archivo .agency_settings.json...');
  try {
    const settingsPath = path.join(process.cwd(), '.agency_settings.json');
    let currentStore = {};
    if (fs.existsSync(settingsPath)) {
      try {
        currentStore = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) || {};
      } catch (e) {}
    }

    currentStore[SUBDOMAIN] = AGENCY_DATA_FULL;
    currentStore[AGENCY_ID] = AGENCY_DATA_FULL;
    currentStore['autocar'] = AGENCY_DATA_FULL;
    currentStore['mauricionegrinmogni1-gmail-com'] = AGENCY_DATA_FULL;

    fs.writeFileSync(settingsPath, JSON.stringify(currentStore, null, 2), 'utf8');
    console.log('✅ Archivo .agency_settings.json actualizado exitosamente.');
  } catch (err) {
    console.error('⚠️ Error escribiendo .agency_settings.json:', err.message);
  }

  console.log('\n🎉 ¡Seed demo completado exitosamente para mauricionegrinmogni1@gmail.com!\n');
}

main().catch(console.error);
