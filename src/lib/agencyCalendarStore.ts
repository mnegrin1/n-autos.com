import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface AgencyCalendarConfig {
  availableDays: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string; // ej: "09:00"
  endTime: string; // ej: "19:00"
  slotDurationMinutes: number; // 30, 45, 60
  displayDaysAhead: number; // 14, 30
  timeRanges?: Array<{ startTime: string; endTime: string }>;
}

export interface AgencyGoogleAuth {
  connected: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export const DEFAULT_AGENCY_CALENDAR_CONFIG: AgencyCalendarConfig = {
  availableDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
  startTime: "09:00",
  endTime: "19:00",
  slotDurationMinutes: 30,
  displayDaysAhead: 14,
  timeRanges: [
    { startTime: "09:00", endTime: "13:00" },
    { startTime: "14:00", endTime: "19:00" },
  ],
};

interface AgencyCalendarState {
  config: AgencyCalendarConfig;
  googleAuth: AgencyGoogleAuth;
}

// In-memory cache per agency ID for serverless & edge runtimes
const agencyCalendarCache = new Map<string, AgencyCalendarState>();

function getChannelName(agencyId: string) {
  return `google_calendar_agency_${agencyId}`;
}

function getConfigTitle(agencyId: string) {
  return `__agency_calendar_config_${agencyId}__`;
}

/**
 * Obtiene la configuración de agenda y autenticación Google de una agencia
 */
export async function getAgencyCalendarDataAsync(agencyId: string): Promise<AgencyCalendarState> {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";

  let cached = agencyCalendarCache.get(targetId);
  if (!cached) {
    cached = {
      config: JSON.parse(JSON.stringify(DEFAULT_AGENCY_CALENDAR_CONFIG)),
      googleAuth: { connected: false },
    };
    agencyCalendarCache.set(targetId, cached);
  }

  if (!supabaseAdmin) {
    return {
      config: { ...cached.config },
      googleAuth: { ...cached.googleAuth },
    };
  }

  try {
    // 1. Cargar Google Auth desde auto_integrations
    const { data: authRow } = await (supabaseAdmin.from("auto_integrations") as any)
      .select("*")
      .eq("channel", getChannelName(targetId))
      .maybeSingle();

    if (authRow) {
      cached.googleAuth = {
        connected: !!authRow.connected,
        email: authRow.username || cached.googleAuth.email,
        accessToken: authRow.token || cached.googleAuth.accessToken,
        refreshToken: authRow.refresh_token || cached.googleAuth.refreshToken,
        tokenExpiry: authRow.expires_at ? Number(authRow.expires_at) : cached.googleAuth.tokenExpiry,
      };
    }

    // 2. Cargar Configuración desde tabla events
    const { data: configRow } = await (supabaseAdmin.from("events") as any)
      .select("description")
      .eq("agency_id", targetId)
      .eq("title", getConfigTitle(targetId))
      .maybeSingle();

    if (configRow?.description) {
      try {
        const parsed = JSON.parse(configRow.description);
        cached.config = {
          ...DEFAULT_AGENCY_CALENDAR_CONFIG,
          ...parsed,
        };
      } catch {}
    }
  } catch (err) {
    console.warn("Aviso obteniendo datos de calendario de agencia desde Supabase:", err);
  }

  return {
    config: { ...cached.config },
    googleAuth: { ...cached.googleAuth },
  };
}

/**
 * Guarda la configuración de horarios y días disponibles de la agencia
 */
export async function saveAgencyCalendarConfigAsync(
  agencyId: string,
  updates: Partial<AgencyCalendarConfig>
): Promise<AgencyCalendarConfig> {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const current = await getAgencyCalendarDataAsync(targetId);

  const updatedConfig: AgencyCalendarConfig = {
    ...current.config,
    ...updates,
  };

  // Actualizar caché en memoria
  current.config = updatedConfig;
  agencyCalendarCache.set(targetId, current);

  // Persistir en Supabase events
  if (supabaseAdmin) {
    try {
      const configTitle = getConfigTitle(targetId);
      const { data: existing } = await (supabaseAdmin.from("events") as any)
        .select("id")
        .eq("agency_id", targetId)
        .eq("title", configTitle)
        .maybeSingle();

      const payload = {
        agency_id: targetId,
        title: configTitle,
        event_type: "reunion",
        event_date: new Date().toISOString(),
        description: JSON.stringify(updatedConfig),
      };

      if (existing?.id) {
        await (supabaseAdmin.from("events") as any).update(payload).eq("id", existing.id);
      } else {
        await (supabaseAdmin.from("events") as any).insert([payload]);
      }
    } catch (e) {
      console.warn("Aviso guardando configuración de agencia en Supabase:", e);
    }
  }

  return updatedConfig;
}

/**
 * Guarda o actualiza la autenticación de Google Calendar para la agencia
 */
export async function saveAgencyGoogleAuthAsync(
  agencyId: string,
  auth: Partial<AgencyGoogleAuth>
): Promise<AgencyGoogleAuth> {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const current = await getAgencyCalendarDataAsync(targetId);

  current.googleAuth = {
    ...current.googleAuth,
    ...auth,
    refreshToken: auth.refreshToken !== undefined ? auth.refreshToken : current.googleAuth.refreshToken,
  };
  agencyCalendarCache.set(targetId, current);

  if (supabaseAdmin) {
    try {
      const channel = getChannelName(targetId);
      const { data: existing } = await (supabaseAdmin.from("auto_integrations") as any)
        .select("id")
        .eq("channel", channel)
        .maybeSingle();

      const payload = {
        agency_id: targetId,
        channel,
        connected: current.googleAuth.connected,
        username: current.googleAuth.email || null,
        token: current.googleAuth.accessToken || null,
        refresh_token: current.googleAuth.refreshToken || null,
        expires_at: current.googleAuth.tokenExpiry || null,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await (supabaseAdmin.from("auto_integrations") as any).update(payload).eq("id", existing.id);
      } else {
        await (supabaseAdmin.from("auto_integrations") as any).insert([payload]);
      }
    } catch (e) {
      console.warn("Aviso guardando Google Auth en Supabase:", e);
    }
  }

  return current.googleAuth;
}

/**
 * Desconecta la cuenta de Google Calendar de la agencia
 */
export async function clearAgencyGoogleAuthAsync(agencyId: string): Promise<void> {
  const targetId = agencyId || "00000000-0000-0000-0000-000000000000";
  const current = await getAgencyCalendarDataAsync(targetId);

  current.googleAuth = { connected: false };
  agencyCalendarCache.set(targetId, current);

  if (supabaseAdmin) {
    try {
      await (supabaseAdmin.from("auto_integrations") as any)
        .update({
          connected: false,
          token: null,
          refresh_token: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("channel", getChannelName(targetId));
    } catch (e) {
      console.warn("Aviso desconectando Google Calendar de la agencia en Supabase:", e);
    }
  }
}
