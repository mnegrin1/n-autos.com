"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getAgencyCalendarDataAsync,
  saveAgencyCalendarConfigAsync,
  saveAgencyGoogleAuthAsync,
  clearAgencyGoogleAuthAsync,
  AgencyCalendarConfig,
  DEFAULT_AGENCY_CALENDAR_CONFIG,
} from "@/lib/agencyCalendarStore";
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
  google_event_id?: string;
  is_google_event?: boolean;
}

// Almacenamiento en memoria para citas de la agencia (sin datos de muestra)
let inMemoryAppointments: AgendaAppointment[] = [];

function safeRevalidate() {
  try {
    revalidatePath("/admin/agenda");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin");
    revalidatePath("/portal/[agency]", "page");
  } catch (e) {}
}

// Helper para obtener fecha y hora actual en zona horaria de Montevideo (GMT-3)
function getMontevideoNow() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Montevideo",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());

    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    return {
      todayStr: `${map.year}-${map.month}-${map.day}`,
      currentHour: Number(map.hour),
      currentMinute: Number(map.minute),
    };
  } catch (e) {
    const d = new Date(Date.now() - 3 * 3600 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return {
      todayStr: `${y}-${m}-${day}`,
      currentHour: d.getUTCHours(),
      currentMinute: d.getUTCMinutes(),
    };
  }
}

// Helper para llamadas con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error(`Timeout ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Obtiene un token válido de Google Calendar para la agencia, refrescándolo si expiró
 */
export async function getValidAgencyGoogleAccessToken(agencyId: string): Promise<string | null> {
  const data = await getAgencyCalendarDataAsync(agencyId);
  const auth = data.googleAuth;
  if (!auth.connected || !auth.refreshToken) return null;

  const now = Date.now();
  if (auth.accessToken && auth.tokenExpiry && auth.tokenExpiry - now > 180000) {
    return auth.accessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("Faltan credenciales GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET para refrescar token de agencia.");
    return null;
  }

  try {
    const res = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: auth.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await res.json();
    if (tokenData.access_token) {
      await saveAgencyGoogleAuthAsync(agencyId, {
        accessToken: tokenData.access_token,
        tokenExpiry: Date.now() + (tokenData.expires_in || 3600) * 1000,
        refreshToken: tokenData.refresh_token || auth.refreshToken,
      });
      return tokenData.access_token;
    } else if (tokenData.error === "invalid_grant") {
      await saveAgencyGoogleAuthAsync(agencyId, {
        connected: false,
        accessToken: undefined,
        tokenExpiry: undefined,
      });
      return null;
    }
  } catch (err) {
    console.error("Error al refrescar token de Google para la agencia:", err);
  }
  return null;
}

