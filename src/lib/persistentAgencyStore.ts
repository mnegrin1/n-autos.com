export interface AgencySettingsRecord {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  web_template?: string;
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  footer_text?: string;
  location_address?: string;
  business_hours?: string;
  contact_description?: string;
  about_text?: string;
  show_trust_section?: boolean;
  contact_email?: string;
  latitude?: number;
  longitude?: number;
  trust_pillar1_title?: string;
  trust_pillar1_desc?: string;
  trust_pillar2_title?: string;
  trust_pillar2_desc?: string;
  trust_pillar3_title?: string;
  trust_pillar3_desc?: string;
  trust_pillar4_title?: string;
  trust_pillar4_desc?: string;
  calcom_link?: string;
  calcom_active?: boolean;
  updated_at?: string;
}

export const DEFAULT_AGENCY_SETTINGS: AgencySettingsRecord = {
  id: "",
  name: "Automotora",
  subdomain: "hola",
  calcom_link: "demo-automotora/test-drive",
  calcom_active: true,
  whatsapp: "+598 99 123 456",
  primary_color: "#10b981",
  secondary_color: "#059669",
  font_family: "Inter",
  web_template: "standard",
  logo_url: "",
  cover_url: "/hero_dealership_drone.jpg",
  hero_eyebrow: "AUTOMOTORA OFICIAL",
  hero_title: "Encuentra tu próximo vehículo",
  hero_subtitle: "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.",
  footer_text: "Tu concesionario de confianza. Vehículos seleccionados con certificación de origen, garantía y la mejor atención personalizada.",
  location_address: "Av. Principal 1234, Montevideo, Uruguay",
  business_hours: "Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs",
  contact_description: "¿Tienes alguna duda sobre una unidad o deseas agendar una prueba de manejo? Escríbenos directamente o visita nuestro showroom.",
  about_text: "Somos una automotora comprometida con la excelencia, la transparencia y la calidad. Ofrecemos vehículos seleccionados con certificación total, garantía y atención personalizada.",
  show_trust_section: true,
  contact_email: "contacto@automotorademo.com",
  latitude: -34.9011,
  longitude: -56.1645,
  trust_pillar1_title: "Garantía Certificada",
  trust_pillar1_desc: "Revisión mecánica rigurosa de 100 puntos.",
  trust_pillar2_title: "Financiación a Medida",
  trust_pillar2_desc: "Planes flexibles adaptados a tu presupuesto.",
  trust_pillar3_title: "Tomamos Tu Usado",
  trust_pillar3_desc: "Cotización justa e inmediata de tu unidad.",
  trust_pillar4_title: "Posventa Exclusiva",
  trust_pillar4_desc: "Atención y respaldo posterior a la entrega."
};

// In-memory agency store para ejecución serverless / Edge (Cloudflare Workers)
const memoryAgencyStore = new Map<string, AgencySettingsRecord>();

/**
 * Obtiene la configuración de la agencia persistida en memoria del servidor
 */
export function getPersistentAgencySettings(targetKey?: string): AgencySettingsRecord {
  if (!targetKey) return DEFAULT_AGENCY_SETTINGS;
  const cleanKey = targetKey.trim().toLowerCase();

  if (memoryAgencyStore.has(cleanKey)) {
    return {
      ...DEFAULT_AGENCY_SETTINGS,
      ...memoryAgencyStore.get(cleanKey)!,
    };
  }

  for (const [_, agencyRecord] of memoryAgencyStore.entries()) {
    if (agencyRecord.subdomain?.toLowerCase() === cleanKey || agencyRecord.id === targetKey) {
      return {
        ...DEFAULT_AGENCY_SETTINGS,
        ...agencyRecord,
      };
    }
  }

  return DEFAULT_AGENCY_SETTINGS;
}

/**
 * Guarda los cambios de configuración de la agencia en la memoria del runtime
 */
export function savePersistentAgencySettings(updates: Partial<AgencySettingsRecord>, agencyKey?: string): AgencySettingsRecord {
  const targetKey = agencyKey || updates.id || updates.subdomain;
  const current = getPersistentAgencySettings(targetKey);
  const updated: AgencySettingsRecord = {
    ...DEFAULT_AGENCY_SETTINGS,
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updated.id) {
    memoryAgencyStore.set(updated.id, updated);
  }
  if (updated.subdomain) {
    memoryAgencyStore.set(updated.subdomain.toLowerCase(), updated);
  }

  return updated;
}

/**
 * Elimina la configuración de una agencia de la memoria del runtime
 */
export function deletePersistentAgencySettings(targetKey: string): boolean {
  if (!targetKey) return false;
  const cleanKey = targetKey.trim().toLowerCase();
  let deleted = false;

  for (const [key, rec] of Array.from(memoryAgencyStore.entries())) {
    if (key.toLowerCase() === cleanKey || rec.id === targetKey || rec.subdomain?.toLowerCase() === cleanKey) {
      memoryAgencyStore.delete(key);
      deleted = true;
    }
  }

  return deleted;
}


