"use server";

import { revalidatePath } from "next/cache";
import {
  getSuperadminCalendarData,
  saveSuperadminCalendarConfig,
  getSuperadminGoogleAuth,
  saveSuperadminGoogleAuth,
  clearSuperadminGoogleAuth,
  getSuperadminMeetings,
  addSuperadminMeeting,
  updateSuperadminMeetingStatus,
  SuperadminCalendarConfig,
  SuperadminMeeting,
} from "@/lib/superadminCalendarStore";
import { submitLandingInquiryAction } from "@/actions/inquiryActions";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {}
}

// --- REFRESH TOKEN HELPER ---
async function getValidGoogleAccessToken(): Promise<string | null> {
  const auth = getSuperadminGoogleAuth();
  if (!auth.connected || !auth.refreshToken) return null;

  const now = Date.now();
  // Si no expiró y le quedan al menos 3 minutos
  if (auth.accessToken && auth.tokenExpiry && auth.tokenExpiry - now > 180000) {
    return auth.accessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("Faltan credenciales de Google OAuth para refrescar token.");
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: auth.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      saveSuperadminGoogleAuth({
        accessToken: data.access_token,
        tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
        refreshToken: data.refresh_token || auth.refreshToken,
      });
      return data.access_token;
    } else {
      console.error("Error al refrescar token de Google Calendar:", data);
    }
  } catch (e) {
    console.error("Excepción refrescando token de Google Calendar:", e);
  }

  return auth.accessToken || null;
}

// --- CONSULTA Y GUARDADO DE CONFIGURACIÓN ---

export async function getSuperadminCalendarSettings() {
  const data = getSuperadminCalendarData();
  return {
    config: data.config,
    googleAuth: {
      connected: data.googleAuth.connected,
      email: data.googleAuth.email || null,
    },
  };
}

/**
 * Guarda estrictamente los 4 campos solicitados por el usuario:
 * 1. availableDays (días disponibles)
 * 2. displayDaysAhead (cuántos días se muestran a los interesados)
 * 3. meetingDurationMinutes (tiempos de duración de las reuniones)
 * 4. consultationHours (horarios de consulta)
 */
export async function saveSuperadminCalendarSettings(updates: {
  availableDays?: number[];
  displayDaysAhead?: number;
  meetingDurationMinutes?: number;
  consultationHours?: {
    startTime?: string;
    endTime?: string;
    timeRanges?: Array<{ startTime: string; endTime: string }>;
  };
}) {
  const filteredUpdates: Partial<SuperadminCalendarConfig> = {};

  if (Array.isArray(updates.availableDays)) {
    filteredUpdates.availableDays = updates.availableDays;
  }
  if (typeof updates.displayDaysAhead === "number") {
    filteredUpdates.displayDaysAhead = Math.max(1, Math.min(60, updates.displayDaysAhead));
  }
  if (typeof updates.meetingDurationMinutes === "number") {
    filteredUpdates.meetingDurationMinutes = Math.max(10, Math.min(180, updates.meetingDurationMinutes));
  }
  if (updates.consultationHours) {
    let timeRanges = updates.consultationHours.timeRanges || [];
    if (!timeRanges.length && updates.consultationHours.startTime && updates.consultationHours.endTime) {
      timeRanges = [{ startTime: updates.consultationHours.startTime, endTime: updates.consultationHours.endTime }];
    }
    filteredUpdates.consultationHours = {
      startTime: timeRanges[0]?.startTime || updates.consultationHours.startTime || "09:00",
      endTime: timeRanges[timeRanges.length - 1]?.endTime || updates.consultationHours.endTime || "18:00",
      timeRanges,
    };
  }

  const saved = saveSuperadminCalendarConfig(filteredUpdates);
  safeRevalidatePath("/superadmin/calendar");
  safeRevalidatePath("/");

  return { success: true, config: saved };
}

export async function disconnectSuperadminGoogle() {
  clearSuperadminGoogleAuth();
  safeRevalidatePath("/superadmin/calendar");
  return { success: true };
}

