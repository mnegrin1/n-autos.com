export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentUser } from "@/actions/authActions";
import { getVehicles, getAutoLeads, getInboxConversations } from "@/actions/autoActions";
import styles from "./dashboard.module.css";
import DashboardGrid, { DashboardMetricsData, DashboardActivityItem } from "@/components/DashboardGrid";

// Helper para parsear fechas de forma segura en leads, vehículos y eventos
function parseActivityDate(item: any): Date {
  if (item?.created_at) return new Date(item.created_at);
  if (item?.updated_at) return new Date(item.updated_at);
  const timeStr = item?.time || "";
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

  const [vehicles, leads, eventsRes, inbox] = await Promise.all([
    agencyId ? getVehicles(agencyId) : Promise.resolve([]),
    agencyId ? getAutoLeads(agencyId) : Promise.resolve([]),
    (supabaseAdmin.from("events") as any).select("*").eq("agency_id", agencyId),
    getInboxConversations(agencyId || undefined),
  ]);

  const events = eventsRes?.data || [];

  // Puntos de los últimos 7 días
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  // 1. Leads en el tiempo (últimos 7 días)
  const leadsByDay = last7Days.map((day) => {
    const count = leads.filter((lead: any) => {
      const leadDate = parseActivityDate(lead);
      return leadDate.toDateString() === day.toDateString();
    }).length;
    return {
      dateStr: day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      count,
    };
  });

  // 2. Ventas en el tiempo (últimos 7 días)
  const soldVehicles = vehicles.filter((v: any) => v.status === "vendido");
  const salesByDay = last7Days.map((day) => {
    const matched = soldVehicles.filter((v: any) => {
      const vDate = parseActivityDate(v);
      return vDate.toDateString() === day.toDateString();
    });
    return {
      dateStr: day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      count: matched.length,
      amount: matched.reduce((acc: number, v: any) => acc + (Number(v.price) || 0), 0),
    };
  });

  // 3. Actividad reciente en forma de lista: leads, consultas, agendas y ventas
  const leadActivities: DashboardActivityItem[] = leads.map((l: any) => ({
    id: `lead-${l.id}`,
    type: "lead",
    title: l.name || "Nuevo interesado",
    subtitle: l.vehicle ? `Interesado en ${l.vehicle}` : "Consulta general de inventario",
    message: l.message || undefined,
    dateIso: parseActivityDate(l).toISOString(),
    badgeText: "Lead",
    phone: l.phone || undefined,
    email: l.email || undefined,
    link: "/admin/crm",
  }));

  const consultationActivities: DashboardActivityItem[] = inbox.map((conv: any) => {
    const lastMsg = Array.isArray(conv.messages) && conv.messages.length > 0
      ? conv.messages[conv.messages.length - 1]
      : null;
    const msgContent = lastMsg ? (lastMsg.content || lastMsg.text || "") : "";
    return {
      id: `conv-${conv.id}`,
      type: "consulta",
      title: conv.lead_name || conv.customer_name || "Consulta de cliente",
      subtitle: conv.vehicle_name ? `Consulta por ${conv.vehicle_name}` : `Canal ${conv.channel || "WhatsApp"}`,
      message: msgContent || undefined,
      dateIso: conv.updated_at || conv.created_at || (lastMsg?.timestamp ? new Date(lastMsg.timestamp).toISOString() : new Date().toISOString()),
      badgeText: "Consulta",
      channel: conv.channel || "whatsapp",
      link: "/admin/inbox",
    };
  });

  const agendaActivities: DashboardActivityItem[] = events.map((e: any) => ({
    id: `event-${e.id}`,
    type: "agenda",
    title: e.title || "Cita agendada",
    subtitle: e.description || (e.event_type === "visita" ? "Visita / Test Drive en concesionario" : "Reunión de asesoramiento"),
    dateIso: e.event_date || e.created_at || new Date().toISOString(),
    badgeText: "Agenda",
    link: "/admin/agenda",
  }));

  const saleActivities: DashboardActivityItem[] = soldVehicles.map((v: any) => ({
    id: `sale-${v.id}`,
    type: "venta",
    title: `Venta: ${v.brand} ${v.model} (${v.year})`,
    subtitle: v.price
      ? `Concretada por ${v.currency || "USD"} ${Number(v.price).toLocaleString("es-UY")}`
      : "Vehículo entregado y registrado como vendido",
    dateIso: parseActivityDate(v).toISOString(),
    badgeText: "Venta",
    link: "/admin/vehicles",
  }));

  // Consolidar únicamente las 4 categorías solicitadas: leads, consultas, agendas y ventas
  const recentActivities: DashboardActivityItem[] = [
    ...leadActivities,
    ...consultationActivities,
    ...agendaActivities,
    ...saleActivities,
  ]
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
    .slice(0, 16);

  const totalLeadsCount = leads.length;
  const totalSoldCount = soldVehicles.length;

  const metricsData: DashboardMetricsData = {
    leadsByDay,
    salesByDay,
    totalLeadsCount,
    totalSoldCount,
    recentActivities,
  };

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid data={metricsData} />
    </div>
  );
}
