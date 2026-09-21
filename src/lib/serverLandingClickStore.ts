import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type LandingEventType = "click" | "pageview" | "conversion";

export interface LandingTrackingEvent {
  id: string;
  eventType: LandingEventType;
  buttonId: string;
  buttonText: string;
  section: string;
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  deviceType: "desktop" | "mobile" | "tablet";
  createdAt: string; // ISO String
  timestamp: number; // Date.now()
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId?: string;
}

// Alias de retrocompatibilidad
export type LandingClickEvent = LandingTrackingEvent;

export interface LandingTimelinePoint {
  date: string;
  displayDate: string;
  visits: number;
  clicks: number;
  conversions: number;
  count: number; // Suma total de eventos para compatibilidad
}

export interface LandingClickMetrics {
  totalVisits: number;
  visitsToday: number;
  totalClicks: number;
  clicksToday: number;
  totalConversions: number;
  conversionsToday: number;
  ctr: number; // Tasa de interacción Clics / Visitas (%)
  conversionRate: number; // Tasa de conversión Leads / Visitas (%)
  topButton: { buttonId: string; buttonText: string; count: number; percentage: number } | null;
  topSection: { section: string; count: number; percentage: number } | null;
  topPage: { pageUrl: string; count: number; percentage: number } | null;
  topReferrer: { referrer: string; count: number; percentage: number } | null;
  byButton: Array<{ buttonId: string; buttonText: string; section: string; count: number; percentage: number }>;
  bySection: Array<{ section: string; count: number; percentage: number }>;
  byDevice: Array<{ deviceType: string; count: number; percentage: number }>;
  byPage: Array<{ pageUrl: string; pageTitle?: string; visits: number; clicks: number; total: number; percentage: number }>;
  byReferrer: Array<{ referrer: string; count: number; percentage: number }>;
  timeline: LandingTimelinePoint[];
  recentEvents: LandingTrackingEvent[];
}

