import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PRIMARY_STORAGE_PATH = path.join(process.cwd(), ".landing_clicks.json");
const FALLBACK_STORAGE_PATH = path.join("/tmp", ".landing_clicks.json");

export interface LandingClickEvent {
  id: string;
  buttonId: string;
  buttonText: string;
  section: string;
  pageUrl: string;
  referrer?: string;
  deviceType: "desktop" | "mobile" | "tablet";
  createdAt: string; // ISO String
  timestamp: number; // Date.now()
  userAgent?: string;
}

export interface LandingClickMetrics {
  totalClicks: number;
  clicksToday: number;
  topButton: { buttonId: string; buttonText: string; count: number; percentage: number } | null;
  topSection: { section: string; count: number; percentage: number } | null;
  byButton: Array<{ buttonId: string; buttonText: string; section: string; count: number; percentage: number }>;
  bySection: Array<{ section: string; count: number; percentage: number }>;
  byDevice: Array<{ deviceType: string; count: number; percentage: number }>;
  timeline: Array<{ date: string; displayDate: string; count: number }>;
  recentEvents: LandingClickEvent[];
}

let cachedEvents: LandingClickEvent[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 segundos de caché en servidor

function getStoragePath(): string {
  try {
    const testDir = path.dirname(PRIMARY_STORAGE_PATH);
    fs.accessSync(testDir, fs.constants.W_OK);
    return PRIMARY_STORAGE_PATH;
  } catch (e) {
    return FALLBACK_STORAGE_PATH;
  }
}

function getLocalEvents(): LandingClickEvent[] {
  const filePath = getStoragePath();
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      if (fileData.trim()) {
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Error leyendo serverLandingClickStore desde disco:", e);
  }
  return [];
}

function saveLocalEvents(events: LandingClickEvent[]) {
  const filePath = getStoragePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2), "utf-8");
  } catch (e) {
    console.error("Error al escribir serverLandingClickStore en disco:", e);
  }
}

export function clearEventsCache() {
  cachedEvents = null;
  lastCacheTime = 0;
}

export async function getAllServerClickEvents(forceRefresh: boolean = false): Promise<LandingClickEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedEvents !== null && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedEvents;
  }

  try {
    const { data, error } = await (supabaseAdmin.from("inbox_conversations") as any)
      .select("*")
      .eq("channel", "landing_click_event")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!error && Array.isArray(data)) {
      const supabaseEvents: LandingClickEvent[] = data.map((item: any) => {
        let meta: any = {};
        try {
          meta = JSON.parse(item.notes || "{}");
        } catch (e) {}

        const eventTime = item.created_at ? new Date(item.created_at).getTime() : Date.now();

        return {
          id: item.id,
          buttonId: meta.buttonId || item.lead_name || "btn_unknown",
          buttonText: meta.buttonText || item.last_message || "Botón",
          section: meta.section || item.lead_avatar || "General",
          pageUrl: meta.pageUrl || "/",
          referrer: meta.referrer || "",
          deviceType: meta.deviceType || "desktop",
          createdAt: item.created_at || new Date().toISOString(),
          timestamp: meta.timestamp || eventTime,
          userAgent: meta.userAgent || ""
        };
      });

      const map = new Map<string, LandingClickEvent>();
      supabaseEvents.forEach((evt) => {
        if (!map.has(evt.id)) map.set(evt.id, evt);
      });

      // Combinar con locales si hubiesen eventos offline
      const local = getLocalEvents();
      local.forEach((evt) => {
        if (!map.has(evt.id)) map.set(evt.id, evt);
      });

      const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
      saveLocalEvents(merged);
      cachedEvents = merged;
      lastCacheTime = Date.now();
      return merged;
    }
  } catch (e) {
    console.error("Aviso: Error obteniendo clics desde Supabase, usando respaldo local:", e);
  }

  const local = getLocalEvents().sort((a, b) => b.timestamp - a.timestamp);
  cachedEvents = local;
  lastCacheTime = Date.now();
  return local;
}