/**
 * Obtiene la lista de citas y turnos de la agencia (combinando CRM y eventos de Google Calendar)
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
        const parsedDbEvents: AgendaAppointment[] = data
          .filter((evt: any) => !evt.title?.startsWith("__")) // Ignorar configs especiales
          .map((evt: any) => {
            let client_name = "";
            let client_phone = "";
            let client_email = "";
            let vehicle_title = "";
            let notes = evt.description || "";
            let status: AgendaAppointment["status"] = "pendiente";
            let google_event_id = undefined;
            let is_google_event = false;

            if (evt.description && evt.description.startsWith("{") && evt.description.endsWith("}")) {
              try {
                const meta = JSON.parse(evt.description);
                client_name = meta.client_name || "";
                client_phone = meta.client_phone || "";
                client_email = meta.client_email || "";
                vehicle_title = meta.vehicle_title || "";
                notes = meta.notes || "";
                status = meta.status || "pendiente";
                google_event_id = meta.google_event_id || meta.googleEventId;
                is_google_event = !!meta.is_google_event || !!meta.isGoogleEvent;
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
              google_event_id,
              is_google_event,
              created_at: evt.created_at || new Date().toISOString(),
            };
          });

        const combined = [...parsedDbEvents];
        for (const local of inMemoryAppointments) {
          if (!combined.some(c => c.id === local.id || (local.google_event_id && c.google_event_id === local.google_event_id))) {
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
 * Crea una nueva cita / turno en la agenda y la sincroniza con Google Calendar si está conectado
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
  syncToGoogle?: boolean;
}) {
  const targetAgencyId = data.agency_id || "00000000-0000-0000-0000-000000000000";
  const newId = `apt-${Date.now()}`;
  const status = data.status || "confirmada";
  const endDate = data.end_date || new Date(new Date(data.event_date).getTime() + 45 * 60 * 1000).toISOString();

  let googleEventId: string | undefined = undefined;

  // Si syncToGoogle es true o no se especificó, intentar sincronizar con Google Calendar si la agencia está conectada
  if (data.syncToGoogle !== false) {
    const token = await getValidAgencyGoogleAccessToken(targetAgencyId);
    if (token) {
      try {
        const gcalPayload = {
          summary: data.title.trim(),
          description: [
            `Turno Agendado en CRM Automotora`,
            `Cliente: ${data.client_name || "Sin nombre"}`,
            `Teléfono: ${data.client_phone || "No indicado"}`,
            `Email: ${data.client_email || "No indicado"}`,
            data.vehicle_title ? `Vehículo: ${data.vehicle_title}` : "",
            data.notes ? `Notas: ${data.notes}` : "",
          ].filter(Boolean).join("\n"),
          start: { dateTime: data.event_date, timeZone: "America/Montevideo" },
          end: { dateTime: endDate, timeZone: "America/Montevideo" },
          ...(data.client_email ? { attendees: [{ email: data.client_email, displayName: data.client_name }] } : {}),
        };

        const gRes = await fetchWithTimeout(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(gcalPayload),
          },
          7000
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          googleEventId = gData.id;
        }
      } catch (err) {
        console.warn("Aviso al crear evento en Google Calendar de la agencia:", err);
      }
    }
  }

  const newAppointment: AgendaAppointment = {
    id: newId,
    agency_id: targetAgencyId,
    title: data.title.trim(),
    event_type: data.event_type,
    event_date: data.event_date,
    end_date: endDate,
    status,
    client_name: data.client_name?.trim(),
    client_phone: data.client_phone?.trim(),
    client_email: data.client_email?.trim(),
    vehicle_id: data.vehicle_id,
    vehicle_title: data.vehicle_title,
    notes: data.notes?.trim(),
    google_event_id: googleEventId,
    is_google_event: false,
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
        google_event_id: googleEventId,
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

  safeRevalidate();
  return { success: true, appointment: newAppointment };
}

/**
 * Actualiza el estado de una cita (confirmada, realizada, cancelada)
 */