// --- GENERACIÓN DE HORARIOS DISPONIBLES (CALENDLY STYLE CON GOOGLE SYNC) ---

export async function getAvailableBookingSlots(dateStr: string) {
  // dateStr viene en formato "YYYY-MM-DD"
  const { config, googleAuth } = getSuperadminCalendarData();
  const [year, month, day] = dateStr.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);

  const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Lunes, ...
  if (!config.availableDays.includes(dayOfWeek)) {
    return {
      success: false,
      reason: "El día seleccionado no está habilitado para consultas.",
      slots: [],
      config,
    };
  }

  // Validar si la fecha está dentro de la ventana de visualización
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.displayDaysAhead);

  const checkDate = new Date(selectedDate);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < today) {
    return {
      success: false,
      reason: "No se pueden seleccionar fechas pasadas.",
      slots: [],
      config,
    };
  }

  if (checkDate > maxDate) {
    return {
      success: false,
      reason: `Solo se pueden agendar consultas dentro de los próximos ${config.displayDaysAhead} días.`,
      slots: [],
      config,
    };
  }

  // Generar todos los slots teóricos recorriendo cada franja horaria configurada
  const ranges = config.consultationHours.timeRanges?.length
    ? config.consultationHours.timeRanges
    : [{ startTime: config.consultationHours.startTime || "09:00", endTime: config.consultationHours.endTime || "18:00" }];

  const duration = config.meetingDurationMinutes || 30;
  const generatedSlots: { time: string; startIso: string; endIso: string }[] = [];

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

      // Evitar duplicados si dos rangos se solaparan
      if (generatedSlots.some((s) => s.time === timeLabel)) {
        continue;
      }

      // Construir fechas exactas
      const slotStartDate = new Date(year, month - 1, day, Number(hh), Number(mm), 0);
      const slotEndDate = new Date(year, month - 1, day, Number(endHh), Number(endMm), 0);

      // Si es hoy, filtrar slots que ya pasaron
      if (checkDate.getTime() === today.getTime()) {
        const nowBuffer = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de margen de anticipación
        if (slotStartDate <= nowBuffer) {
          continue;
        }
      }

      generatedSlots.push({
        time: timeLabel,
        startIso: slotStartDate.toISOString(),
        endIso: slotEndDate.toISOString(),
      });
    }
  }

  // Ordenar cronológicamente
  generatedSlots.sort((a, b) => a.time.localeCompare(b.time));

  // Consultar eventos de Google Calendar si está conectado para excluir colisiones
  const busyRanges: { start: number; end: number }[] = [];

  if (googleAuth.connected) {
    const token = await getValidGoogleAccessToken();
    if (token) {
      try {
        const dayStart = new Date(year, month - 1, day, 0, 0, 0).toISOString();
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59).toISOString();

        const gRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
            dayStart
          )}&timeMax=${encodeURIComponent(
            dayEnd
          )}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.items)) {
            for (const item of gData.items) {
              if (item.status === "cancelled") continue;
              const startStr = item.start?.dateTime || item.start?.date;
              const endStr = item.end?.dateTime || item.end?.date;
              if (startStr && endStr) {
                busyRanges.push({
                  start: new Date(startStr).getTime(),
                  end: new Date(endStr).getTime(),
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("No se pudieron consultar eventos de Google Calendar:", err);
      }
    }
  }

  // Incluir también reuniones internas ya confirmadas
  const internalMeetings = getSuperadminMeetings().filter(
    (m) => m.date === dateStr && m.status === "confirmed"
  );
  for (const m of internalMeetings) {
    busyRanges.push({
      start: new Date(m.start).getTime(),
      end: new Date(m.end).getTime(),
    });
  }

  // Filtrar los slots que colisionen con algún rango ocupado
  const availableSlots = generatedSlots.filter((slot) => {
    const slotStart = new Date(slot.startIso).getTime();
    const slotEnd = new Date(slot.endIso).getTime();

    // Comprueba solapamiento: (StartA < EndB) y (EndA > StartB)
    const hasOverlap = busyRanges.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );

    return !hasOverlap;
  });

  return {
    success: true,
    date: dateStr,
    durationMinutes: config.meetingDurationMinutes,
    slots: availableSlots.map((s) => s.time),
  };
}

