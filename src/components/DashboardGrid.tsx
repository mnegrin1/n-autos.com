"use client";

import React, { useState, useEffect } from "react";
import styles from "@/app/admin/dashboard.module.css";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Calendar,
  Phone,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  Car
} from "lucide-react";

export interface DashboardActivityItem {
  id: string;
  type: "lead" | "consulta" | "agenda" | "venta";
  title: string;
  subtitle: string;
  message?: string;
  dateIso: string;
  badgeText: string;
  phone?: string;
  email?: string;
  channel?: string;
  link?: string;
}

export interface DayDataPoint {
  dateStr: string;
  count: number;
  amount?: number;
}

export interface DashboardMetricsData {
  leadsByDay: DayDataPoint[];
  salesByDay: DayDataPoint[];
  totalLeadsCount: number;
  totalSoldCount: number;
  recentActivities: DashboardActivityItem[];
}

// Generador de curva Bézier suave para trazado SVG
function createSmoothSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX1 = current.x + (next.x - current.x) * 0.45;
    const controlY1 = current.y;
    const controlX2 = current.x + (next.x - current.x) * 0.55;
    const controlY2 = next.y;
    d += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
  }
  return d;
}

// Formateador de tiempo relativo o legible
function formatActivityTime(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `Hace ${diffMins} min`;
    }
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Hoy ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) {
      return `Ayer ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Reciente";
  }
}

// Componente interactivo para gráfico de tendencias (Leads / Ventas)
function TrendChart({
  title,
  icon,
  data,
  accentColor,
  gradientId,
  metricLabel,
  totalCount,
  isCurrency = false,
}: {
  title: string;
  icon: React.ReactNode;
  data: DayDataPoint[];
  accentColor: string;
  gradientId: string;
  metricLabel: string;
  totalCount: number;
  isCurrency?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const svgWidth = 560;
  const svgHeight = 200;
  const padX = 36;
  const padTop = 32;
  const padBottom = 38;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartWidth = svgWidth - padX * 2;
  const baseY = svgHeight - padBottom;

  const maxVal = Math.max(...data.map((d) => d.count), 3);

  const points = data.map((item, idx) => {
    const x = padX + (idx / Math.max(data.length - 1, 1)) * chartWidth;
    const y = baseY - (item.count / maxVal) * chartHeight;
    return { x, y, item, idx };
  });

  const linePath = createSmoothSvgPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
    : "";

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartHeaderLeft}>
          <h2 className={styles.chartTitle}>
            {icon} {title}
          </h2>
          <p className={styles.chartSub}>Últimos 7 días con registro en tiempo real</p>
        </div>
        <div className={isCurrency ? styles.chartBadgeSales : styles.chartBadgeLeads}>
          {totalCount} {metricLabel}
        </div>
      </div>

      <div className={styles.chartSvgWrapper}>
        {activePoint && (
          <div className={styles.chartTooltip}>
            <strong>{activePoint.item.dateStr}:</strong> {activePoint.item.count} {metricLabel}
            {activePoint.item.amount && activePoint.item.amount > 0 && (
              <span> ({new Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(activePoint.item.amount)})</span>
            )}
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de referencia */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = baseY - ratio * chartHeight;
            return (
              <line
                key={idx}
                x1={padX}
                y1={y}
                x2={svgWidth - padX}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity={0.35}
              />
            );
          })}

          {/* Área degradada */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Línea curva principal */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos y etiquetas por día */}
          {points.map((p) => {
            const isHovered = hoveredIndex === p.idx;
            return (
              <g
                key={p.idx}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(p.idx)}
              >
                {/* Zona invisible táctil para fácil hover */}
                <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                {/* Número sobre el punto */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fill="var(--text-color)"
                  fontSize="0.75rem"
                  fontWeight={p.item.count > 0 ? "700" : "500"}
                  opacity={p.item.count > 0 || isHovered ? 1 : 0.4}
                >
                  {p.item.count}
                </text>

                {/* Punto indicador */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="var(--surface-color)"
                  stroke={accentColor}
                  strokeWidth={isHovered ? "3.5" : "2.5"}
                />

                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="11"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                )}

                {/* Etiqueta del día en el eje inferior */}
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fill="var(--text-color)"
                  fontSize="0.72rem"
                  fontWeight="600"
                  opacity={isHovered ? 1 : 0.65}
                  style={{ textTransform: "capitalize" }}
                >
                  {p.item.dateStr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function DashboardGrid({ data }: { data: DashboardMetricsData }) {
  const [filter, setFilter] = useState<"all" | "lead" | "consulta" | "agenda" | "venta">("all");
  const [displayLimit, setDisplayLimit] = useState<number>(6);
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setCurrentDateStr(
      now.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    );
  }, []);

  const totalLeadsPeriod = (data.leadsByDay || []).reduce((acc, d) => acc + d.count, 0);
  const totalSalesPeriod = (data.salesByDay || []).reduce((acc, d) => acc + d.count, 0);

  const activities = data.recentActivities || [];
  const leadsCount = activities.filter((a) => a.type === "lead").length;
  const consultasCount = activities.filter((a) => a.type === "consulta").length;
  const agendasCount = activities.filter((a) => a.type === "agenda").length;
  const ventasCount = activities.filter((a) => a.type === "venta").length;

  const filteredActivities = activities.filter((a) => {
    if (filter === "all") return true;
    return a.type === filter;
  });

  const visibleActivities = filteredActivities.slice(0, displayLimit);

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. TOP BANNER - FLOTANTE Y FIJO EN PANTALLA CON SCROLL */}
      <div className={styles.topBanner}>
        <div className={styles.bannerInfo}>
          <h1 className={styles.bannerTitle}>Dashboard General</h1>
          <p className={styles.bannerSub}>Resumen operativo de tu concesionario en tiempo real.</p>
        </div>

        <div className={styles.bannerStatusBadge}>
          <span className={styles.livePulseDot} />
          <span className={styles.liveText}>En tiempo real</span>
          {currentDateStr && (
            <>
              <span className={styles.bannerDivider}>•</span>
              <span className={styles.bannerDateText}>{currentDateStr}</span>
            </>
          )}
        </div>
      </div>

      {/* 2. FILA 1: LEADS EN EL TIEMPO | VENTAS EN EL TIEMPO */}
      <div className={styles.chartsRow}>
        <TrendChart
          title="Leads en el tiempo"
          icon={<Users size={18} style={{ color: "#3b82f6" }} />}
          data={data.leadsByDay || []}
          accentColor="#3b82f6"
          gradientId="leadsGradientSmooth"
          metricLabel="leads"
          totalCount={totalLeadsPeriod}
        />

        <TrendChart
          title="Ventas en el tiempo"
          icon={<DollarSign size={18} style={{ color: "#10b981" }} />}
          data={data.salesByDay || []}
          accentColor="#10b981"
          gradientId="salesGradientSmooth"
          metricLabel="ventas"
          totalCount={totalSalesPeriod}
          isCurrency={true}
        />
      </div>

      {/* 3. FILA 2: ACTIVIDAD RECIENTE EN FORMA DE LISTA: LEADS, CONSULTAS, AGENDAS Y VENTAS */}
      <section className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <div className={styles.activityTitleArea}>
            <h2 className={styles.activityTitle}>Actividad Reciente</h2>
            <p className={styles.activitySub}>Flujo cronológico: prospectos, consultas, agendas y ventas</p>
          </div>

          <div className={styles.activityFilters}>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === "all" ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setFilter("all");
                setDisplayLimit(6);
              }}
            >
              Todos ({activities.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === "lead" ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setFilter("lead");
                setDisplayLimit(6);
              }}
            >
              Leads ({leadsCount})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === "consulta" ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setFilter("consulta");
                setDisplayLimit(6);
              }}
            >
              Consultas ({consultasCount})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === "agenda" ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setFilter("agenda");
                setDisplayLimit(6);
              }}
            >
              Agendas ({agendasCount})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === "venta" ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setFilter("venta");
                setDisplayLimit(6);
              }}
            >
              Ventas ({ventasCount})
            </button>
          </div>
        </div>

        {visibleActivities.length === 0 ? (
          <div className={styles.emptyActivityState}>
            No hay actividades registradas en esta categoría.
          </div>
        ) : (
          <div className={styles.activityList}>
            {visibleActivities.map((act) => {
              const isLead = act.type === "lead";
              const isConsulta = act.type === "consulta";
              const isAgenda = act.type === "agenda";
              const isVenta = act.type === "venta";

              const badgeClass = isLead
                ? styles.badgeLead
                : isConsulta
                ? styles.badgeConsulta
                : isAgenda
                ? styles.badgeAgenda
                : styles.badgeVenta;

              const tagClass = isLead
                ? styles.tagLead
                : isConsulta
                ? styles.tagConsulta
                : isAgenda
                ? styles.tagAgenda
                : styles.tagVenta;

              const icon = isLead ? (
                <Users size={18} />
              ) : isConsulta ? (
                <MessageSquare size={18} />
              ) : isAgenda ? (
                <Calendar size={18} />
              ) : (
                <DollarSign size={18} />
              );

              const defaultLink = isLead
                ? "/admin/crm"
                : isConsulta
                ? "/admin/inbox"
                : isAgenda
                ? "/admin/agenda"
                : "/admin/vehicles";

              const linkHref = act.link || defaultLink;
              const linkText = isLead
                ? "Ver en CRM"
                : isConsulta
                ? "Ver en Inbox"
                : isAgenda
                ? "Ver en Agenda"
                : "Ver Vehículo";

              return (
                <div key={act.id} className={styles.activityItem}>
                  <div className={styles.activityItemLeft}>
                    <div className={`${styles.activityIconBadge} ${badgeClass}`}>
                      {icon}
                    </div>

                    <div className={styles.activityContent}>
                      <div className={styles.activityMainRow}>
                        <span className={`${styles.activityTypeTag} ${tagClass}`}>
                          {act.badgeText}
                        </span>
                        <span className={styles.activityName}>{act.title}</span>
                        <span className={styles.activityTime}>
                          <Clock size={12} style={{ display: "inline", marginRight: "4px", opacity: 0.7 }} />
                          {formatActivityTime(act.dateIso)}
                        </span>
                      </div>

                      <div className={styles.activitySubRow}>
                        {(isLead || isVenta) && <Car size={13} style={{ display: "inline", marginRight: "4px", opacity: 0.7 }} />}
                        {act.subtitle}
                      </div>

                      {act.message && (
                        <p className={styles.activityMessageSnippet}>
                          «{act.message}»
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.activityItemRight}>
                    {act.phone && (
                      <a
                        href={`https://wa.me/${act.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.waBtn}
                        title="Abrir chat de WhatsApp"
                      >
                        <Phone size={15} />
                      </a>
                    )}

                    <Link href={linkHref} className={styles.viewActionBtn}>
                      {linkText} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {filteredActivities.length > displayLimit ? (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={() => setDisplayLimit((prev) => prev + 6)}
              >
                Mostrar más ({filteredActivities.length - displayLimit} restantes)
              </button>
            ) : filteredActivities.length > 6 ? (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={() => setDisplayLimit(6)}
              >
                Mostrar menos
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