export async function recordServerClickEvent(clickData: {
  buttonId: string;
  buttonText: string;
  section?: string;
  pageUrl?: string;
  referrer?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  userAgent?: string;
}): Promise<LandingClickEvent> {
  const now = new Date();
  const eventId = `clk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sectionName = clickData.section || "General";
  const device = clickData.deviceType || "desktop";

  const newEvent: LandingClickEvent = {
    id: eventId,
    buttonId: clickData.buttonId,
    buttonText: clickData.buttonText,
    section: sectionName,
    pageUrl: clickData.pageUrl || "/",
    referrer: clickData.referrer || "",
    deviceType: device,
    createdAt: now.toISOString(),
    timestamp: now.getTime(),
    userAgent: clickData.userAgent || ""
  };

  // 1. Guardar en respaldo local
  const currentLocal = getLocalEvents();
  const updatedLocal = [newEvent, ...currentLocal].slice(0, 2000); // Mantener últimos 2000
  saveLocalEvents(updatedLocal);

  // 2. Persistir en Supabase
  try {
    const payload = {
      id: newEvent.id,
      agency_id: "00000000-0000-0000-0000-000000000000",
      lead_name: clickData.buttonId,
      lead_avatar: sectionName,
      channel: "landing_click_event",
      last_message: clickData.buttonText,
      last_message_time: now.toISOString(),
      unread: false,
      notes: JSON.stringify({
        buttonId: clickData.buttonId,
        buttonText: clickData.buttonText,
        section: sectionName,
        pageUrl: clickData.pageUrl || "/",
        referrer: clickData.referrer || "",
        deviceType: device,
        timestamp: now.getTime(),
        userAgent: clickData.userAgent || ""
      })
    };

    await (supabaseAdmin.from("inbox_conversations") as any).insert([payload]);
  } catch (sbErr) {
    console.error("Error guardando clic en Supabase:", sbErr);
  }

  clearEventsCache();
  return newEvent;
}

export async function getLandingClickMetrics(forceRefresh: boolean = false): Promise<LandingClickMetrics> {
  const events = await getAllServerClickEvents(forceRefresh);
  const totalClicks = events.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const clicksToday = events.filter((e) => {
    const eDate = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    return eDate === todayStr;
  }).length;

  // Clics por Botón
  const buttonMap = new Map<string, { buttonId: string; buttonText: string; section: string; count: number }>();
  events.forEach((e) => {
    const key = e.buttonId;
    const existing = buttonMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buttonMap.set(key, {
        buttonId: e.buttonId,
        buttonText: e.buttonText,
        section: e.section,
        count: 1
      });
    }
  });

  const byButton = Array.from(buttonMap.values())
    .map((b) => ({
      ...b,
      percentage: totalClicks > 0 ? Math.round((b.count / totalClicks) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topButton = byButton.length > 0 ? byButton[0] : null;

  // Clics por Sección
  const sectionMap = new Map<string, number>();
  events.forEach((e) => {
    const sec = e.section || "General";
    sectionMap.set(sec, (sectionMap.get(sec) || 0) + 1);
  });

  const bySection = Array.from(sectionMap.entries())
    .map(([section, count]) => ({
      section,
      count,
      percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topSection = bySection.length > 0 ? bySection[0] : null;

  // Clics por Dispositivo
  const deviceMap = new Map<string, number>();
  events.forEach((e) => {
    const dev = e.deviceType || "desktop";
    deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
  });

  const byDevice = Array.from(deviceMap.entries())
    .map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Serie de Tiempo (Últimos 14 días)
  const timelineMap = new Map<string, number>();
  const last14Days: string[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().split("T")[0];
    last14Days.push(isoDate);
    timelineMap.set(isoDate, 0);
  }

  events.forEach((e) => {
    const dStr = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    if (timelineMap.has(dStr)) {
      timelineMap.set(dStr, (timelineMap.get(dStr) || 0) + 1);
    }
  });

  const timeline = last14Days.map((dateStr) => {
    const parts = dateStr.split("-");
    const displayDate = `${parts[2]}/${parts[1]}`;
    return {
      date: dateStr,
      displayDate,
      count: timelineMap.get(dateStr) || 0
    };
  });

  const recentEvents = events.slice(0, 100);

  return {
    totalClicks,
    clicksToday,
    topButton,
    topSection,
    byButton,
    bySection,
    byDevice,
    timeline,
    recentEvents
  };
}

export async function clearServerClickEvents(): Promise<boolean> {
  clearEventsCache();
  saveLocalEvents([]);

  try {
    await (supabaseAdmin.from("inbox_conversations") as any)
      .delete()
      .eq("channel", "landing_click_event");
  } catch (e) {
    console.error("Error al eliminar eventos de clics en Supabase:", e);
  }

  return true;
}
