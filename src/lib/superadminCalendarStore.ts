import fs from "fs";
import path from "path";
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

interface SuperadminCalendarData {
  config: SuperadminCalendarConfig;
  googleAuth: SuperadminGoogleAuth;
  meetings: SuperadminMeeting[];
}

const DEFAULT_CONFIG: SuperadminCalendarConfig = {
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
};

const DEFAULT_DATA: SuperadminCalendarData = {
  config: DEFAULT_CONFIG,
  googleAuth: {
    connected: false,
  },
  meetings: [],
};

const PRIMARY_STORAGE_PATH = path.join(process.cwd(), ".superadmin_calendar_data.json");
const FALLBACK_STORAGE_PATH = path.join("/tmp", ".superadmin_calendar_data.json");

let memoryCache: SuperadminCalendarData | null = null;

function getStoragePath(): string {
  try {
    const testDir = path.dirname(PRIMARY_STORAGE_PATH);
    fs.accessSync(testDir, fs.constants.W_OK);
    return PRIMARY_STORAGE_PATH;
  } catch (e) {
    return FALLBACK_STORAGE_PATH;
  }
}

function loadDataFromDisk(): SuperadminCalendarData {
  const filePath = getStoragePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        
        // Manejar migración de timeRanges si antes solo existía startTime/endTime
        let timeRanges: TimeRange[] = [];
        if (Array.isArray(parsed.config?.consultationHours?.timeRanges) && parsed.config.consultationHours.timeRanges.length > 0) {
          timeRanges = parsed.config.consultationHours.timeRanges;
        } else {
          const s = parsed.config?.consultationHours?.startTime || "09:00";
          const e = parsed.config?.consultationHours?.endTime || "18:00";
          timeRanges = [{ startTime: s, endTime: e }];
        }

        return {
          config: {
            ...DEFAULT_CONFIG,
            ...(parsed.config || {}),
            consultationHours: {
              startTime: timeRanges[0]?.startTime || "09:00",
              endTime: timeRanges[timeRanges.length - 1]?.endTime || "18:00",
              timeRanges,
            },
          },
          googleAuth: {
            ...DEFAULT_DATA.googleAuth,
            ...(parsed.googleAuth || {}),
          },
          meetings: Array.isArray(parsed.meetings) ? parsed.meetings : [],
        };
      }
    }
  } catch (err) {
    console.error("Error leyendo superadmin_calendar_data de disco:", err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveDataToDisk(data: SuperadminCalendarData): void {
  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error guardando superadmin_calendar_data en disco:", err);
  }
}

export function getSuperadminCalendarData(): SuperadminCalendarData {
  if (!memoryCache) {
    memoryCache = loadDataFromDisk();
  }
  return memoryCache;
}

export function saveSuperadminCalendarConfig(
  updates: Partial<SuperadminCalendarConfig>
): SuperadminCalendarConfig {
  const current = getSuperadminCalendarData();

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
  };

  current.config = newConfig;
  memoryCache = current;
  saveDataToDisk(current);

  return current.config;
}

export function getSuperadminGoogleAuth(): SuperadminGoogleAuth {
  const current = getSuperadminCalendarData();
  return current.googleAuth;
}

export function saveSuperadminGoogleAuth(
  auth: Partial<SuperadminGoogleAuth>
): SuperadminGoogleAuth {
  const current = getSuperadminCalendarData();
  current.googleAuth = {
    ...current.googleAuth,
    ...auth,
  };
  memoryCache = current;
  saveDataToDisk(current);
  return current.googleAuth;
}

export function clearSuperadminGoogleAuth(): void {
  const current = getSuperadminCalendarData();
  current.googleAuth = {
    connected: false,
  };
  memoryCache = current;
  saveDataToDisk(current);
}

export function getSuperadminMeetings(): SuperadminMeeting[] {
  const current = getSuperadminCalendarData();
  return current.meetings.sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
}

export function addSuperadminMeeting(meeting: SuperadminMeeting): SuperadminMeeting {
  const current = getSuperadminCalendarData();
  current.meetings = [meeting, ...current.meetings.filter((m) => m.id !== meeting.id)];
  memoryCache = current;
  saveDataToDisk(current);

  try {
    if (supabaseAdmin) {
      (supabaseAdmin.from("events") as any)
        .insert({
          title: meeting.title,
          event_type: "reunion",
          event_date: meeting.start,
          end_date: meeting.end,
          description: JSON.stringify({
            client_name: meeting.clientName,
            client_email: meeting.clientEmail,
            client_phone: meeting.clientPhone,
            agency_name: meeting.agencyName,
            meet_url: meeting.meetUrl,
            google_event_id: meeting.googleEventId,
            is_google_event: meeting.isGoogleEvent,
            status: meeting.status,
            source: "superadmin_meet",
          }),
        })
        .then(() => {})
        .catch(() => {});
    }
  } catch (e) {}

  return meeting;
}

export function saveSuperadminMeetings(meetings: SuperadminMeeting[]): void {
  const current = getSuperadminCalendarData();
  current.meetings = meetings;
  memoryCache = current;
  saveDataToDisk(current);
}

export function updateSuperadminMeetingStatus(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): boolean {
  const current = getSuperadminCalendarData();
  const meeting = current.meetings.find((m) => m.id === id);
  if (meeting) {
    meeting.status = status;
    memoryCache = current;
    saveDataToDisk(current);
    return true;
  }
  return false;
}
