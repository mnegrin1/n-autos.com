export const dynamic = "force-dynamic";

import { getDb } from "@/lib/localDb";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { Car, Users, TrendingUp, Calendar, Clock } from "lucide-react";

// Helper to parse dates/times safely
function parseActivityDate(item: any) {
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

export default function AutoAdminDashboard() {
  const db = getDb();
  const vehicles = db.vehicles || [];
  const leads = db.auto_leads || [];
  const events = db.events || []; // shared events table

  // Operative KPIs
  const stockCount = vehicles.filter((v: any) => v.status === "disponible").length;
  const activeLeads = leads.filter((l: any) => l.status !== "cerrado").length;
  const reservedCount = vehicles.filter((v: any) => v.status === "reservado").length;
  const soldCount = vehicles.filter((v: any) => v.status === "vendido").length;

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

  const maxCount = Math.max(...leadsByDay.map(d => d.count), 1);
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = 110;

  const points = leadsByDay.map((day, i) => {
    const x = paddingX + i * (chartWidth / (leadsByDay.length - 1));
    const y = 140 - (day.count / maxCount) * chartHeight;
    return { x, y, day, count: day.count };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`;

  // Brand Distribution
  const brands = vehicles.reduce((acc: any, v: any) => {
    acc[v.brand] = (acc[v.brand] || 0) + 1;
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
    id: v.id,
    type: "vehicle",
    text: `Vehículo registrado en inventario: ${v.brand} ${v.model} (${v.year})`,
    date: parseActivityDate(v),
    badgeClass: styles.badgeProperty,
    badgeText: "Vehículo"
  }));

  const leadActivities = leads.map((l: any) => ({
    id: l.id,
    type: "lead",
    text: `Nuevo interesado recibido: "${l.name}" por el modelo "${l.vehicle}"`,
    date: parseActivityDate(l),
    badgeClass: styles.badgeLead,
    badgeText: "Interesado"
  }));

  const eventActivities = events.map((e: any) => ({
    id: e.id,
    type: "event",
    text: `Test Drive / Reunión agendada: "${e.title}"`,
    date: parseActivityDate(e),
    badgeClass: styles.badgeEvent,
    badgeText: "Agenda"
  }));

  const recentActivities = [...vehicleActivities, ...leadActivities, ...eventActivities]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Header */}
      <header className={styles.header}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>Dashboard General</h1>
        <p style={{ margin: "0.25rem 0 0 0", opacity: 0.7 }}>Resumen operativo de tu concesionario en tiempo real.</p>
      </header>

      {/* KPI statsGrid */}
      <div className={styles.statsGrid}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className={styles.statTitle}>Vehículos Disponibles</h3>
          <p className={styles.statValue}>{stockCount}</p>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className={styles.statTitle}>Leads Activos</h3>
          <p className={styles.statValue}>{activeLeads}</p>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className={styles.statTitle}>Unidades Reservadas</h3>
          <p className={styles.statValue}>{reservedCount}</p>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 className={styles.statTitle}>Ventas / Entregados</h3>
          <p className={styles.statValue}>{soldCount}</p>
        </div>
      </div>

      {/* Analysis Section (Charts) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        
        {/* Chart 1: Leads Trend */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Prospectos en el Tiempo</h3>
          <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1.5rem", margin: 0 }}>Interesados nuevos recibidos por día (últimos 7 días)</p>
          
          <div style={{ width: "100%", height: "180px", position: "relative" }}>
            <svg
              viewBox="0 0 600 180"
              width="100%"
              height="100%"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="stripeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = 140 - ratio * chartHeight;
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={600 - paddingX}
                    y2={y}
                    stroke="var(--border-color)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity={0.25}
                  />
                );
              })}
              
              {/* Area & Line paths */}
              <path d={areaPath} fill="url(#stripeGradient)" />
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fill="var(--text-color)"
                    fontSize="0.8rem"
                    fontWeight="700"
                    opacity={p.count > 0 ? 1 : 0.4}
                  >
                    {p.count}
                  </text>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="var(--surface-color)"
                    stroke="var(--primary)"
                    strokeWidth="3"
                  />
                  <text
                    x={p.x}
                    y={168}
                    textAnchor="middle"
                    fill="var(--text-color)"
                    fontSize="0.75rem"
                    fontWeight="600"
                    opacity={0.6}
                    style={{ textTransform: "capitalize" }}
                  >
                    {p.day.dateStr}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart 2: Brand Distribution */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Inventario por Marca</h3>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: "180px", padding: "1rem 0" }}>
            {brandList.length === 0 ? (
              <div className={styles.emptyState}>No hay marcas registradas</div>
            ) : (
              brandList.slice(0, 4).map((brand) => {
                const maxPercent = Math.max(...brandList.map(b => b.count), 1);
                const barHeightPct = (brand.count / maxPercent) * 100;
                return (
                  <div key={brand.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{brand.count}</span>
                    <div style={{ width: "24px", height: "120px", backgroundColor: "var(--border-color)", borderRadius: "6px", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                      <div style={{ width: "100%", height: `${barHeightPct}%`, backgroundColor: "var(--primary)", borderRadius: "4px", transition: "height 0.5s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "80px" }}>{brand.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className={styles.recentActivity} style={{ marginTop: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 700 }}>Actividad Reciente</h3>
          {recentActivities.length === 0 ? (
            <div className={styles.emptyState}>No hay actividad reciente registrada.</div>
          ) : (
            <div className={styles.activityList}>
              {recentActivities.map((act, idx) => (
                <div key={idx} className={styles.activityItem}>
                  <div className={styles.activityLeft}>
                    <span className={`${styles.activityBadge} ${act.badgeClass}`}>
                      {act.badgeText}
                    </span>
                    <span className={styles.activityText}>{act.text}</span>
                  </div>
                  <span className={styles.activityDate}>
                    {act.date.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
