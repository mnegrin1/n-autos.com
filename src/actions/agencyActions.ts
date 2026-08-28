"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { 
  checkSubdomainHistory, 
  recordSubdomainChange, 
  isSubdomainAvailable 
} from "@/lib/subdomainHistoryStore";
import {
  getPersistentAgencySettings,
  savePersistentAgencySettings
} from "@/lib/persistentAgencyStore";

// Persistent server-side in-memory agency store to guarantee instant persistence
const serverAgencyStore: Record<string, any> = {};

export async function clearServerAgencyCache(key: string) {
  if (!key) return;
  const cleanKey = key.trim().toLowerCase();
  delete serverAgencyStore[cleanKey];
  delete serverAgencyStore[key];
}


const DEFAULT_BASE_DEFAULTS = {
  name: "Automotora",
  subdomain: "hola",
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

export async function getAgencyBySlug(slug: string): Promise<any> {
  const cleanSlug = slug.trim().toLowerCase();
  const persistent = getPersistentAgencySettings(cleanSlug);

  // 1. Verificar si el subdominio está en el historial de subdominios cambiados
  const historyRecord = await checkSubdomainHistory(cleanSlug);
  if (historyRecord) {
    return {
      isUnavailable: true,
      isChangedSubdomain: true,
      oldSubdomain: cleanSlug,
      newSubdomain: historyRecord.new_subdomain,
      agencyId: historyRecord.agency_id,
    };
  }

  const cached = serverAgencyStore[cleanSlug] || {};

  try {
    const initialRes = await (supabaseAdmin.from("agencies") as any)
      .select("*")
      .eq("subdomain", cleanSlug)
      .maybeSingle();

    let data = initialRes.data;
    const error = initialRes.error;

    if ((error || !data) && cleanSlug === "demo") {
      const fallbackRes = await (supabaseAdmin.from("agencies") as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (!fallbackRes.error && fallbackRes.data) {
        data = fallbackRes.data;
      }
    }

    if (!data && cleanSlug !== "demo") {

      const hasPersistentMatch = persistent && persistent.subdomain && persistent.subdomain.toLowerCase() === cleanSlug;
      const hasMemoryMatch = serverAgencyStore[cleanSlug] && serverAgencyStore[cleanSlug].subdomain === cleanSlug;

      if (hasPersistentMatch || hasMemoryMatch) {
        const merged = {
          ...DEFAULT_BASE_DEFAULTS,
          ...persistent,
          ...(serverAgencyStore[cleanSlug] || {}),
          subdomain: cleanSlug,
        };
        serverAgencyStore[cleanSlug] = merged;
        if (merged.id) {
          serverAgencyStore[merged.id] = merged;
        }
        return merged;
      }

      return {
        isNotFound: true,
        subdomain: cleanSlug,
      };
    }

    const cleanData = data ? Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== "")) : {};

    const merged = {
      ...DEFAULT_BASE_DEFAULTS,
      ...persistent,
      ...cleanData,
      ...cached,
      ...(data?.id ? { id: data.id } : {}),
      ...(data?.subdomain ? { subdomain: data.subdomain } : {}),
      ...(data?.name ? { name: data.name } : {}),
    };

    if (!persistent.name || persistent.name === "Automotora") {
      if (cleanData.name) merged.name = cleanData.name as string;
    }
    if (!persistent.subdomain || persistent.subdomain === "hola") {
      if (cleanData.subdomain) merged.subdomain = cleanData.subdomain as string;
    }

    serverAgencyStore[cleanSlug] = merged;
    if (merged.subdomain) {
      serverAgencyStore[merged.subdomain] = merged;
    }
    if (data?.id) {
      serverAgencyStore[data.id] = merged;
    }
    return merged;
  } catch (e) {
    console.error("Error connecting to Supabase for agency:", e);
  }

  return {
    ...DEFAULT_BASE_DEFAULTS,
    ...persistent,
    ...cached,
  };
}

