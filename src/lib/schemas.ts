import { z } from "zod";

// Esquema para Propiedades
export const propertySchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(255),
  type: z.enum(["casa", "apartamento", "local", "terreno"]),
  operation: z.enum(["venta", "alquiler"]),
  price: z.number().positive("El precio debe ser un número positivo"),
  currency: z.string().default("USD"),
  bedrooms: z.number().int().nonnegative().nullable().optional(),
  bathrooms: z.number().int().nonnegative().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(["disponible", "reservada", "vendida", "alquilada"]).default("disponible"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  polygon: z.string().nullable().optional(),
  youtube_videos: z.string().nullable().optional(),
});

// Esquema para Leads (CRM)
export const leadSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  property: z.string().min(1, "La propiedad es requerida"),
  status: z.enum(["nuevo", "contactado", "visita", "negociacion"]).default("nuevo"),
});

// Esquema para Formulario de Contacto
export const contactFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  propertyId: z.string().optional().or(z.literal("")),
  propertyName: z.string().optional().or(z.literal("")),
  message: z.string().optional(),
});

// Esquema para Agentes/Usuarios
export const agentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  role: z.enum(["admin", "manager", "agent"]),
});

// Esquema para Eventos/Calendario
export const eventSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  start: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha de inicio inválida",
  }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha de fin inválida",
  }),
  type: z.enum(["visita", "reunion", "llamada"]),
});

// Esquema para Configuración de Google
export const googleConfigSchema = z.object({
  clientId: z.string().min(10, "El Client ID debe tener al menos 10 caracteres"),
  clientSecret: z.string().min(10, "El Client Secret debe tener al menos 10 caracteres"),
});

// Esquema para Alquileres
export const rentalSchema = z.object({
  property: z.string().min(1, "La propiedad es requerida"),
  tenant: z.string().min(2, "El nombre del inquilino debe tener al menos 2 caracteres"),
  price: z.number().positive("El precio debe ser un número positivo"),
  currency: z.string().default("USD"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha de finalización inválida",
  }),
});

// Esquema para Tickets de Soporte
export const ticketSchema = z.object({
  title: z.string().min(3, "El título del ticket debe tener al menos 3 caracteres"),
  desc: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  priority: z.enum(["alta", "media", "baja"]),
});

// Esquema para Desarrollos
export const developmentSchema = z.object({
  name: z.string().min(3, "El nombre del desarrollo debe tener al menos 3 caracteres"),
  location: z.string().min(3, "La ubicación es requerida"),
  status: z.string().default("En construcción"),
  progress: z.number().min(0).max(100).default(0),
});

// Esquema para Lotes
export const lotSchema = z.object({
  number: z.string().min(1, "El número de lote es requerido"),
  size: z.number().positive("La superficie debe ser un número positivo"),
  price: z.number().positive("El precio debe ser un número positivo"),
  currency: z.string().default("USD"),
  status: z.enum(["disponible", "reservado", "vendido"]).default("disponible"),
});

// Esquema para Pagos
export const paymentSchema = z.object({
  rental_id: z.string(),
  month: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  due_date: z.string(),
  status: z.enum(["pagado", "pendiente", "vencido"]),
});

// Esquema para Tickets de Inquilinos
export const tenantTicketSchema = z.object({
  title: z.string().min(3, "El título del ticket debe tener al menos 3 caracteres"),
  desc: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  priority: z.enum(["Alta", "Media", "Baja"]),
  tenantEmail: z.string().email("Correo electrónico inválido"),
});

// Esquema para Vehículos
export const vehicleSchema = z.object({
  brand: z.string().min(2, "La marca debe tener al menos 2 caracteres").max(100),
  model: z.string().min(2, "El modelo debe tener al menos 2 caracteres").max(100),
  year: z.number().int().min(1900, "Año inválido").max(new Date().getFullYear() + 2, "Año inválido"),
  kms: z.number().nonnegative("El kilometraje no puede ser negativo"),
  transmission: z.enum(["manual", "automatica"]),
  fuel: z.enum(["nafta", "diesel", "hibrido", "electrico"]),
  price: z.number().positive("El precio debe ser un número positivo"),
  currency: z.string().default("USD"),
  color: z.string().optional().or(z.literal("")),
  engine: z.string().optional().or(z.literal("")),
  doors: z.number().int().positive().optional().nullable(),
  plate: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["disponible", "reservado", "vendido"]).default("disponible"),
});

// Esquema para Leads de Automotora
export const autoLeadSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  vehicle: z.string().min(1, "El vehículo es requerido"),
  vehicle_id: z.string().min(1, "El ID del vehículo es requerido"),
  status: z.enum(["nuevo", "contactado", "test_drive", "negociacion", "cerrado"]).default("nuevo"),
});