let cachedEvents: LandingTrackingEvent[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 4000; // 4 segundos de caché en servidor
let inMemoryEvents: LandingTrackingEvent[] = [];

function getLocalEvents(): LandingTrackingEvent[] {
  return inMemoryEvents;
}

function saveLocalEvents(events: LandingTrackingEvent[]) {
  inMemoryEvents = events;
}

export function clearEventsCache() {
  cachedEvents = null;
  lastCacheTime = 0;
}

export async function getAllServerClickEvents(forceRefresh: boolean = false): Promise<LandingTrackingEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedEvents !== null && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedEvents;
  }

  try {
    const { data, error } = await (supabaseAdmin.from("inbox_conversations") as any)
      .select("*")
      .eq("channel", "landing_click_event")
      .order("created_at", { ascending: false })
      .limit(1500);

    if (!error && Array.isArray(data)) {
      const supabaseEvents: LandingTrackingEvent[] = data.map((item: any) => {
        let meta: any = {};
        try {
          meta = JSON.parse(item.notes || "{}");
        } catch (e) {}

        const eventTime = item.created_at ? new Date(item.created_at).getTime() : Date.now();
        const detectedType: LandingEventType =
          meta.eventType || (item.lead_name === "page_view" || (item.last_message && item.last_message.startsWith("Visita a ")) ? "pageview" : "click");

        return {
          id: item.id,
          eventType: detectedType,
          buttonId: meta.buttonId || item.lead_name || "btn_unknown",
          buttonText: meta.buttonText || item.last_message || "Interacción",
          section: meta.section || item.lead_avatar || (detectedType === "pageview" ? "Visitas" : "General"),
          pageUrl: meta.pageUrl || "/",
          pageTitle: meta.pageTitle || "",
          referrer: meta.referrer || "",
          deviceType: meta.deviceType || "desktop",
          createdAt: item.created_at || new Date().toISOString(),
          timestamp: meta.timestamp || eventTime,
          userAgent: meta.userAgent || "",
          utmSource: meta.utmSource || "",
          utmMedium: meta.utmMedium || "",
          utmCampaign: meta.utmCampaign || "",
          sessionId: meta.sessionId || ""
        };
      });

      const map = new Map<string, LandingTrackingEvent>();
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

export async function recordServerClickEvent(eventData: {
  eventType?: LandingEventType;
  buttonId: string;
  buttonText: string;
  section?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId?: string;
}): Promise<LandingTrackingEvent> {
  const now = new Date();
  const eventType: LandingEventType = eventData.eventType || (eventData.buttonId === "page_view" ? "pageview" : "click");
  const prefix = eventType === "pageview" ? "vst" : eventType === "conversion" ? "cnv" : "clk";
  const eventId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sectionName = eventData.section || (eventType === "pageview" ? "Visitas" : "General");
  const device = eventData.deviceType || "desktop";

  const newEvent: LandingTrackingEvent = {
    id: eventId,
    eventType,
    buttonId: eventData.buttonId,
    buttonText: eventData.buttonText,
    section: sectionName,
    pageUrl: eventData.pageUrl || "/",
    pageTitle: eventData.pageTitle || "",
    referrer: eventData.referrer || "",
    deviceType: device,
    createdAt: now.toISOString(),
    timestamp: now.getTime(),
    userAgent: eventData.userAgent || "",
    utmSource: eventData.utmSource || "",
    utmMedium: eventData.utmMedium || "",
    utmCampaign: eventData.utmCampaign || "",
    sessionId: eventData.sessionId || ""
  };

  // 1. Guardar en respaldo local
  const currentLocal = getLocalEvents();
  const updatedLocal = [newEvent, ...currentLocal].slice(0, 3000);
  saveLocalEvents(updatedLocal);

  // 2. Persistir en Supabase
  try {
    const payload = {
      id: newEvent.id,
      agency_id: "00000000-0000-0000-0000-000000000000",
      lead_name: eventData.buttonId,
      lead_avatar: sectionName,
      channel: "landing_click_event",
      last_message: eventData.buttonText,
      last_message_time: now.toISOString(),
      unread: false,
      notes: JSON.stringify({
        eventType,
        buttonId: eventData.buttonId,
        buttonText: eventData.buttonText,
        section: sectionName,
        pageUrl: eventData.pageUrl || "/",
        pageTitle: eventData.pageTitle || "",
        referrer: eventData.referrer || "",
        deviceType: device,
        timestamp: now.getTime(),
        userAgent: eventData.userAgent || "",
        utmSource: eventData.utmSource || "",
        utmMedium: eventData.utmMedium || "",
        utmCampaign: eventData.utmCampaign || "",
        sessionId: eventData.sessionId || ""
      })
    };

    await (supabaseAdmin.from("inbox_conversations") as any).insert([payload]);
  } catch (sbErr) {
    console.error("Error guardando evento en Supabase:", sbErr);
  }

  clearEventsCache();
  return newEvent;
}

export async function getLandingClickMetrics(forceRefresh: boolean = false, days: number = 14): Promise<LandingClickMetrics> {
  const events = await getAllServerClickEvents(forceRefresh);

  const visitEvents = events.filter((e) => e.eventType === "pageview");
  const clickEvents = events.filter((e) => e.eventType === "click" || !e.eventType);
  const conversionEvents = events.filter((e) => e.eventType === "conversion");

  const totalVisits = visitEvents.length;
  const totalClicks = clickEvents.length;
  const totalConversions = conversionEvents.length;

  const todayStr = new Date().toISOString().split("T")[0];

  const visitsToday = visitEvents.filter((e) => {
    const eDate = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    return eDate === todayStr;
  }).length;

  const clicksToday = clickEvents.filter((e) => {
    const eDate = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    return eDate === todayStr;
  }).length;

  const conversionsToday = conversionEvents.filter((e) => {
    const eDate = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    return eDate === todayStr;
  }).length;

  // Tasas de conversión y CTR
  const ctr = totalVisits > 0 ? Math.round((totalClicks / totalVisits) * 100) : totalClicks > 0 ? 100 : 0;
  const conversionRate = totalVisits > 0 ? parseFloat(((totalConversions / totalVisits) * 100).toFixed(1)) : 0;

  // Clics por Botón (excluyendo pageviews)
  const buttonMap = new Map<string, { buttonId: string; buttonText: string; section: string; count: number }>();
  clickEvents.forEach((e) => {
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

  // Interacción por Sección (clics)
  const sectionMap = new Map<string, number>();
  clickEvents.forEach((e) => {
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

  // Desglose por Dispositivo (todos los eventos)
  const deviceMap = new Map<string, number>();
  events.forEach((e) => {
    const dev = e.deviceType || "desktop";
    deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
  });

  const totalAllEvents = events.length;
  const byDevice = Array.from(deviceMap.entries())
    .map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: totalAllEvents > 0 ? Math.round((count / totalAllEvents) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Desglose por Página
  const pageMap = new Map<string, { pageUrl: string; pageTitle?: string; visits: number; clicks: number; total: number }>();
  events.forEach((e) => {
    const rawUrl = e.pageUrl || "/";
    const cleanUrl = rawUrl.split("?")[0] || "/";
    const current = pageMap.get(cleanUrl) || { pageUrl: cleanUrl, pageTitle: e.pageTitle, visits: 0, clicks: 0, total: 0 };
    if (e.eventType === "pageview") {
      current.visits += 1;
    } else {
      current.clicks += 1;
    }
    current.total += 1;
    if (e.pageTitle && !current.pageTitle) {
      current.pageTitle = e.pageTitle;
    }
    pageMap.set(cleanUrl, current);
  });

  const byPage = Array.from(pageMap.values())
    .map((p) => ({
      ...p,
      percentage: totalAllEvents > 0 ? Math.round((p.total / totalAllEvents) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

  const topPage = byPage.length > 0 ? { pageUrl: byPage[0].pageUrl, count: byPage[0].total, percentage: byPage[0].percentage } : null;

  // Desglose por Referrer / Fuentes
  const refMap = new Map<string, number>();
  events.forEach((e) => {
    let source = "Directo / Desconocido";
    if (e.utmSource) {
      source = `Campaña: ${e.utmSource}`;
    } else if (e.referrer) {
      try {
        const parsed = new URL(e.referrer);
        source = parsed.hostname.replace("www.", "");
      } catch (err) {
        source = e.referrer.substring(0, 30);
      }
    }
    refMap.set(source, (refMap.get(source) || 0) + 1);
  });

  const byReferrer = Array.from(refMap.entries())
    .map(([referrer, count]) => ({
      referrer,
      count,
      percentage: totalAllEvents > 0 ? Math.round((count / totalAllEvents) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topReferrer = byReferrer.length > 0 ? byReferrer[0] : null;

  // Serie de Tiempo Diaria (según rango de días solicitado: 7, 14, 30)
  const numDays = Math.max(days || 14, 7);
  const timelineDates: string[] = [];
  const dailyVisitsMap = new Map<string, number>();
  const dailyClicksMap = new Map<string, number>();
  const dailyConversionsMap = new Map<string, number>();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().split("T")[0];
    timelineDates.push(isoDate);
    dailyVisitsMap.set(isoDate, 0);
    dailyClicksMap.set(isoDate, 0);
    dailyConversionsMap.set(isoDate, 0);
  }

  events.forEach((e) => {
    const dStr = new Date(e.timestamp || e.createdAt).toISOString().split("T")[0];
    if (dailyVisitsMap.has(dStr)) {
      if (e.eventType === "pageview") {
        dailyVisitsMap.set(dStr, (dailyVisitsMap.get(dStr) || 0) + 1);
      } else if (e.eventType === "conversion") {
        dailyConversionsMap.set(dStr, (dailyConversionsMap.get(dStr) || 0) + 1);
      } else {
        dailyClicksMap.set(dStr, (dailyClicksMap.get(dStr) || 0) + 1);
      }
    }
  });

  const timeline: LandingTimelinePoint[] = timelineDates.map((dateStr) => {
    const parts = dateStr.split("-");
    const displayDate = `${parts[2]}/${parts[1]}`;
    const v = dailyVisitsMap.get(dateStr) || 0;
    const c = dailyClicksMap.get(dateStr) || 0;
    const conv = dailyConversionsMap.get(dateStr) || 0;
    return {
      date: dateStr,
      displayDate,
      visits: v,
      clicks: c,
      conversions: conv,
      count: v + c + conv
    };
  });

  const recentEvents = events.slice(0, 150);

  return {
    totalVisits,
    visitsToday,
    totalClicks,
    clicksToday,
    totalConversions,
    conversionsToday,
    ctr,
    conversionRate,
    topButton,
    topSection,
    topPage,
    topReferrer,
    byButton,
    bySection,
    byDevice,
    byPage,
    byReferrer,
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

