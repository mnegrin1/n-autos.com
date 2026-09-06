"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPersistentAgencySettings, savePersistentAgencySettings } from "@/lib/persistentAgencyStore";

export interface AgendaAppointment {
  id: string;
  agency_id: string;
  title: string;
  event_type: "test_drive" | "visita" | "entrega" | "service" | "reunion" | "llamada";
  event_date: string;
  end_date?: string;
  status: "pendiente" | "confirmada" | "realizada" | "cancelada";
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  vehicle_id?: string;
  vehicle_title?: string;
  notes?: string;
  created_at: string;
}

// In-memory persistent demo store for offline/demo reliability
let inMemoryAppointments: AgendaAppointment[] = [
  {
    id: "apt-1",
    agency_id: "00000000-0000-0000-0000-000000000000",
    title: "Test Drive - Toyota Hilux SRV 4x4",
    event_type: "test_drive",
    event_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    status: "confirmada",
    client_name: "Gonzalo Rodríguez",
    client_phone: "+598 99 443 211",
    client_email: "gonzalo.r@gmail.com",
    vehicle_title: "Toyota Hilux SRV 4x4 (2022)",
    notes: "Traer licencia de conducir vigente. Interesado en financiación bancaria 50%.",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apt-2",
    agency_id: "00000000-0000-0000-0000-000000000000",
    title: "Visita Showroom - Consulta BMW Serie 3",
    event_type: "visita",
    event_date: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
    status: "pendiente",
    client_name: "Valeria Méndez",
    client_phone: "+598 98 120 900",
    client_email: "valeria.m@outlook.com",
    vehicle_title: "BMW 320i M-Sport (2021)",
    notes: "Viene con su pareja a ver el estado general y probar los asientos de cuero.",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apt-3",
    agency_id: "00000000-0000-0000-0000-000000000000",
    title: "Entrega de Unidad 0km - Volkswagen Nivus",
    event_type: "entrega",
    event_date: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 51 * 60 * 60 * 1000).toISOString(),
    status: "confirmada",
    client_name: "Matías Silvera",
    client_phone: "+598 94 888 123",
    client_email: "matias.silvera@hotmail.com",
    vehicle_title: "Volkswagen Nivus Highline 200 TSI (2024)",
    notes: "Lavado completo y laqueado listo. Entregar carpeta con póliza y manuales.",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apt-4",
    agency_id: "00000000-0000-0000-0000-000000000000",
    title: "Revisión / Taller Primer Service - Chevrolet Onix",
    event_type: "service",
    event_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
    status: "pendiente",
    client_name: "Carolina Ferrando",
    client_phone: "+598 91 222 344",
    client_email: "caro.ferrando@gmail.com",
    vehicle_title: "Chevrolet Onix Premier (2023)",
    notes: "Service oficial 10.000 km.",
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  }
];

/**
 * Obtiene la lista de citas y turnos de la agencia
 */
export async function getAgendaAppointments(agencyId?: string | null): Promise<AgendaAppointment[]> {
  const targetAgencyId = agencyId || "00000000-0000-0000-0000-000000000000";
  const client = supabaseAdmin;

  try {
    if (client) {
      const { data, error } = await (client.from("events") as any)
        .select("*")
        .or(`agency_id.eq.${targetAgencyId},agency_id.is.null`)
        .order("event_date", { ascending: true });

      if (!error && data && data.length > 0) {
        const parsedDbEvents: AgendaAppointment[] = data.map((evt: any) => {
          let client_name = "";
          let client_phone = "";
          let client_email = "";
          let vehicle_title = "";
          let notes = evt.description || "";
          let status: AgendaAppointment["status"] = "pendiente";

          // Parse extra metadata packed in description if available
          if (evt.description && evt.description.startsWith("{") && evt.description.endsWith("}")) {
            try {
              const meta = JSON.parse(evt.description);
              client_name = meta.client_name || "";
              client_phone = meta.client_phone || "";
              client_email = meta.client_email || "";
              vehicle_title = meta.vehicle_title || "";
              notes = meta.notes || "";
              status = meta.status || "pendiente";
            } catch {}
          }

          let event_type: AgendaAppointment["event_type"] = "visita";
          const rawType = (evt.event_type || "").toLowerCase();
          if (["test_drive", "visita", "entrega", "service", "reunion", "llamada"].includes(rawType)) {
            event_type = rawType as any;
          } else if (rawType.includes("test")) {
            event_type = "test_drive";
          }

          return {
            id: String(evt.id),
            agency_id: evt.agency_id || targetAgencyId,
            title: evt.title || "Turno agendado",
            event_type,
            event_date: evt.event_date || new Date().toISOString(),
            end_date: evt.end_date || new Date(new Date(evt.event_date || Date.now()).getTime() + 60 * 60 * 1000).toISOString(),
            status,
            client_name,
            client_phone,
            client_email,
            vehicle_id: evt.property_id || evt.vehicle_id || undefined,
            vehicle_title,
            notes,
            created_at: evt.created_at || new Date().toISOString(),
          };
        });

        // Merge with in-memory non-duplicate appointments
        const combined = [...parsedDbEvents];
        for (const local of inMemoryAppointments) {
          if (!combined.some(c => c.id === local.id)) {
            combined.push(local);
          }
        }
        return combined.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      }
    }
  } catch (err) {
    console.warn("Aviso al consultar Supabase events:", err);
  }

  return inMemoryAppointments;
}