export async function updateAgendaAppointmentStatus(
  id: string,
  status: "pendiente" | "confirmada" | "realizada" | "cancelada"
) {
  inMemoryAppointments = inMemoryAppointments.map(a => (a.id === id ? { ...a, status } : a));

  const client = supabaseAdmin;
  if (client) {
    try {
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

  safeRevalidate();
  return { success: true };
}

/**
 * Elimina una cita de la agenda
 */
export async function deleteAgendaAppointment(id: string) {
  const target = inMemoryAppointments.find(a => a.id === id);
  inMemoryAppointments = inMemoryAppointments.filter(a => a.id !== id);

  // Si tiene google_event_id y la agencia está conectada, eliminar de Google Calendar
  if (target?.google_event_id && target.agency_id) {
    const token = await getValidAgencyGoogleAccessToken(target.agency_id);
    if (token) {
      try {
        await fetchWithTimeout(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${target.google_event_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
          4000
        );
      } catch (e) {
        console.warn("Aviso eliminando evento de Google Calendar:", e);
      }
    }
  }

  const client = supabaseAdmin;
  if (client) {
    try {
      await (client.from("events") as any).delete().eq("id", id);
    } catch (e) {
      console.warn("Aviso eliminando de events:", e);
    }
  }

  safeRevalidate();
  return { success: true };
}

/**
 * Trae y sincroniza los eventos de Google Calendar de la automotora al CRM
 */
export async function syncAgencyGoogleEventsAction(agencyId: string) {
  const targetAgencyId = agencyId || "00000000-0000-0000-0000-000000000000";
  const token = await getValidAgencyGoogleAccessToken(targetAgencyId);

  if (!token) {
    return {
      success: false,
      error: "Google Calendar no está conectado para esta automotora o el token no es válido.",
      count: 0,
    };
  }

  try {
    // Ventana de 30 días atrás y 60 días adelante
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const gRes = await fetchWithTimeout(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
      8000
    );

    if (!gRes.ok) {
      const errBody = await gRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Error al consultar Google Calendar: ${gRes.status}`,
        details: errBody,
        count: 0,
      };
    }

    const gData = await gRes.json();
    const items = Array.isArray(gData.items) ? gData.items : [];

    // Obtener IDs ya existentes para no duplicar
    const currentApts = await getAgendaAppointments(targetAgencyId);
    const existingGoogleIds = new Set(
      currentApts.filter(a => a.google_event_id).map(a => a.google_event_id)
    );

    let importedCount = 0;
    const client = supabaseAdmin;

    for (const item of items) {
      if (item.status === "cancelled") continue;
      if (item.transparency === "transparent") continue;
      if (existingGoogleIds.has(item.id)) continue;

      const startStr = item.start?.dateTime || item.start?.date;
      const endStr = item.end?.dateTime || item.end?.date;
      if (!startStr) continue;

      const startDate = new Date(startStr);
      const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 45 * 60 * 1000);

      const title = item.summary || "Evento de Google Calendar";
      const newApt: AgendaAppointment = {
        id: `gcal-${item.id}`,
        agency_id: targetAgencyId,
        title,
        event_type: "reunion",
        event_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "confirmada",
        client_name: item.creator?.displayName || item.creator?.email || "Google Calendar",
        client_email: item.creator?.email || "",
        notes: item.description || "Sincronizado desde Google Calendar",
        google_event_id: item.id,
        is_google_event: true,
        created_at: item.created || new Date().toISOString(),
      };

      inMemoryAppointments = [newApt, ...inMemoryAppointments];
      existingGoogleIds.add(item.id);
      importedCount++;

      // Guardar también en tabla events de Supabase
      if (client) {
        try {
          const descPayload = JSON.stringify({
            client_name: newApt.client_name,
            client_email: newApt.client_email,
            notes: newApt.notes,
            status: "confirmada",
            google_event_id: item.id,
            is_google_event: true,
          });

          await (client.from("events") as any).insert({
            agency_id: targetAgencyId,
            title,
            event_type: "reunion",
            event_date: newApt.event_date,
            description: descPayload,
          });
        } catch (e) {
          console.warn("Aviso guardando evento de Google en tabla events:", e);
        }
      }
    }

    safeRevalidate();
    return {
      success: true,
      count: importedCount,
      message: `Se sincronizaron los eventos de Google Calendar (${importedCount} nuevos turnos importados al CRM).`,
    };
  } catch (err: any) {
    console.error("Excepción en syncAgencyGoogleEventsAction:", err);
    return { success: false, error: err?.message || "Error al sincronizar con Google Calendar", count: 0 };
  }
}

/**
 * Obtiene la configuración de horarios y estado de Google Calendar de la automotora
 */
export async function getAgencyCalendarSettings(agencyId?: string | null) {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const data = await getAgencyCalendarDataAsync(targetId);
  return {
    config: data.config,
    googleAuth: {
      connected: !!data.googleAuth.connected,
      email: data.googleAuth.email || null,
    },
  };
}

/**
 * Guarda los horarios disponibles y días que el dueño de la automotora marca en la página de agenda
 */
export async function saveAgencyCalendarSettings(
  agencyId: string,
  updates: Partial<AgencyCalendarConfig>
) {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const saved = await saveAgencyCalendarConfigAsync(targetId, updates);
  safeRevalidate();
  return { success: true, config: saved };
}

/**
 * Desconecta Google Calendar de la automotora
 */
export async function disconnectAgencyGoogle(agencyId: string) {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  await clearAgencyGoogleAuthAsync(targetId);
  safeRevalidate();
  return { success: true };
}

/**
 * Consulta los horarios disponibles para una fecha específica (YYYY-MM-DD)
 * CHEQUEANDO:
 * 1. Los horarios que el usuario marcó disponibles en la página de agenda (días y franjas)
 * 2. Citas existentes en el CRM (test drive, visitas, servicios, entregas)
 * 3. Eventos ocupados en Google Calendar (vía FreeBusy o eventos sincronizados)
 */
export async function getAgencyAvailableSlotsAction(params: {
  agencyId: string;
  dateStr: string; // "YYYY-MM-DD"
}) {
  const { agencyId, dateStr } = params;
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const { config, googleAuth } = await getAgencyCalendarDataAsync(targetId);

  const [year, month, day] = dateStr.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // 1. Validar si el día de la semana está habilitado por el dueño
  if (!config.availableDays.includes(dayOfWeek)) {
    return {
      success: false,
      reason: "La automotora no atiende al público en este día de la semana.",
      slots: [],
      config,
    };
  }

  // 2. Validar ventana de fechas
  const montevideoNow = getMontevideoNow();
  if (dateStr < montevideoNow.todayStr) {
    return {
      success: false,
      reason: "No se pueden seleccionar fechas pasadas.",
      slots: [],
      config,
    };
  }

  const [tY, tM, tD] = montevideoNow.todayStr.split("-").map(Number);
  const todayDateObj = new Date(tY, tM - 1, tD);
  const maxDateObj = new Date(todayDateObj);
  maxDateObj.setDate(maxDateObj.getDate() + (config.displayDaysAhead || 14));

  if (selectedDate > maxDateObj) {
    return {
      success: false,
      reason: `Solo se pueden agendar citas dentro de los próximos ${config.displayDaysAhead || 14} días.`,
      slots: [],
      config,
    };
  }

  const isToday = dateStr === montevideoNow.todayStr;
  const duration = config.slotDurationMinutes || 30;

  // Franjas horarias configuradas por el usuario
  const ranges = config.timeRanges && config.timeRanges.length > 0
    ? config.timeRanges
    : [{ startTime: config.startTime || "09:00", endTime: config.endTime || "19:00" }];

  const candidateSlots: { time: string; startIso: string; endIso: string }[] = [];

  for (const range of ranges) {
    if (!range.startTime || !range.endTime) continue;
    const [startH, startM] = range.startTime.split(":").map(Number);
    const [endH, endM] = range.endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const endMins = m + duration;
      const endHh = String(Math.floor(endMins / 60)).padStart(2, "0");
      const endMm = String(endMins % 60).padStart(2, "0");

      const timeLabel = `${hh}:${mm}`;

      if (candidateSlots.some(s => s.time === timeLabel)) continue;

      // Si es hoy, filtrar horarios que ya pasaron (con 20 min de buffer)
      if (isToday) {
        const currentLocalMinutes = montevideoNow.currentHour * 60 + montevideoNow.currentMinute;
        if (m <= currentLocalMinutes + 20) {
          continue;
        }
      }

      const startIso = `${dateStr}T${hh}:${mm}:00-03:00`;
      const endIso = `${dateStr}T${endHh}:${endMm}:00-03:00`;

      candidateSlots.push({ time: timeLabel, startIso, endIso });
    }
  }

  candidateSlots.sort((a, b) => a.time.localeCompare(b.time));

  if (candidateSlots.length === 0) {
    return {
      success: true,
      reason: isToday ? "No quedan más horarios de atención disponibles por hoy." : "No hay horarios habilitados para esta fecha.",
      slots: [],
      config,
    };
  }

  // 3. Cargar ocupación: Citas CRM y Google Calendar
  const busyRanges: { start: number; end: number; source: string }[] = [];

  // A. Citas existentes en CRM
  const allAppointments = await getAgendaAppointments(targetId);
  const dayStartEpoch = new Date(`${dateStr}T00:00:00-03:00`).getTime();
  const dayEndEpoch = new Date(`${dateStr}T23:59:59-03:00`).getTime();

  for (const apt of allAppointments) {
    if (apt.status === "cancelada") continue;
    const aptStart = new Date(apt.event_date).getTime();
    const aptEnd = new Date(apt.end_date || apt.event_date).getTime();
    if (aptStart < dayEndEpoch && aptEnd > dayStartEpoch) {
      busyRanges.push({ start: aptStart, end: aptEnd, source: `crm_${apt.id}` });
    }
  }

  // B. Google Calendar FreeBusy en tiempo real si está conectado
  if (googleAuth.connected) {
    const token = await getValidAgencyGoogleAccessToken(targetId);
    if (token) {
      try {
        const timeMinIso = new Date(`${dateStr}T00:00:00-03:00`).toISOString();
        const timeMaxIso = new Date(`${dateStr}T23:59:59-03:00`).toISOString();

        const fbRes = await fetchWithTimeout("https://www.googleapis.com/calendar/v3/freeBusy", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin: timeMinIso,
            timeMax: timeMaxIso,
            timeZone: "America/Montevideo",
            items: [{ id: "primary" }],
          }),
        }, 5000);

        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const busyList = fbData.calendars?.primary?.busy || [];
          for (const b of busyList) {
            busyRanges.push({
              start: new Date(b.start).getTime(),
              end: new Date(b.end).getTime(),
              source: "google_freebusy",
            });
          }
        }
      } catch (fbErr) {
        console.warn("Aviso consultando Google FreeBusy de agencia:", fbErr);
      }
    }
  }

  // 4. Filtrar slots candidatos que colisionen con los rangos ocupados
  const freeSlots = candidateSlots.filter(slot => {
    const slotStart = new Date(slot.startIso).getTime();
    const slotEnd = new Date(slot.endIso).getTime();

    const isOverlap = busyRanges.some(busy => {
      // Hay solapamiento si el slot inicia antes del fin ocupado Y termina después del inicio ocupado
      return slotStart < busy.end && slotEnd > busy.start;
    });

    return !isOverlap;
  });

  return {
    success: true,
    slots: freeSlots,
    config,
  };
}

/**
 * Agendar cita desde el formulario simple de la página web del cliente
 */
export async function bookAgencyAppointmentAction(data: {
  agencyId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  eventType?: "test_drive" | "visita" | "entrega" | "service" | "reunion";
  vehicleId?: string;
  vehicleTitle?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  notes?: string;
}) {
  const { agencyId, clientName, clientPhone, clientEmail, date, time } = data;

  if (!clientName?.trim() || !clientPhone?.trim() || !date || !time) {
    return {
      success: false,
      error: "Por favor completa tu nombre, teléfono, fecha y horario para confirmar tu turno.",
    };
  }

  const targetAgencyId = agencyId || "00000000-0000-0000-0000-000000000000";
  const { config } = await getAgencyCalendarDataAsync(targetAgencyId);
  const duration = config.slotDurationMinutes || 30;

  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");

  const startIso = `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00-03:00`;
  const endMinutes = hh * 60 + mm + duration;
  const endHh = Math.floor(endMinutes / 60);
  const endMm = endMinutes % 60;
  const endIso = `${y}-${pad(m)}-${pad(d)}T${pad(endHh)}:${pad(endMm)}:00-03:00`;

  const eventType = data.eventType || "test_drive";
  const typeLabelMap: Record<string, string> = {
    test_drive: "Test Drive",
    visita: "Visita al Showroom",
    entrega: "Entrega de Unidad",
    service: "Service / Taller",
    reunion: "Reunión",
  };
  const typeLabel = typeLabelMap[eventType] || "Cita";

  const title = `${typeLabel} - ${clientName.trim()}${data.vehicleTitle ? ` (${data.vehicleTitle})` : ""}`;

  const res = await createAgendaAppointment({
    agency_id: targetAgencyId,
    title,
    event_type: eventType,
    event_date: startIso,
    end_date: endIso,
    status: "confirmada",
    client_name: clientName.trim(),
    client_phone: clientPhone.trim(),
    client_email: clientEmail?.trim() || "",
    vehicle_id: data.vehicleId,
    vehicle_title: data.vehicleTitle,
    notes: data.notes?.trim(),
    syncToGoogle: true,
  });

  return res;
}

// Métodos de compatibilidad histórica
export async function getCalcomSettings(agencyId?: string | null) {
  const targetKey = agencyId || "00000000-0000-0000-0000-000000000000";
  const agency = getPersistentAgencySettings(targetKey);
  return {
    calcom_link: agency.calcom_link || "demo-automotora/test-drive",
    calcom_active: agency.calcom_active !== false,
  };
}

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

  safeRevalidate();
  return { success: true, settings: { calcom_link: saved.calcom_link, calcom_active: saved.calcom_active } };
}
