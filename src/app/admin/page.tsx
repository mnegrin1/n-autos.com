export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import styles from "./dashboard.module.css";
import DashboardGrid, { DashboardMetricsData } from "@/components/DashboardGrid";

// Helper to parse dates/times safely
function parseActivityDate(item: any): Date {
  if (item.created_at) return new Date(item.created_at);
  const timeStr = item.time || "";
  const now = Date.now();
  if (timeStr.toLowerCase().includes("ahora")) return new Date(now);
  if (timeStr.toLowerCase().includes("h")) {
    const hrs = parseInt(timeStr.match(/\d+/) || "1");
    return new Date(now - hrs * 60 * 60 * 1000);
  }
  if (timeStr.toLowerCase().includes("d")) {
    const days = parseInt(timeStr.match(/\d+/) || "1");
    return new Date(now - days * 24 * 60 * 60 * 1000);
  }
  return new Date(now - 2 * 24 * 60 * 60 * 1000);
}

export default async function AutoAdminDashboard() {
  const [
    { data: vehiclesData },
    { data: leadsData },
    { data: eventsData },
    { data: broadcastsData },
    { data: inboxData }
  ] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("auto_leads").select("*"),
    supabase.from("events").select("*"),
    supabase.from("email_broadcasts").select("*"),
    supabase.from("inbox_conversations").select("*"),
  ]);

  const vehicles = vehiclesData || [];
  const leads = leadsData || [];
  const events = eventsData || [];
  const broadcasts = broadcastsData || [];
  const inbox = inboxData || [];

  // Operative KPIs
  const stockCount = vehicles.filter((v: any) => v.status === "disponible").length;
  const newLeadsCount = leads.filter((l: any) => l.status === "nuevo").length;
  const activeLeadsCount = leads.filter((l: any) => l.status !== "cerrado").length;
  const reservedCount = vehicles.filter((v: any) => v.status === "reservado").length;
  const soldCount = vehicles.filter((v: any) => v.status === "vendido").length;
  const eventsCount = events.length;

  // Emails Sent Calculation (Broadcasts sent + Inbox email messages)
  const broadcastEmailsSent = broadcasts.reduce((acc: number, b: any) => acc + (Number(b.sent_count) || 0), 0);
  
  let inboxEmailSent = 0;
  inbox.forEach((conv: any) => {
    if (conv.channel === "email" && Array.isArray(conv.messages)) {
      conv.messages.forEach((msg: any) => {
        if (msg.sender !== "lead") {
          inboxEmailSent++;
        }
      });
    }
  });
  const totalEmailsSent = broadcastEmailsSent + inboxEmailSent;

  // Leads chart points (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const leadsByDay = last7Days.map(day => {
    const count = leads.filter((lead: any) => {
      const leadDate = parseActivityDate(lead);
      return leadDate.toDateString() === day.toDateString();
    }).length;
    return {
      dateStr: day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      count
    };
  });

  // Brand Distribution
  const brands = vehicles.reduce((acc: Record<string, number>, v: any) => {
    const brandName = v.brand ? String(v.brand).trim() : "Sin Marca";
    acc[brandName] = (acc[brandName] || 0) + 1;
    return acc;
  }, {});

  const totalVehicles = vehicles.length || 1;
  const brandList = Object.keys(brands).map(b => ({
    name: b,
    count: brands[b],
    percentage: Math.round((brands[b] / totalVehicles) * 100)
  })).sort((a, b) => b.count - a.count);

  // Consolidated Activity Feed
  const vehicleActivities = vehicles.map((v: any) => ({
    id: `v-${v.id}`,
    type: "vehicle",
    text: `Vehículo registrado en inventario: ${v.brand} ${v.model} (${v.year})`,
    dateIso: parseActivityDate(v).toISOString(),
    badgeClass: styles.badgeProperty,
    badgeText: "Vehículo"
  }));

  const leadActivities = leads.map((l: any) => ({
    id: `l-${l.id}`,
    type: "lead",
    text: `Nuevo interesado recibido: "${l.name}" por "${l.vehicle || 'Consulta General'}"`,
    dateIso: parseActivityDate(l).toISOString(),
    badgeClass: styles.badgeLead,
    badgeText: "Interesado"
  }));

  const eventActivities = events.map((e: any) => ({
    id: `e-${e.id}`,
    type: "event",
    text: `Test Drive / Reunión agendada: "${e.title}"`,
    dateIso: parseActivityDate(e).toISOString(),
    badgeClass: styles.badgeEvent,
    badgeText: "Agenda"
  }));

  const broadcastActivities = broadcasts.map((b: any) => ({
    id: `b-${b.id}`,
    type: "broadcast",
    text: `Email Masivo enviado: "${b.subject}" a ${b.sent_count || 0} contactos`,
    dateIso: parseActivityDate(b).toISOString(),
    badgeClass: styles.badgeBroadcast,
    badgeText: "Email"
  }));

  const recentActivities = [...vehicleActivities, ...leadActivities, ...eventActivities, ...broadcastActivities]
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
    .slice(0, 8);

  // Upcoming Events list
  const upcomingEvents = events
    .map((e: any) => ({
      id: e.id,
      title: e.title || "Reunión agendada",
      event_type: e.event_type || "visita",
      event_date: e.event_date || e.created_at || new Date().toISOString(),
      description: e.description || "",
    }))
    .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);

  const metricsData: DashboardMetricsData = {
    stockCount,
    newLeadsCount,
    activeLeadsCount,
    totalEmailsSent,
    reservedCount,
    soldCount,
    eventsCount,
    leadsByDay,
    brandList,
    recentActivities,
    upcomingEvents,
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Dynamic Dashboard Grid with Widget Selection & Reordering */}
      <DashboardGrid data={metricsData} />
    </div>
  );
}
