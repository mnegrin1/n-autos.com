import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLandingInquiryNotificationEmail } from "@/actions/emailActions";

export interface ServerLandingInquiry {
  id: string;
  agencyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  message?: string;
  status: "pending" | "contacted" | "converted" | "archived";
  createdAt: string;
  subdomain?: string;
}

// In-memory cache para entorno serverless / Edge
let cachedInquiries: ServerLandingInquiry[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 segundos de caché en memoria del servidor
let inMemoryInquiries: ServerLandingInquiry[] = [];

export function clearInquiryCache() {
  cachedInquiries = null;
  lastCacheTime = 0;
}

function getLocalInquiries(): ServerLandingInquiry[] {
  return inMemoryInquiries;
}

function saveLocalInquiries(inquiries: ServerLandingInquiry[]) {
  inMemoryInquiries = inquiries;
}

export async function getAllServerInquiries(forceRefresh: boolean = false): Promise<ServerLandingInquiry[]> {
  const now = Date.now();
  if (!forceRefresh && cachedInquiries !== null && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedInquiries;
  }

  try {
    const { data, error } = await (supabaseAdmin.from("inbox_conversations") as any)
      .select("*")
      .eq("channel", "landing_inquiry")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data)) {
      const supabaseInquiries: ServerLandingInquiry[] = data.map((item: any) => {
        let meta: any = {};
        try {
          meta = JSON.parse(item.notes || "{}");
        } catch (e) {}

        const createdAtFormatted = item.created_at
          ? new Date(item.created_at).toLocaleDateString("es-UY", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : new Date().toLocaleDateString("es-UY", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

        return {
          id: item.id,
          agencyName: meta.agencyName || item.lead_avatar || "Automotora",
          userName: meta.userName || item.lead_name || "Cliente",
          userEmail: meta.userEmail || "",
          phone: meta.phone || "",
          message: meta.message || item.last_message || "",
          status: meta.status || (item.unread ? "pending" : "contacted"),
          createdAt: meta.createdAt || createdAtFormatted,
          subdomain: meta.subdomain || ""
        };
      });

      const local = getLocalInquiries();
      const map = new Map<string, ServerLandingInquiry>();

      // 1. Cargar consultas de Supabase
      supabaseInquiries.forEach((item) => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      // 2. Fusionar con consultas locales para no perder las creadas recientemente
      local.forEach((item) => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      const merged = Array.from(map.values());
      saveLocalInquiries(merged);
      cachedInquiries = merged;
      lastCacheTime = Date.now();
      return merged;
    }

  } catch (e) {
    console.error("Aviso: Error obteniendo consultas desde Supabase, usando respaldo local:", e);
  }

  const local = getLocalInquiries();
  cachedInquiries = local;
  lastCacheTime = Date.now();
  return local;
}

export async function saveServerInquiry(inquiry: {
  agencyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  message?: string;
}): Promise<ServerLandingInquiry> {

  const subdomain =
    inquiry.agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) || `agency-${Date.now().toString().slice(-4)}`;

  const nowFormatted = new Date().toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const newInquiry: ServerLandingInquiry = {
    id: `inq-${Date.now()}`,
    agencyName: inquiry.agencyName,
    userName: inquiry.userName,
    userEmail: inquiry.userEmail,
    phone: inquiry.phone || "",
    message: inquiry.message || "",
    status: "pending",
    createdAt: nowFormatted,
    subdomain
  };

  // Helper para obtener un agency_id válido en Supabase que no viole la restricción FK
  let targetAgencyId = "00000000-0000-0000-0000-000000000000";
  try {
    const { data: existingSystem } = await (supabaseAdmin.from("agencies") as any)
      .select("id")
      .eq("id", targetAgencyId)
      .maybeSingle();

    if (!existingSystem) {
      // Intentar insertar la agencia del sistema si no existe
      const { data: createdSystem, error: insErr } = await (supabaseAdmin.from("agencies") as any)
        .insert([{
          id: targetAgencyId,
          name: "Plataforma N-Sistemas (System)",
          subdomain: "system"
        }])
        .select("id")
        .maybeSingle();

      if (insErr || !createdSystem) {
        // Si no se puede insertar por RLS, usar la primera agencia existente en la base de datos como fallback
        const { data: fallbackAgencies } = await (supabaseAdmin.from("agencies") as any)
          .select("id")
          .limit(1);

        if (fallbackAgencies && fallbackAgencies.length > 0 && fallbackAgencies[0].id) {
          targetAgencyId = fallbackAgencies[0].id;
        }
      }
    }
  } catch (agencyErr) {
    console.error("Aviso al verificar agency_id para landing inquiry:", agencyErr);
  }

  // 1. Guardar localmente como respaldo
  const currentLocal = getLocalInquiries();
  const updatedLocal = [newInquiry, ...currentLocal];
  saveLocalInquiries(updatedLocal);

  // 2. Persistir en Supabase
  try {
    const payload = {
      id: newInquiry.id,
      agency_id: targetAgencyId,
      lead_name: inquiry.userName,
      lead_avatar: inquiry.agencyName,
      channel: "landing_inquiry",
      last_message: inquiry.message || `Consulta de ${inquiry.agencyName}`,
      last_message_time: new Date().toISOString(),
      unread: true,
      notes: JSON.stringify({
        agencyName: inquiry.agencyName,
        userName: inquiry.userName,
        userEmail: inquiry.userEmail,
        phone: inquiry.phone || "",
        message: inquiry.message || "",
        status: "pending",
        createdAt: nowFormatted,
        subdomain
      })
    };

    let { error } = await (supabaseAdmin.from("inbox_conversations") as any).insert([payload]);
    if (error) {
      console.warn("Reintentando inserción de consulta en Supabase con agency_id null por error previo:", error.message || error);
      payload.agency_id = null as any;
      const retryResult = await (supabaseAdmin.from("inbox_conversations") as any).insert([payload]);
      error = retryResult.error;
    }

    if (error) {
      console.error("Error al guardar la consulta en Supabase:", error);
    } else {
      console.log(`✅ Consulta de landing guardada con éxito en Supabase ID: ${newInquiry.id}`);
    }
  } catch (sbErr) {
    console.error("Error al guardar la consulta en Supabase:", sbErr);
  }

  // 3. Notificar inmediatamente al Superadmin vía correo electrónico
  try {
    await sendLandingInquiryNotificationEmail("contacto@n-sistemas.com", {
      agencyName: inquiry.agencyName,
      userName: inquiry.userName,
      userEmail: inquiry.userEmail,
      phone: inquiry.phone,
      message: inquiry.message,
    });
  } catch (emailErr) {
    console.error("Error enviando correo de notificación de consulta landing:", emailErr);
  }

  clearInquiryCache();
  return newInquiry;
}

export async function updateServerInquiryStatus(
  id: string,
  status: ServerLandingInquiry["status"]
): Promise<boolean> {
  clearInquiryCache();
  // 1. Actualizar respaldo local
  const currentLocal = getLocalInquiries();
  const updatedLocal = currentLocal.map((item) => (item.id === id ? { ...item, status } : item));
  saveLocalInquiries(updatedLocal);

  // 2. Actualizar en Supabase
  try {
    const { data } = await (supabaseAdmin.from("inbox_conversations") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      let meta: any = {};
      try {
        meta = JSON.parse(data.notes || "{}");
      } catch (e) {}

      meta.status = status;
      await (supabaseAdmin.from("inbox_conversations") as any)
        .update({
          unread: status === "pending",
          notes: JSON.stringify(meta)
        })
        .eq("id", id);
    }
  } catch (e) {
    console.error("Error al actualizar estado en Supabase:", e);
  }

  return true;
}

export async function deleteServerInquiry(id: string): Promise<boolean> {
  clearInquiryCache();
  // 1. Eliminar de respaldo local
  const currentLocal = getLocalInquiries();
  const updatedLocal = currentLocal.filter((item) => item.id !== id);
  saveLocalInquiries(updatedLocal);

  // 2. Eliminar de Supabase
  try {
    await (supabaseAdmin.from("inbox_conversations") as any).delete().eq("id", id);
  } catch (e) {
    console.error("Error al eliminar consulta en Supabase:", e);
  }

  return true;
}