/**
 * Crea una nueva cita / turno en la agenda
 */
export async function createAgendaAppointment(data: {
  agency_id?: string;
  title: string;
  event_type: "test_drive" | "visita" | "entrega" | "service" | "reunion" | "llamada";
  event_date: string;
  end_date?: string;
  status?: "pendiente" | "confirmada" | "realizada" | "cancelada";
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  vehicle_id?: string;
  vehicle_title?: string;
  notes?: string;
}) {
  const targetAgencyId = data.agency_id || "00000000-0000-0000-0000-000000000000";
  const newId = `apt-${Date.now()}`;
  const status = data.status || "confirmada";

  const newAppointment: AgendaAppointment = {
    id: newId,
    agency_id: targetAgencyId,
    title: data.title.trim(),
    event_type: data.event_type,
    event_date: data.event_date,
    end_date: data.end_date || new Date(new Date(data.event_date).getTime() + 60 * 60 * 1000).toISOString(),
    status,
    client_name: data.client_name?.trim(),
    client_phone: data.client_phone?.trim(),
    client_email: data.client_email?.trim(),
    vehicle_id: data.vehicle_id,
    vehicle_title: data.vehicle_title,
    notes: data.notes?.trim(),
    created_at: new Date().toISOString(),
  };

  // Add to in-memory store
  inMemoryAppointments = [newAppointment, ...inMemoryAppointments];

  // Also persist in Supabase events table
  const client = supabaseAdmin;
  if (client) {
    try {
      const descriptionPayload = JSON.stringify({
        client_name: newAppointment.client_name,
        client_phone: newAppointment.client_phone,
        client_email: newAppointment.client_email,
        vehicle_title: newAppointment.vehicle_title,
        notes: newAppointment.notes,
        status: newAppointment.status,
      });

      await (client.from("events") as any).insert({
        agency_id: targetAgencyId,
        title: newAppointment.title,
        event_type: newAppointment.event_type === "test_drive" ? "visita" : newAppointment.event_type,
        event_date: newAppointment.event_date,
        description: descriptionPayload,
      });
    } catch (e) {
      console.warn("Aviso insertando en tabla events:", e);
    }
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");

  return { success: true, appointment: newAppointment };
}

/**
 * Actualiza el estado de una cita (confirmada, realizada, cancelada)
 */
export async function updateAgendaAppointmentStatus(
  id: string,
  status: "pendiente" | "confirmada" | "realizada" | "cancelada"
) {
  inMemoryAppointments = inMemoryAppointments.map(a => {
    if (a.id === id) {
      return { ...a, status };
    }
    return a;
  });

  const client = supabaseAdmin;
  if (client) {
    try {
      // Find and update if in DB
      const { data } = await (client.from("events") as any).select("*").eq("id", id).maybeSingle();
      if (data) {
        let meta: any = {};
        try {
          meta = JSON.parse(data.description || "{}");
        } catch {}
        meta.status = status;
        await (client.from("events") as any)
          .update({ description: JSON.stringify(meta) })
          .eq("id", id);
      }
    } catch (e) {
      console.warn("Aviso actualizando estado en events:", e);
    }
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");

  return { success: true };
}

/**
 * Elimina una cita de la agenda
 */
export async function deleteAgendaAppointment(id: string) {
  inMemoryAppointments = inMemoryAppointments.filter(a => a.id !== id);

  const client = supabaseAdmin;
  if (client) {
    try {
      await (client.from("events") as any).delete().eq("id", id);
    } catch (e) {
      console.warn("Aviso eliminando de events:", e);
    }
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");

  return { success: true };
}

/**
 * Obtiene la configuración de Cal.com de la agencia
 */
export async function getCalcomSettings(agencyId?: string | null) {
  const targetKey = agencyId || "00000000-0000-0000-0000-000000000000";
  const agency = getPersistentAgencySettings(targetKey);
  
  return {
    calcom_link: agency.calcom_link || "demo-automotora/test-drive",
    calcom_active: agency.calcom_active !== false,
  };
}

/**
 * Guarda la configuración del enlace Cal.com
 */
export async function saveCalcomSettings(
  agencyId: string,
  updates: { calcom_link: string; calcom_active?: boolean }
) {
  const cleanLink = updates.calcom_link
    .trim()
    .replace(/^https?:\/\/(app\.)?cal\.com\//i, "")
    .replace(/^\/+|\/+$/g, "");

  const saved = savePersistentAgencySettings({
    id: agencyId,
    calcom_link: cleanLink || "demo-automotora/test-drive",
    calcom_active: updates.calcom_active !== false,
  }, agencyId);

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/calendar");

  return { success: true, settings: { calcom_link: saved.calcom_link, calcom_active: saved.calcom_active } };
}