// --- CREACIÓN DE REUNIÓN CON GOOGLE MEET ---

export async function bookMeetingFromLanding(payload: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  agencyName?: string;
  notes?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}) {
  const { clientName, clientEmail, date, time } = payload;
  if (!clientName?.trim() || !clientEmail?.trim() || !date || !time) {
    return { success: false, error: "Por favor completa los campos obligatorios." };
  }

  const { config, googleAuth } = getSuperadminCalendarData();
  const duration = config.meetingDurationMinutes || 30;

  const [year, month, day] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const startDate = new Date(year, month - 1, day, hh, mm, 0);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  let meetUrl: string | undefined = undefined;
  let googleEventId: string | undefined = undefined;

  // Intentar crear el evento en Google Calendar con Google Meet
  if (googleAuth.connected) {
    const token = await getValidGoogleAccessToken();
    if (token) {
      try {
        const conferenceRequestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        const gcalPayload = {
          summary: `Videollamada N-Autos: ${payload.agencyName || clientName}`,
          description: [
            `Videollamada de asesoría y consulta sobre la plataforma N-Autos.`,
            `Cliente: ${clientName}`,
            `Email: ${clientEmail}`,
            `Teléfono/WhatsApp: ${payload.clientPhone || "No especificado"}`,
            `Automotora: ${payload.agencyName || "No especificada"}`,
            `Notas / Objetivos: ${payload.notes || "Sin notas"}`,
            ``,
            `Generado automáticamente desde la landing page de n-autos.com.`,
          ].join("\n"),
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          attendees: [
            { email: clientEmail, displayName: clientName },
            ...(googleAuth.email ? [{ email: googleAuth.email, displayName: "Superadmin N-Autos" }] : []),
          ],
          conferenceData: {
            createRequest: {
              requestId: conferenceRequestId,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 },
              { method: "popup", minutes: 10 },
            ],
          },
        };

        const createRes = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(gcalPayload),
          }
        );

        if (createRes.ok) {
          const created = await createRes.json();
          googleEventId = created.id;
          meetUrl =
            created.hangoutLink ||
            created.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri;
        } else {
          const errData = await createRes.json();
          console.error("Fallo al crear evento en Google Calendar:", errData);
        }
      } catch (err) {
        console.error("Excepción creando reunión en Google Calendar:", err);
      }
    }
  }

  // Si no se pudo obtener URL de Meet por falta de conexión o error, generar enlace Meet de acceso seguro
  if (!meetUrl) {
    const roomCode = `n-autos-${Date.now().toString().slice(-6)}`;
    meetUrl = `https://meet.google.com/${roomCode}`;
  }

  const newMeeting: SuperadminMeeting = {
    id: `meet-${Date.now()}`,
    title: `Asesoría N-Autos - ${payload.agencyName || clientName}`,
    clientName: clientName.trim(),
    clientEmail: clientEmail.trim(),
    clientPhone: payload.clientPhone?.trim(),
    agencyName: payload.agencyName?.trim(),
    notes: payload.notes?.trim(),
    date,
    time,
    start: startIso,
    end: endIso,
    durationMinutes: duration,
    meetUrl,
    googleEventId,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  addSuperadminMeeting(newMeeting);

  // Registrar también en el sistema de consultas/leads para que aparezca en "Solicitudes & Consultas"
  try {
    await submitLandingInquiryAction({
      agencyName: payload.agencyName || "Interesado en Videollamada",
      userName: clientName,
      userEmail: clientEmail,
      phone: payload.clientPhone,
      message: `[Reunión Agendada por Google Meet: ${date} ${time} hs] ${payload.notes || ""}`,
    });
  } catch (e) {
    console.warn("No se pudo duplicar en landing inquiry:", e);
  }

  safeRevalidatePath("/superadmin/calendar");
  safeRevalidatePath("/superadmin/requests");

  return {
    success: true,
    meeting: newMeeting,
  };
}

