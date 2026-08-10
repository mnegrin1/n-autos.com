import fs from "fs";
import path from "path";

const PRIMARY_STORAGE_PATH = path.join(/*turbopackIgnore: true*/ process.cwd(), ".agency_settings.json");
const FALLBACK_STORAGE_PATH = path.join("/tmp", ".agency_settings.json");

export interface AgencySettingsRecord {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  primary_color?: string;
  secondary_color?: string;
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
  updated_at?: string;
}

export const DEFAULT_AGENCY_SETTINGS: AgencySettingsRecord = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Automotora",
  subdomain: "hola",
  whatsapp: "+598 99 123 456",
  primary_color: "#10b981",
  secondary_color: "#059669",
  web_template: "standard",
  logo_url: "",
  cover_url: "",
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

/**
 * Obtiene la configuración de la agencia persistida en el servidor
 */
export function getPersistentAgencySettings(targetKey?: string): AgencySettingsRecord {
  const pathsToTry = [PRIMARY_STORAGE_PATH, FALLBACK_STORAGE_PATH];
  let newestData: Record<string, any> | null = null;
  let newestMtime = 0;

  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs >= newestMtime) {
          const content = fs.readFileSync(filePath, "utf8");
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
            newestMtime = stats.mtimeMs;
            newestData = parsed;
          }
        }
      }
    } catch (err) {
      console.error(`Error leyendo archivo de configuración persistente (${filePath}):`, err);
    }
  }

  if (newestData) {
    const cleanKey = targetKey?.trim().toLowerCase();

    // Si existe el diccionario por agencias
    if (newestData.agencies && typeof newestData.agencies === "object") {
      if (cleanKey && newestData.agencies[cleanKey]) {
        return {
          ...DEFAULT_AGENCY_SETTINGS,
          ...newestData.agencies[cleanKey],
        };
      }
      if (cleanKey) {
        for (const [_, agencyRecord] of Object.entries(newestData.agencies)) {
          const rec = agencyRecord as any;
          if (rec.subdomain?.toLowerCase() === cleanKey || rec.id === targetKey) {
            return {
              ...DEFAULT_AGENCY_SETTINGS,
              ...rec,
            };
          }
        }
      }
    }

    // BUG5 FIX: Fallback a nivel raíz SOLO si el id o subdominio coincide explícitamente.
    // De lo contrario, retornar solo DEFAULT_AGENCY_SETTINGS para no mezclar datos de distintas agencias.
    if (cleanKey && (newestData.subdomain?.toLowerCase() === cleanKey || newestData.id === targetKey)) {
      return {
        ...DEFAULT_AGENCY_SETTINGS,
        ...newestData,
      };
    }

    // Si se busca por clave específica y no hay match, retornar defaults limpios
    if (cleanKey) {
      return DEFAULT_AGENCY_SETTINGS;
    }

    // Si se llama sin clave (getAll), devolver el primer registro disponible para retrocompatibilidad
    return {
      ...DEFAULT_AGENCY_SETTINGS,
      ...newestData,
    };
  }

  return DEFAULT_AGENCY_SETTINGS;
}

/**
 * Guarda los cambios de configuración de la agencia de forma permanente en disco
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

  // Cargar estado raw actual en disco para preservar el diccionario multitenant
  let rawStore: Record<string, any> = {};
  const pathsToTry = [PRIMARY_STORAGE_PATH, FALLBACK_STORAGE_PATH];
  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          rawStore = parsed;
          break;
        }
      }
    } catch {}
  }

  if (!rawStore.agencies || typeof rawStore.agencies !== "object") {
    rawStore.agencies = {};
  }

  if (updated.id) {
    rawStore.agencies[updated.id] = updated;
  }
  if (updated.subdomain) {
    rawStore.agencies[updated.subdomain.toLowerCase()] = updated;
  }
  Object.assign(rawStore, updated);

  const jsonStr = JSON.stringify(rawStore, null, 2);

  const pathsToSave = [PRIMARY_STORAGE_PATH, FALLBACK_STORAGE_PATH];
  for (const filePath of pathsToSave) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf8");
    } catch (err) {
      console.error(`Error guardando en archivo de configuración (${filePath}):`, err);
    }
  }

  return updated;
}