export async function getPrimaryAgency(agencyId?: string): Promise<any> {
  const isDemoQuery = !agencyId || agencyId === "00000000-0000-0000-0000-000000000000";
  const targetId = agencyId && agencyId !== "00000000-0000-0000-0000-000000000000" ? agencyId : null;
  const persistent = getPersistentAgencySettings(targetId || (isDemoQuery ? "00000000-0000-0000-0000-000000000000" : undefined));

  try {
    let data: any = null;

    if (targetId) {
      const res = await (supabaseAdmin.from("agencies") as any).select("*").eq("id", targetId).maybeSingle();
      if (!res.error && res.data) {
        data = res.data;
      }
    } else if (isDemoQuery) {
      const fallbackRes = await (supabaseAdmin.from("agencies") as any).select("*").limit(1).maybeSingle();
      if (!fallbackRes.error && fallbackRes.data) {
        data = fallbackRes.data;
      }
    }

    const cached = (data?.id ? serverAgencyStore[data.id] : null) || (agencyId ? serverAgencyStore[agencyId] : null) || (data?.subdomain ? serverAgencyStore[data.subdomain] : null) || {};
    const cleanData = data ? Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== "")) : {};

    const merged = {
      ...DEFAULT_BASE_DEFAULTS,
      ...persistent,
      ...cleanData,
      ...cached,
      ...(agencyId ? { id: agencyId } : data?.id ? { id: data.id } : {}),
      ...(data?.subdomain ? { subdomain: data.subdomain } : {}),
      ...(data?.name ? { name: data.name } : {}),
    };

    if (!persistent.name || persistent.name === "Automotora") {
      if (cleanData.name) merged.name = cleanData.name as string;
    }
    if (!persistent.subdomain || persistent.subdomain === "hola") {
      if (cleanData.subdomain) merged.subdomain = cleanData.subdomain as string;
    }

    if (data?.id) serverAgencyStore[data.id] = merged;
    if (agencyId) serverAgencyStore[agencyId] = merged;
    if (merged.subdomain) serverAgencyStore[merged.subdomain] = merged;

    return merged;
  } catch (e) {
    console.error("Error al obtener la agencia principal:", e);
  }

  const cached = (agencyId ? serverAgencyStore[agencyId] : null) || {};
  return {
    ...DEFAULT_BASE_DEFAULTS,
    ...(agencyId ? { id: agencyId } : {}),
    ...persistent,
    ...cached,
  };
}

