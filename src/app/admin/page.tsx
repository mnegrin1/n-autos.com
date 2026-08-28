export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentUser } from "@/actions/authActions";
import { getVehicles, getAutoLeads, getInboxConversations } from "@/actions/autoActions";
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
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const [vehicles, leads, eventsRes, broadcastsRes, inbox] = await Promise.all([
    agencyId ? getVehicles(agencyId) : Promise.resolve([]),
    getAutoLeads(agencyId),
    (supabaseAdmin.from("events") as any).select("*").eq("agency_id", agencyId),
    (supabaseAdmin.from("email_broadcasts") as any).select("*").eq("agency_id", agencyId),
    getInboxConversations(agencyId),
  ]);

  const events = eventsRes?.data || [];
  const broadcasts = broadcastsRes?.data || [];

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

  // Recent Consulted Vehicles (top 4 vehicles with queries)
  const sortedLeads = [...leads].sort(
    (a: any, b: any) => parseActivityDate(b).getTime() - parseActivityDate(a).getTime()
  );

  const consultedVehiclesMap = new Map<string, { vehicle: any; latestLead: any; count: number }>();

  sortedLeads.forEach((lead: any) => {
    let matchedVehicle: any = null;
    if (lead.vehicle_id) {
      matchedVehicle = vehicles.find((v: any) => v.id === lead.vehicle_id);
    }
    if (!matchedVehicle && lead.vehicle) {
      const vQuery = String(lead.vehicle).toLowerCase();
      matchedVehicle = vehicles.find(
        (v: any) =>
          `${v.brand} ${v.model}`.toLowerCase().includes(vQuery) ||
          vQuery.includes(`${v.brand} ${v.model}`.toLowerCase()) ||
          (v.model && vQuery.includes(String(v.model).toLowerCase()))
      );
    }
    if (matchedVehicle && !consultedVehiclesMap.has(matchedVehicle.id)) {
      const queryCount = leads.filter(
        (l: any) =>
          l.vehicle_id === matchedVehicle.id ||
          (l.vehicle && matchedVehicle.model && String(l.vehicle).toLowerCase().includes(String(matchedVehicle.model).toLowerCase()))
      ).length;

      consultedVehiclesMap.set(matchedVehicle.id, {
        vehicle: matchedVehicle,
        latestLead: lead,
        count: queryCount,
      });
    }
  });

  let consultedItems = Array.from(consultedVehiclesMap.values());
  if (consultedItems.length < 4) {
    const existingIds = new Set(consultedItems.map((item) => item.vehicle.id));
    const remaining = vehicles.filter((v: any) => !existingIds.has(v.id));
    for (const v of remaining) {
      if (consultedItems.length >= 4) break;
      consultedItems.push({
        vehicle: v,
        latestLead: null,
        count: 0,
      });
    }
  }

  const recentConsultedVehicles = consultedItems.slice(0, 4).map((item) => {
    const v = item.vehicle;
    return {
      id: v.id,
      brand: v.brand || "Marca",
      model: v.model || "Modelo",
      year: v.year || new Date().getFullYear(),
      price: Number(v.price) || 0,
      currency: v.currency || "$",
      status: v.status || "disponible",
      image: Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : null,
      latestLead: item.latestLead
        ? {
            name: item.latestLead.name || "Interesado",
            message: item.latestLead.message || "Consulta recibida",
            dateIso: parseActivityDate(item.latestLead).toISOString(),
            phone: item.latestLead.phone || "",
          }
        : null,
      queryCount: item.count,
    };
  });

  // Lead Activities List (top 5 leads)
  const leadActivitiesList = sortedLeads.slice(0, 5).map((l: any) => ({
    id: l.id,
    name: l.name || "Interesado Sin Nombre",
    email: l.email || "",
    phone: l.phone || "",
    vehicleName: l.vehicle || "Consulta General",
    message: l.message || "Interesado en vehículo.",
    status: l.status || "nuevo",
    dateIso: parseActivityDate(l).toISOString(),
  }));

  // Communication Feed (from inbox conversations or recent leads)
  let communicationFeedList = inbox.slice(0, 3).map((conv: any) => {
    const lastMsg = Array.isArray(conv.messages) && conv.messages.length > 0
      ? conv.messages[conv.messages.length - 1]
      : null;
    return {
      id: conv.id,
      channel: conv.channel || "whatsapp",
      senderName: conv.lead_name || conv.customer_name || "Cliente WhatsApp",
      vehicleName: conv.vehicle_name || conv.vehicle_title || "Vehículo",
      messageText: lastMsg ? (lastMsg.content || lastMsg.text || "Mensaje recibido") : "Consulta sobre vehículo",
      timeStr: lastMsg && lastMsg.timestamp
        ? new Date(lastMsg.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : "11:04 AM",
    };
  });

  if (communicationFeedList.length === 0) {
    communicationFeedList = sortedLeads.slice(0, 2).map((l: any) => ({
      id: `feed-${l.id}`,
      channel: "whatsapp",
      senderName: l.name || "Interesado",
      vehicleName: l.vehicle || "Vehículo",
      messageText: l.message || "Hola, me interesa coordinar una visita para ver el vehículo.",
      timeStr: new Date(parseActivityDate(l)).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }));
  }

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
    recentConsultedVehicles,
    leadActivitiesList,
    communicationFeedList,
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Dynamic Dashboard Grid with Widget Selection & Reordering */}
      <DashboardGrid data={metricsData} />
    </div>
  );
}
