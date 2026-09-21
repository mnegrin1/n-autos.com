import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface TimeRange {
  startTime: string; // ej: "09:00"
  endTime: string;   // ej: "14:00"
}

export interface ConsultationHours {
  startTime?: string; // Retrocompatibilidad: ej "09:00"
  endTime?: string;   // Retrocompatibilidad: ej "18:00"
  timeRanges: TimeRange[]; // Lista de franjas horarias (ej: [{ startTime: "09:00", endTime: "14:00" }, { startTime: "17:00", endTime: "19:00" }])
}

export interface SuperadminCalendarConfig {
  availableDays: number[]; // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  displayDaysAhead: number; // Ventana de días futuros a mostrar a interesados (ej: 14)
  meetingDurationMinutes: number; // Duración de reuniones (ej: 30)
  consultationHours: ConsultationHours; // Horarios de consulta (franjas horarias)
  fallbackMeetUrl?: string; // Enlace permanente de Google Meet de respaldo (ej: https://meet.google.com/xxx-yyyy-zzz)
}

export interface SuperadminGoogleAuth {
  connected: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface SuperadminMeeting {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  agencyName?: string;
  notes?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  start: string; // ISO 8601
  end: string;   // ISO 8601
  durationMinutes: number;
  meetUrl?: string;
  googleEventId?: string;
  isGoogleEvent?: boolean;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface SuperadminCalendarData {
  config: SuperadminCalendarConfig;
  googleAuth: SuperadminGoogleAuth;
  meetings: SuperadminMeeting[];
}

export const DEFAULT_CONFIG: SuperadminCalendarConfig = {
  availableDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  displayDaysAhead: 14,            // 14 días disponibles hacia adelante
  meetingDurationMinutes: 30,     // 30 minutos por reunión
  consultationHours: {
    startTime: "09:00",
    endTime: "18:00",
    timeRanges: [
      { startTime: "09:00", endTime: "18:00" },
    ],
  },
  fallbackMeetUrl: "",
};

const DEFAULT_DATA: SuperadminCalendarData = {
  config: DEFAULT_CONFIG,
  googleAuth: {
    connected: false,
  },
  meetings: [],
};

let memoryCache: SuperadminCalendarData | null = null;

function getDefaultCalendarData(): SuperadminCalendarData {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

/**
 * Carga e hidrata el estado completo del calendario desde Supabase:
 * 1. Google Auth desde auto_integrations (channel = 'google_calendar_superadmin')
 * 2. Configuración desde events (title = '__superadmin_calendar_config__')
 * 3. Reuniones desde events (event_type = 'reunion' y title != '__superadmin_calendar_config__')
 */
export async function getSuperadminCalendarDataAsync(): Promise<SuperadminCalendarData> {
  const base: SuperadminCalendarData = memoryCache
    ? {
        config: { ...memoryCache.config },
        googleAuth: { ...memoryCache.googleAuth },
        meetings: [...memoryCache.meetings],
      }
    : getDefaultCalendarData();

  if (!supabaseAdmin) {
    memoryCache = base;
    return base;
  }

  try {
    // 1. Cargar Google Auth desde Supabase auto_integrations
    const { data: authRow } = await (supabaseAdmin.from("auto_integrations") as any)
      .select("*")
      .eq("channel", "google_calendar_superadmin")
      .maybeSingle();

    if (authRow) {
      base.googleAuth = {
        connected: !!authRow.connected,
        email: authRow.username || base.googleAuth.email,
        accessToken: authRow.token || base.googleAuth.accessToken,
        refreshToken: authRow.refresh_token || base.googleAuth.refreshToken,
        tokenExpiry: authRow.expires_at ? Number(authRow.expires_at) : base.googleAuth.tokenExpiry,
      };
    }

    // 2. Cargar Configuración desde Supabase events
    const { data: configRow } = await (supabaseAdmin.from("events") as any)
      .select("description")
      .eq("title", "__superadmin_calendar_config__")
      .maybeSingle();

    if (configRow?.description) {
      try {
        const parsedConfig = JSON.parse(configRow.description);
        let timeRanges: TimeRange[] = [];
        if (Array.isArray(parsedConfig?.consultationHours?.timeRanges) && parsedConfig.consultationHours.timeRanges.length > 0) {
          timeRanges = parsedConfig.consultationHours.timeRanges;
        } else {
          const s = parsedConfig?.consultationHours?.startTime || "09:00";
          const e = parsedConfig?.consultationHours?.endTime || "18:00";
          timeRanges = [{ startTime: s, endTime: e }];
        }

        base.config = {
          ...DEFAULT_CONFIG,
          ...parsedConfig,
          consultationHours: {
            startTime: timeRanges[0]?.startTime || "09:00",
            endTime: timeRanges[timeRanges.length - 1]?.endTime || "18:00",
            timeRanges,
          },
        };
      } catch (e) {}
    }

    // 3. Cargar Reuniones desde Supabase events (limitado defensivamente a 200)
    const { data: meetingRows } = await (supabaseAdmin.from("events") as any)
      .select("*")
      .eq("event_type", "reunion")
      .neq("title", "__superadmin_calendar_config__")
      .order("event_date", { ascending: false })
      .limit(200);

    if (Array.isArray(meetingRows) && meetingRows.length > 0) {
      const dbMeetings: SuperadminMeeting[] = [];
      for (const row of meetingRows) {
        if (!row.description) continue;
        try {
          const meta = JSON.parse(row.description);
          dbMeetings.push({
            id: meta.id || row.id,
            title: row.title || meta.title || "Reunión",
            clientName: meta.clientName || meta.client_name || "Interesado",
            clientEmail: meta.clientEmail || meta.client_email || "",
            clientPhone: meta.clientPhone || meta.client_phone || undefined,
            agencyName: meta.agencyName || meta.agency_name || undefined,
            notes: meta.notes || undefined,
            date: meta.date || (row.event_date ? row.event_date.split("T")[0] : ""),
            time: meta.time || "09:00",
            start: row.event_date || meta.start,
            end: meta.end || row.event_date,
            durationMinutes: meta.durationMinutes || meta.duration_minutes || 30,
            meetUrl: meta.meetUrl || meta.meet_url || undefined,
            googleEventId: meta.googleEventId || meta.google_event_id || undefined,
            isGoogleEvent: !!meta.isGoogleEvent || !!meta.is_google_event,
            status: meta.status || "confirmed",
            createdAt: row.created_at || meta.createdAt || new Date().toISOString(),
          });
        } catch (e) {}
      }

      const existingIds = new Set(dbMeetings.map((m) => m.id));
      for (const lm of base.meetings) {
        if (!existingIds.has(lm.id)) {
          dbMeetings.push(lm);
        }
      }
      base.meetings = dbMeetings;
    }

    memoryCache = base;
  } catch (err) {
    console.warn("Aviso al sincronizar superadmin calendar con Supabase:", err);
  }

  return base;
}

export function getSuperadminCalendarData(): SuperadminCalendarData {
  if (!memoryCache) {
    memoryCache = getDefaultCalendarData();
  }
  return memoryCache;
}

export async function saveSuperadminCalendarConfigAsync(
  updates: Partial<SuperadminCalendarConfig>
): Promise<SuperadminCalendarConfig> {
  const current = await getSuperadminCalendarDataAsync();

  let timeRanges: TimeRange[] = current.config.consultationHours.timeRanges || [
    { startTime: "09:00", endTime: "18:00" },
  ];

  if (Array.isArray(updates.consultationHours?.timeRanges) && updates.consultationHours.timeRanges.length > 0) {
    timeRanges = updates.consultationHours.timeRanges.filter(
      (r) => r && typeof r.startTime === "string" && typeof r.endTime === "string"
    );
  } else if (updates.consultationHours?.startTime && updates.consultationHours?.endTime) {
    timeRanges = [{ startTime: updates.consultationHours.startTime, endTime: updates.consultationHours.endTime }];
  }

  const newConfig: SuperadminCalendarConfig = {
    availableDays: Array.isArray(updates.availableDays)
      ? updates.availableDays.filter((d) => typeof d === "number" && d >= 0 && d <= 6)
      : current.config.availableDays,
    displayDaysAhead: typeof updates.displayDaysAhead === "number" && updates.displayDaysAhead > 0
      ? updates.displayDaysAhead
      : current.config.displayDaysAhead,
    meetingDurationMinutes: typeof updates.meetingDurationMinutes === "number" && updates.meetingDurationMinutes > 0
      ? updates.meetingDurationMinutes
      : current.config.meetingDurationMinutes,
    consultationHours: {
      startTime: timeRanges[0]?.startTime || "09:00",
      endTime: timeRanges[timeRanges.length - 1]?.endTime || "18:00",
      timeRanges,
    },
    fallbackMeetUrl:
      typeof updates.fallbackMeetUrl === "string"
        ? updates.fallbackMeetUrl.trim()
        : current.config.fallbackMeetUrl || "",
  };

  current.config = newConfig;
  memoryCache = current;

  // Persistir en Supabase events
  try {
    if (supabaseAdmin) {
      const { data: existing } = await (supabaseAdmin.from("events") as any)
        .select("id")
        .eq("title", "__superadmin_calendar_config__")
        .maybeSingle();

      if (existing?.id) {
        await (supabaseAdmin.from("events") as any)
          .update({
            description: JSON.stringify(newConfig),
            event_date: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await (supabaseAdmin.from("events") as any).insert({
          title: "__superadmin_calendar_config__",
          event_type: "reunion",
          event_date: new Date().toISOString(),
          description: JSON.stringify(newConfig),
        });
      }
    }
  } catch (err) {
    console.warn("Aviso guardando config en Supabase:", err);
  }

  return current.config;
}

export function saveSuperadminCalendarConfig(
  updates: Partial<SuperadminCalendarConfig>
): SuperadminCalendarConfig {
  saveSuperadminCalendarConfigAsync(updates).catch(() => {});
  const current = getSuperadminCalendarData();
  return current.config;
}

export async function getSuperadminGoogleAuthAsync(): Promise<SuperadminGoogleAuth> {
  const current = await getSuperadminCalendarDataAsync();
  return current.googleAuth;
}

export function getSuperadminGoogleAuth(): SuperadminGoogleAuth {
  const current = getSuperadminCalendarData();
  return current.googleAuth;
}

export async function saveSuperadminGoogleAuthAsync(
  auth: Partial<SuperadminGoogleAuth>
): Promise<SuperadminGoogleAuth> {
  const current = await getSuperadminCalendarDataAsync();
  current.googleAuth = {
    ...current.googleAuth,
    ...auth,
    refreshToken: auth.refreshToken !== undefined ? auth.refreshToken : current.googleAuth.refreshToken,
  };
  memoryCache = current;

  // Persistir inmediatamente en Supabase auto_integrations
  try {
    if (supabaseAdmin) {
      const payload: Record<string, any> = {
        channel: "google_calendar_superadmin",
        connected: current.googleAuth.connected,
        username: current.googleAuth.email || null,
        token: current.googleAuth.accessToken || null,
        refresh_token: current.googleAuth.refreshToken || null,
        expires_at: current.googleAuth.tokenExpiry || null,
        updated_at: new Date().toISOString(),
      };

      await (supabaseAdmin.from("auto_integrations") as any)
        .upsert([payload], { onConflict: "channel" });
    }
  } catch (err) {
    console.error("Error guardando googleAuth en auto_integrations Supabase:", err);
  }

  return current.googleAuth;
}

export function saveSuperadminGoogleAuth(
  auth: Partial<SuperadminGoogleAuth>
): SuperadminGoogleAuth {
  saveSuperadminGoogleAuthAsync(auth).catch(() => {});
  const current = getSuperadminCalendarData();
  current.googleAuth = { ...current.googleAuth, ...auth };
  memoryCache = current;
  return current.googleAuth;
}

export async function clearSuperadminGoogleAuthAsync(): Promise<void> {
  const current = await getSuperadminCalendarDataAsync();
  current.googleAuth = {
    connected: false,
  };
  memoryCache = current;

  try {
    if (supabaseAdmin) {
      await (supabaseAdmin.from("auto_integrations") as any)
        .upsert([
          {
            channel: "google_calendar_superadmin",
            connected: false,
            token: null,
            refresh_token: null,
            expires_at: null,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: "channel" });
    }
  } catch (err) {
    console.warn("Aviso desconectando Google de Supabase:", err);
  }
}

export function clearSuperadminGoogleAuth(): void {
  clearSuperadminGoogleAuthAsync().catch(() => {});
  const current = getSuperadminCalendarData();
  current.googleAuth = { connected: false };
  memoryCache = current;
}

export async function getSuperadminMeetingsAsync(): Promise<SuperadminMeeting[]> {
  const current = await getSuperadminCalendarDataAsync();
  return current.meetings.sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
}

export function getSuperadminMeetings(): SuperadminMeeting[] {
  const current = getSuperadminCalendarData();
  return current.meetings.sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
}

export async function addSuperadminMeetingAsync(meeting: SuperadminMeeting): Promise<SuperadminMeeting> {
  const current = await getSuperadminCalendarDataAsync();
  current.meetings = [meeting, ...current.meetings.filter((m) => m.id !== meeting.id && m.googleEventId !== meeting.googleEventId)];
  memoryCache = current;

  try {
    if (supabaseAdmin) {
      const { data: existing } = await (supabaseAdmin.from("events") as any)
        .select("id, description")
        .eq("event_type", "reunion")
        .neq("title", "__superadmin_calendar_config__")
        .order("event_date", { ascending: false })
        .limit(100);

      let existingId: string | null = null;
      if (Array.isArray(existing)) {
        for (const row of existing) {
          try {
            const meta = JSON.parse(row.description);
            if (
              (meeting.googleEventId && meta.googleEventId === meeting.googleEventId) ||
              (meeting.id && meta.id === meeting.id)
            ) {
              existingId = row.id;
              break;
            }
          } catch (e) {}
        }
      }

      const descriptionPayload = JSON.stringify({
        ...meeting,
        source: "superadmin_meet",
      });

      if (existingId) {
        await (supabaseAdmin.from("events") as any)
          .update({
            title: meeting.title,
            event_date: meeting.start,
            description: descriptionPayload,
          })
          .eq("id", existingId);
      } else {
        await (supabaseAdmin.from("events") as any).insert({
          title: meeting.title,
          event_type: "reunion",
          event_date: meeting.start,
          description: descriptionPayload,
        });
      }
    }
  } catch (e) {
    console.warn("Aviso insertando reunion en Supabase:", e);
  }

  return meeting;
}

export function addSuperadminMeeting(meeting: SuperadminMeeting): SuperadminMeeting {
  addSuperadminMeetingAsync(meeting).catch(() => {});
  const current = getSuperadminCalendarData();
  current.meetings = [meeting, ...current.meetings.filter((m) => m.id !== meeting.id)];
  memoryCache = current;
  return meeting;
}

export async function addSuperadminMeetingsBatchAsync(
  meetings: SuperadminMeeting[]
): Promise<number> {
  if (!meetings || meetings.length === 0) return 0;

  const current = await getSuperadminCalendarDataAsync();
  const existingMeetingIds = new Set(current.meetings.map((m) => m.id));
  const existingGoogleIds = new Set(
    current.meetings.filter((m) => m.googleEventId).map((m) => m.googleEventId)
  );

  const newMeetingsToKeep = meetings.filter(
    (m) => !existingMeetingIds.has(m.id) && (!m.googleEventId || !existingGoogleIds.has(m.googleEventId))
  );

  if (newMeetingsToKeep.length === 0) {
    return 0;
  }

  // Actualizar estado local
  current.meetings = [...newMeetingsToKeep, ...current.meetings];
  memoryCache = current;

  // Inserción en batch en Supabase events (acotado a 200)
  if (supabaseAdmin) {
    try {
      const { data: dbExisting } = await (supabaseAdmin.from("events") as any)
        .select("id, description")
        .eq("event_type", "reunion")
        .neq("title", "__superadmin_calendar_config__")
        .order("event_date", { ascending: false })
        .limit(200);

      const dbExistingGoogleIds = new Set<string>();
      const dbExistingIds = new Set<string>();

      if (Array.isArray(dbExisting)) {
        for (const row of dbExisting) {
          dbExistingIds.add(row.id);
          if (row.description) {
            try {
              const meta = JSON.parse(row.description);
              if (meta.googleEventId) dbExistingGoogleIds.add(meta.googleEventId);
              if (meta.id) dbExistingIds.add(meta.id);
            } catch (e) {}
          }
        }
      }

      const rowsToInsert = [];
      for (const m of newMeetingsToKeep) {
        if (m.googleEventId && dbExistingGoogleIds.has(m.googleEventId)) continue;
        if (m.id && dbExistingIds.has(m.id)) continue;

        rowsToInsert.push({
          title: m.title || "Reunión",
          event_type: "reunion",
          event_date: m.start,
          description: JSON.stringify({
            ...m,
            source: "superadmin_meet",
          }),
        });
      }

      const chunkSize = 50;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        await (supabaseAdmin.from("events") as any).insert(chunk);
      }
    } catch (dbErr) {
      console.error("Error en batch insert a Supabase events:", dbErr);
    }
  }

  return newMeetingsToKeep.length;
}

export async function saveSuperadminMeetingsAsync(meetings: SuperadminMeeting[]): Promise<void> {
  const current = await getSuperadminCalendarDataAsync();
  current.meetings = meetings;
  memoryCache = current;
}

export function saveSuperadminMeetings(meetings: SuperadminMeeting[]): void {
  saveSuperadminMeetingsAsync(meetings).catch(() => {});
  const current = getSuperadminCalendarData();
  current.meetings = meetings;
  memoryCache = current;
}

export async function updateSuperadminMeetingStatusAsync(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): Promise<boolean> {
  const current = await getSuperadminCalendarDataAsync();
  const meeting = current.meetings.find((m) => m.id === id);
  if (meeting) {
    meeting.status = status;
    memoryCache = current;

    try {
      if (supabaseAdmin) {
        const { data: rows } = await (supabaseAdmin.from("events") as any)
          .select("id, description")
          .eq("event_type", "reunion")
          .neq("title", "__superadmin_calendar_config__")
          .order("event_date", { ascending: false })
          .limit(100);

        if (Array.isArray(rows)) {
          for (const row of rows) {
            try {
              const meta = JSON.parse(row.description);
              if (meta.id === id || meta.googleEventId === id) {
                meta.status = status;
                await (supabaseAdmin.from("events") as any)
                  .update({ description: JSON.stringify(meta) })
                  .eq("id", row.id);
                break;
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    return true;
  }
  return false;
}

export function updateSuperadminMeetingStatus(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): boolean {
  updateSuperadminMeetingStatusAsync(id, status).catch(() => {});
  const current = getSuperadminCalendarData();
  const meeting = current.meetings.find((m) => m.id === id);
  if (meeting) {
    meeting.status = status;
    memoryCache = current;
    return true;
  }
  return false;
}