export async function updateAgencySettings(
  agencyId: string,
  updates: { 
    name?: string; 
    primary_color?: string; 
    subdomain?: string; 
    logo_url?: string; 
    whatsapp?: string; 
    cover_url?: string; 
    publish_sold?: boolean;
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
  },
  isSuperAdminAction: boolean = false
) {
  try {
    // Si no es una acción de Superadmin, no permitir cambiar directamente el nombre de la automotora
    if (!isSuperAdminAction && updates.name !== undefined) {
      delete updates.name;
    }

    // 2. Determinar ID objetivo real y subdominio previo
    let dbAgency: any = null;
    let targetId = agencyId;

    if (agencyId && agencyId !== "00000000-0000-0000-0000-000000000000") {
      const { data } = await (supabaseAdmin.from("agencies") as any)
        .select("*")
        .eq("id", agencyId)
        .maybeSingle();
      if (data) {
        dbAgency = data;
        targetId = data.id;
      }
    }

    if (!dbAgency) {
      const { data } = await (supabaseAdmin.from("agencies") as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        dbAgency = data;
        targetId = data.id;
      }
    }

    const currentSubdomain = dbAgency?.subdomain || "hola";

    // 3. Validar disponibilidad si hay cambio de subdominio
    let oldSubdomainToRecord: string | null = null;
    if (updates.subdomain && updates.subdomain.trim().toLowerCase() !== currentSubdomain.toLowerCase()) {
      const newSubdomain = updates.subdomain.trim().toLowerCase();
      const availability = await isSubdomainAvailable(newSubdomain, targetId);
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || "El subdominio solicitado no está disponible.",
        };
      }
      oldSubdomainToRecord = currentSubdomain;
    }

    const slugKey = updates.subdomain || currentSubdomain || "hola";
    const currentCached = (targetId ? serverAgencyStore[targetId] : null) || serverAgencyStore[slugKey] || (agencyId ? serverAgencyStore[agencyId] : null) || {};
    const persistentRecord = getPersistentAgencySettings(targetId || slugKey);

    const updatedRecord = {
      ...DEFAULT_BASE_DEFAULTS,
      ...(dbAgency || {}),
      ...persistentRecord,
      ...currentCached,
      ...updates,
      id: targetId,
    };

    // 1. Guardar de inmediato en almacenamiento permanente en disco (.agency_settings.json y /tmp) por ID / Subdominio
    const finalSavedRecord = savePersistentAgencySettings(updatedRecord as any, targetId || agencyId);

    // Actualizar almacenamiento en memoria local inmediatamente
    serverAgencyStore[slugKey] = finalSavedRecord;
    serverAgencyStore[targetId] = finalSavedRecord;
    if (agencyId) serverAgencyStore[agencyId] = finalSavedRecord;
    if (updates.subdomain) {
      serverAgencyStore[updates.subdomain] = finalSavedRecord;
      if (oldSubdomainToRecord && serverAgencyStore[oldSubdomainToRecord]) {
        delete serverAgencyStore[oldSubdomainToRecord];
      }
    }

    const triggerRevalidation = (newSub?: string, oldSub?: string) => {
      revalidatePath("/");
      revalidatePath("/admin/settings");
      revalidatePath("/admin/vehicles");
      revalidatePath("/portal/[agency]", "page");
      revalidatePath("/portal/[agency]", "layout");
      if (newSub) {
        revalidatePath(`/portal/${newSub}`, "page");
        revalidatePath(`/portal/${newSub}`, "layout");
      }
      if (oldSub) {
        revalidatePath(`/portal/${oldSub}`, "page");
        revalidatePath(`/portal/${oldSub}`, "layout");
      }
    };

    // 4. Filtrar payload ÚNICAMENTE a columnas que existen en la tabla Supabase 'agencies'
    const validPostgresColumns = ["name", "subdomain", "logo_url", "primary_color", "secondary_color"];
    const cleanDbPayload: Record<string, any> = {};
    validPostgresColumns.forEach((col) => {
      if ((updates as any)[col] !== undefined) {
        cleanDbPayload[col] = (updates as any)[col];
      }
    });

    // Intentar actualización SQL limpia en Supabase DB
    if (Object.keys(cleanDbPayload).length > 0) {
      try {
        if (dbAgency?.id) {
          await (supabaseAdmin.from("agencies") as any)
            .update(cleanDbPayload)
            .eq("id", targetId);
        } else {
          await (supabaseAdmin.from("agencies") as any)
            .upsert({
              ...(targetId && targetId !== "00000000-0000-0000-0000-000000000000" ? { id: targetId } : {}),
              name: updates.name || "Automotora",
              subdomain: slugKey,
              ...cleanDbPayload,
            });
        }
      } catch (err) {
        console.warn("Aviso: Supabase RLS o tabla impidió update directo, mantenido en tienda persistente:", err);
      }
    }

    // 5. Si se cambió el subdominio, registrar en el historial
    if (oldSubdomainToRecord && updates.subdomain) {
      await recordSubdomainChange(targetId, oldSubdomainToRecord, updates.subdomain);
    }

    triggerRevalidation(slugKey, oldSubdomainToRecord || undefined);

    return { 
      success: true, 
      data: updatedRecord 
    };
  } catch (e: any) {
    console.error("Error al actualizar la configuración:", e);
    const persistentRecord = getPersistentAgencySettings();
    return {
      success: true,
      data: persistentRecord
    };
  }
}
