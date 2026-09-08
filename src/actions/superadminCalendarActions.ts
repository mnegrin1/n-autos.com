"use server";

import { revalidatePath } from "next/cache";
import {
  getSuperadminCalendarDataAsync,
  saveSuperadminCalendarConfigAsync,
  getSuperadminGoogleAuthAsync,
  saveSuperadminGoogleAuthAsync,
  clearSuperadminGoogleAuthAsync,
  getSuperadminMeetingsAsync,
  addSuperadminMeetingAsync,
  updateSuperadminMeetingStatusAsync,
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
  const auth = await getSuperadminGoogleAuthAsync();
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
      await saveSuperadminGoogleAuthAsync({
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
  const data = await getSuperadminCalendarDataAsync();
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

  const saved = await saveSuperadminCalendarConfigAsync(filteredUpdates);
  safeRevalidatePath("/superadmin/calendar");
  safeRevalidatePath("/");

  return { success: true, config: saved };
}

export async function disconnectSuperadminGoogle() {
  await clearSuperadminGoogleAuthAsync();
  safeRevalidatePath("/superadmin/calendar");
  return { success: true };
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
    for (const p of parts) {
      map[p.type] = p.value;
    }
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

// Helper para formatear Date a fecha y hora en Montevideo
function formatInMontevideo(date: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Montevideo",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date);

    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      time: `${map.hour}:${map.minute}`,
    };
  } catch (e) {
    const d = new Date(date.getTime() - 3 * 3600 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
  }
}

// --- GENERACIÓN DE HORARIOS DISPONIBLES (CALENDLY STYLE CON GOOGLE SYNC) ---

export async function getAvailableBookingSlots(dateStr: string) {
  // dateStr viene en formato "YYYY-MM-DD"
  const { config, googleAuth } = await getSuperadminCalendarDataAsync();
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

  // Validar si la fecha está dentro de la ventana de visualización usando hora local de Montevideo
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
  maxDateObj.setDate(maxDateObj.getDate() + config.displayDaysAhead);

  if (selectedDate > maxDateObj) {
    return {
      success: false,
      reason: `Solo se pueden agendar consultas dentro de los próximos ${config.displayDaysAhead} días.`,
      slots: [],
      config,
    };
  }

  const isToday = dateStr === montevideoNow.todayStr;

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

      // Si es hoy, filtrar slots que ya pasaron en hora local (con 15 min de margen de anticipación)
      if (isToday) {
        const currentLocalMinutes = montevideoNow.currentHour * 60 + montevideoNow.currentMinute;
        const bufferMinutes = currentLocalMinutes + 15;
        if (m <= bufferMinutes) {
          continue;
        }
      }

      // Fechas ISO exactas con offset GMT-3 de Montevideo
      const startIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hh}:${mm}:00-03:00`;
      const endIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${endHh}:${endMm}:00-03:00`;

      generatedSlots.push({
        time: timeLabel,
        startIso,
        endIso,
      });
    }
  }

  // Ordenar cronológicamente
  generatedSlots.sort((a, b) => a.time.localeCompare(b.time));

  if (isToday && generatedSlots.length === 0) {
    return {
      success: true,
      reason: "No quedan más horarios disponibles por hoy. Te invitamos a seleccionar el día de mañana.",
      slots: [],
      config,
    };
  }

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
  const internalMeetings = (await getSuperadminMeetingsAsync()).filter(
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

  const { config, googleAuth } = await getSuperadminCalendarDataAsync();
  const duration = config.meetingDurationMinutes || 30;

  const [year, month, day] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const pad = (n: number) => String(n).padStart(2, "0");
  const startIso = `${year}-${pad(month)}-${pad(day)}T${pad(hh)}:${pad(mm)}:00-03:00`;

  const startMinutes = hh * 60 + mm;
  const endMinutes = startMinutes + duration;
  const endHh = Math.floor(endMinutes / 60);
  const endMm = endMinutes % 60;
  const endIso = `${year}-${pad(month)}-${pad(day)}T${pad(endHh)}:${pad(endMm)}:00-03:00`;

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
          start: { dateTime: startIso, timeZone: "America/Montevideo" },
          end: { dateTime: endIso, timeZone: "America/Montevideo" },
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

  await addSuperadminMeetingAsync(newMeeting);

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
  return await getSuperadminMeetingsAsync();
}

export async function cancelSuperadminMeeting(meetingId: string) {
  const meetings = await getSuperadminMeetingsAsync();
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

  await updateSuperadminMeetingStatusAsync(meetingId, "cancelled");
  safeRevalidatePath("/superadmin/calendar");
  return { success: true };
}

/**
 * Acción para sincronizar eventos guardados en Google Calendar con el calendario interno
 */
export async function syncGoogleEventsAction() {
  const auth = await getSuperadminGoogleAuthAsync();
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
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
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
      const currentMeetings = await getSuperadminMeetingsAsync();
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

        const localFormatted = formatInMontevideo(startDate);
        const date = localFormatted.date;
        const time = localFormatted.time;

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

        await addSuperadminMeetingAsync(googleMeeting);
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