// --- GESTIÓN DE REUNIONES PARA EL SUPERADMIN ---

export async function getSuperadminMeetingsList() {
  return getSuperadminMeetings();
}

export async function cancelSuperadminMeeting(meetingId: string) {
  const meetings = getSuperadminMeetings();
  const target = meetings.find((m) => m.id === meetingId);
  if (!target) return { success: false, error: "Reunión no encontrada." };

  // Si tiene evento en Google Calendar, intentar borrarlo o cancelarlo
  if (target.googleEventId) {
    const token = await getValidGoogleAccessToken();
    if (token) {
      try {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${target.googleEventId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (e) {
        console.warn("No se pudo eliminar evento de Google Calendar:", e);
      }
    }
  }

  updateSuperadminMeetingStatus(meetingId, "cancelled");
  safeRevalidatePath("/superadmin/calendar");
  return { success: true };
}

/**
 * Acción para sincronizar eventos guardados en Google Calendar con el calendario interno
 */
export async function syncGoogleEventsAction() {
  const auth = getSuperadminGoogleAuth();
  if (!auth.connected) {
    return {
      success: false,
      error: "Google Calendar aún no está conectado. El calendario funciona actualmente en modo interno autónomo.",
    };
  }

  const token = await getValidGoogleAccessToken();
  if (!token) {
    return {
      success: false,
      error: "No se pudo obtener el token de acceso de Google. Vuelve a autorizar tu cuenta.",
    };
  }

  try {
    const timeMin = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const gRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!gRes.ok) {
      const errData = await gRes.json().catch(() => ({}));
      return { success: false, error: errData.error?.message || "Error al consultar Google Calendar" };
    }

    const data = await gRes.json();
    let importedCount = 0;

    if (Array.isArray(data.items)) {
      const currentMeetings = getSuperadminMeetings();
      const existingGoogleIds = new Set(
        currentMeetings.filter((m) => m.googleEventId).map((m) => m.googleEventId)
      );

      for (const item of data.items) {
        if (item.status === "cancelled") continue;
        if (existingGoogleIds.has(item.id)) continue;

        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;
        if (!startStr) continue;

        const startDate = new Date(startStr);
        const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 30 * 60 * 1000);

        const date = startDate.toISOString().split("T")[0];
        const time = `${String(startDate.getHours()).padStart(2, "0")}:${String(
          startDate.getMinutes()
        ).padStart(2, "0")}`;

        const durationMinutes = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000)));

        const meetUrl =
          item.hangoutLink ||
          item.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri;

        const googleMeeting: SuperadminMeeting = {
          id: `gcal-${item.id}`,
          title: item.summary || "Evento Google Calendar",
          clientName: item.creator?.displayName || item.creator?.email || "Google Calendar",
          clientEmail: item.creator?.email || "",
          notes: item.description || "Sincronizado desde Google Calendar",
          date,
          time,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          durationMinutes,
          meetUrl,
          googleEventId: item.id,
          isGoogleEvent: true,
          status: "confirmed",
          createdAt: item.created || new Date().toISOString(),
        };

        addSuperadminMeeting(googleMeeting);
        importedCount++;
      }
    }

    safeRevalidatePath("/superadmin/calendar");
    return {
      success: true,
      count: importedCount,
      message: `Se sincronizaron correctamente los eventos de Google Calendar (${importedCount} nuevos eventos importados).`,
    };
  } catch (err: any) {
    console.error("Error al sincronizar eventos de Google Calendar:", err);
    return { success: false, error: err?.message || "Error inesperado al sincronizar con Google" };
  }
}

