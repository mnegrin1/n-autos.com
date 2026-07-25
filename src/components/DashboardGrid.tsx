"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "@/app/admin/dashboard.module.css";
import Link from "next/link";
import {
  GripVertical,
  RotateCcw,
  Car,
  Users,
  Mail,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  EyeOff
} from "lucide-react";

export interface DashboardMetricsData {
  stockCount: number;
  newLeadsCount: number;
  activeLeadsCount: number;
  totalEmailsSent: number;
  reservedCount: number;
  soldCount: number;
  eventsCount: number;
  leadsByDay: Array<{ dateStr: string; count: number }>;
  brandList: Array<{ name: string; count: number; percentage: number }>;
  recentActivities: Array<{
    id: string;
    type: string;
    text: string;
    dateIso: string;
    badgeClass: string;
    badgeText: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    description?: string;
  }>;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  category: "kpi" | "chart" | "list";
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetDefinition[] = [
  { id: "kpi-leads-nuevos", title: "Leads Nuevos", category: "kpi", visible: true, order: 0 },
  { id: "kpi-stock", title: "Vehículos Disponibles", category: "kpi", visible: true, order: 1 },
  { id: "kpi-emails", title: "Emails Enviados", category: "kpi", visible: true, order: 2 },
  { id: "kpi-leads-activos", title: "Leads Activos", category: "kpi", visible: true, order: 3 },
  { id: "kpi-reservas-ventas", title: "Reservas y Ventas", category: "kpi", visible: true, order: 4 },
  { id: "kpi-eventos", title: "Citas Agendadas", category: "kpi", visible: true, order: 5 },
  { id: "chart-leads-trend", title: "Prospectos en el Tiempo", category: "chart", visible: true, order: 6 },
  { id: "chart-brands", title: "Inventario por Marca", category: "chart", visible: true, order: 7 },
  { id: "list-activity", title: "Actividad Reciente", category: "list", visible: true, order: 8 },
  { id: "list-upcoming-events", title: "Próximos Eventos y Agenda", category: "list", visible: true, order: 9 },
];

const STORAGE_KEY = "nautos_dashboard_widgets_v3";

export default function DashboardGrid({ data }: { data: DashboardMetricsData }) {
  const [widgets, setWidgets] = useState<WidgetDefinition[]>(DEFAULT_WIDGETS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Array<{ id: string; visible: boolean; order: number }> = JSON.parse(saved);
        setWidgets((prev) => {
          const updated = prev.map((w) => {
            const match = parsed.find((p) => p.id === w.id);
            if (match) {
              return { ...w, visible: match.visible, order: match.order };
            }
            return w;
          });
          return updated.sort((a, b) => a.order - b.order);
        });
      }
    } catch (e) {
      console.warn("Could not parse saved dashboard preferences:", e);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const savePreferences = (newWidgets: WidgetDefinition[]) => {
    setWidgets(newWidgets);
    try {
      const toSave = newWidgets.map((w) => ({
        id: w.id,
        visible: w.visible,
        order: w.order,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Could not save dashboard preferences:", e);
    }
  };

  const toggleWidgetVisibility = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    savePreferences(updated);
  };

  const resetToDefault = () => {
    savePreferences(DEFAULT_WIDGETS);
  };

  // Reordering functions
  const moveWidget = (id: string, direction: "up" | "down") => {
    const visibleWidgets = [...widgets].sort((a, b) => a.order - b.order);
    const index = visibleWidgets.findIndex((w) => w.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visibleWidgets.length) return;

    const currentOrder = visibleWidgets[index].order;
    const targetOrder = visibleWidgets[targetIndex].order;

    visibleWidgets[index].order = targetOrder;
    visibleWidgets[targetIndex].order = currentOrder;

    const reordered = visibleWidgets.sort((a, b) => a.order - b.order);
    savePreferences(reordered);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverWidgetId(null);

    const sourceId = e.dataTransfer.getData("text/plain") || draggedWidgetId;
    if (!sourceId || sourceId === targetId) return;

    const list = [...widgets].sort((a, b) => a.order - b.order);
    const sourceIndex = list.findIndex((w) => w.id === sourceId);
    const targetIndex = list.findIndex((w) => w.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const [draggedItem] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, draggedItem);

    const updated = list.map((item, idx) => ({ ...item, order: idx }));
    savePreferences(updated);
    setDraggedWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);
  const kpiWidgets = visibleWidgets.filter((w) => w.category === "kpi");
  const nonKpiWidgets = visibleWidgets.filter((w) => w.category !== "kpi");

  // Chart math calculations
  const maxCount = Math.max(...data.leadsByDay.map((d) => d.count), 1);
  const svgWidth = 600;
  const paddingX = 40;
  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = 110;

  const points = data.leadsByDay.map((day, i) => {
    const x = paddingX + i * (chartWidth / (data.leadsByDay.length - 1 || 1));
    const y = 140 - (day.count / maxCount) * chartHeight;
    return { x, y, day, count: day.count };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` : "";

  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case "kpi-leads-nuevos":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--primary)" }}>
                <Users size={20} />
              </span>
              <span className={styles.statTitle}>Leads Nuevos</span>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.statValue}>{data.newLeadsCount}</p>
              <span className={styles.kpiBadgeSuccess}>
                <Sparkles size={12} /> Estado Nuevo
              </span>
            </div>
          </div>
        );

      case "kpi-stock":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                <Car size={20} />
              </span>
              <span className={styles.statTitle}>Vehículos Disponibles</span>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.statValue}>{data.stockCount}</p>
              <span className={styles.kpiSubtext}>Disponibles en catálogo</span>
            </div>
          </div>
        );

      case "kpi-emails":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                <Mail size={20} />
              </span>
              <span className={styles.statTitle}>Emails Enviados</span>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.statValue}>{data.totalEmailsSent}</p>
              <span className={styles.kpiSubtext}>Broadcasts y mensajes</span>
            </div>
          </div>
        );

      case "kpi-leads-activos":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                <Activity size={20} />
              </span>
              <span className={styles.statTitle}>Leads Activos</span>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.statValue}>{data.activeLeadsCount}</p>
              <span className={styles.kpiSubtext}>En seguimiento de venta</span>
            </div>
          </div>
        );

      case "kpi-reservas-ventas":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}>
                <TrendingUp size={20} />
              </span>
              <span className={styles.statTitle}>Reservas / Ventas</span>
            </div>
            <div className={styles.kpiBody}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--warning)" }}>{data.reservedCount}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "4px" }}>Res.</span>
                </div>
                <span style={{ opacity: 0.3 }}>/</span>
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>{data.soldCount}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "4px" }}>Vend.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "kpi-eventos":
        return (
          <div className={styles.kpiInner}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiIcon} style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
                <Calendar size={20} />
              </span>
              <span className={styles.statTitle}>Citas Agendadas</span>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.statValue}>{data.eventsCount}</p>
              <span className={styles.kpiSubtext}>Test drives y reuniones</span>
            </div>
          </div>
        );

      case "chart-leads-trend":
        return (
          <div style={{ width: "100%" }}>
            <div className={styles.cardHeaderArea}>
              <h3 className={styles.widgetTitle}>Prospectos en el Tiempo</h3>
              <span className={styles.cardHeaderBadge}>
                <TrendingUp size={14} /> 7 Días
              </span>
            </div>

            <div style={{ width: "100%", height: "180px", position: "relative", marginTop: "0.5rem" }}>
              <svg viewBox="0 0 600 180" width="100%" height="100%" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="stripeGradientCustomSimple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

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
                      opacity={0.3}
                    />
                  );
                })}

                <path d={areaPath} fill="url(#stripeGradientCustomSimple)" />
                <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

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
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--surface-color)" stroke="var(--primary)" strokeWidth="3" />
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
        );

      case "chart-brands":
        return (
          <div style={{ width: "100%" }}>
            <div className={styles.cardHeaderArea}>
              <h3 className={styles.widgetTitle}>Inventario por Marca</h3>
              <span className={styles.cardHeaderBadge}>
                <Car size={14} /> Marcas
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: "180px", padding: "1rem 0" }}>
              {data.brandList.length === 0 ? (
                <div className={styles.emptyState}>No hay marcas registradas</div>
              ) : (
                data.brandList.slice(0, 5).map((brand) => {
                  const maxPercent = Math.max(...data.brandList.map((b) => b.count), 1);
                  const barHeightPct = (brand.count / maxPercent) * 100;
                  return (
                    <div key={brand.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{brand.count}</span>
                      <div
                        style={{
                          width: "24px",
                          height: "120px",
                          backgroundColor: "var(--border-color)",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "flex-end",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: `${barHeightPct}%`,
                            backgroundColor: "var(--primary)",
                            borderRadius: "4px",
                            transition: "height 0.5s ease",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          opacity: 0.8,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          maxWidth: "75px",
                        }}
                      >
                        {brand.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case "list-activity":
        return (
          <div style={{ width: "100%" }}>
            <div className={styles.cardHeaderArea}>
              <h3 className={styles.widgetTitle}>Actividad Reciente</h3>
              <span className={styles.cardHeaderBadge}>
                <Clock size={14} /> Movimientos
              </span>
            </div>

            {data.recentActivities.length === 0 ? (
              <div className={styles.emptyState}>No hay actividad reciente registrada.</div>
            ) : (
              <div className={styles.activityList}>
                {data.recentActivities.map((act, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div className={styles.activityLeft}>
                      <span className={`${styles.activityBadge} ${act.badgeClass}`}>{act.badgeText}</span>
                      <span className={styles.activityText}>{act.text}</span>
                    </div>
                    <span className={styles.activityDate}>
                      {new Date(act.dateIso).toLocaleDateString("es-ES", {
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
        );

      case "list-upcoming-events":
        return (
          <div style={{ width: "100%" }}>
            <div className={styles.cardHeaderArea}>
              <h3 className={styles.widgetTitle}>Próximos Eventos y Agenda</h3>
              <Link href="/admin/calendar" className={styles.cardHeaderLink}>
                Ver Agenda <ArrowRight size={14} />
              </Link>
            </div>

            {data.upcomingEvents.length === 0 ? (
              <div className={styles.emptyState}>No hay eventos agendados.</div>
            ) : (
              <div className={styles.eventsList}>
                {data.upcomingEvents.map((evt) => (
                  <div key={evt.id} className={styles.eventCardItem}>
                    <div className={styles.eventItemIcon}>
                      <Calendar size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>{evt.title}</h4>
                        <span className={styles.eventTypeTag}>{evt.event_type || "Cita"}</span>
                      </div>
                      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
                        {new Date(evt.event_date).toLocaleString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardGridContainer}>
      {/* Top Banner section */}
      <div className={styles.topBanner}>
        <div>
          <h1 className={styles.bannerTitle}>Dashboard General</h1>
          <p className={styles.bannerSub}>Resumen operativo de tu concesionario en tiempo real.</p>
        </div>

        {/* Action Link as Plain Text with hover highlight */}
        <div className={styles.actionControlsArea} ref={dropdownRef}>
          <button
            type="button"
            className={styles.plainTextAction}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Mostrar métricas ({visibleWidgets.length}/{widgets.length})
          </button>
          
          <span style={{ opacity: 0.35 }}>|</span>

          <button
            type="button"
            className={styles.plainTextActionReset}
            onClick={resetToDefault}
            title="Restablecer orden"
          >
            Restablecer orden
          </button>

          {/* Simple Dropdown List with Checkboxes (No descriptions, KISS) */}
          {showDropdown && (
            <div className={styles.simpleChecklistDropdown}>
              <div className={styles.dropdownHeader}>
                <span>Métricas a mostrar</span>
              </div>
              <div className={styles.checklistList}>
                {widgets.map((w) => (
                  <label key={w.id} className={styles.checkItemLabel}>
                    <input
                      type="checkbox"
                      checked={w.visible}
                      onChange={() => toggleWidgetVisibility(w.id)}
                      className={styles.checkboxInput}
                    />
                    <span className={styles.checkItemText}>{w.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      {visibleWidgets.length === 0 ? (
        <div className={styles.emptyGridPlaceholder}>
          <p>No hay métricas seleccionadas.</p>
          <button
            type="button"
            className={styles.plainTextAction}
            onClick={() => setShowDropdown(true)}
          >
            Mostrar métricas
          </button>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          {kpiWidgets.length > 0 && (
            <div className={styles.kpiGrid}>
              {kpiWidgets.map((w) => {
                const isDragging = draggedWidgetId === w.id;
                const isOver = dragOverWidgetId === w.id;
                return (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, w.id)}
                    onDragOver={(e) => handleDragOver(e, w.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, w.id)}
                    onDragEnd={handleDragEnd}
                    className={`card ${styles.widgetCard} ${isDragging ? styles.isDragging : ""} ${isOver ? styles.isDragOver : ""}`}
                  >
                    <div className={styles.widgetHeaderControls}>
                      <span className={styles.dragHandle} title="Arrastrar para mover">
                        <GripVertical size={15} />
                      </span>
                      <div className={styles.widgetActionButtons}>
                        <button
                          onClick={() => moveWidget(w.id, "up")}
                          className={styles.miniIconButton}
                          title="Mover"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveWidget(w.id, "down")}
                          className={styles.miniIconButton}
                          title="Mover"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          onClick={() => toggleWidgetVisibility(w.id)}
                          className={styles.miniIconButton}
                          title="Ocultar"
                        >
                          <EyeOff size={13} />
                        </button>
                      </div>
                    </div>
                    {renderWidgetContent(w.id)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Charts & Lists Grid */}
          {nonKpiWidgets.length > 0 && (
            <div className={styles.mainContentGrid}>
              {nonKpiWidgets.map((w) => {
                const isDragging = draggedWidgetId === w.id;
                const isOver = dragOverWidgetId === w.id;
                const isFullWidth = w.id === "list-activity" || w.id === "list-upcoming-events";

                return (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, w.id)}
                    onDragOver={(e) => handleDragOver(e, w.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, w.id)}
                    onDragEnd={handleDragEnd}
                    className={`card ${styles.widgetCard} ${isFullWidth ? styles.fullWidthCard : ""} ${
                      isDragging ? styles.isDragging : ""
                    } ${isOver ? styles.isDragOver : ""}`}
                  >
                    <div className={styles.widgetHeaderControls}>
                      <span className={styles.dragHandle} title="Arrastrar para mover">
                        <GripVertical size={15} />
                      </span>
                      <div className={styles.widgetActionButtons}>
                        <button
                          onClick={() => moveWidget(w.id, "up")}
                          className={styles.miniIconButton}
                          title="Mover arriba"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveWidget(w.id, "down")}
                          className={styles.miniIconButton}
                          title="Mover abajo"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          onClick={() => toggleWidgetVisibility(w.id)}
                          className={styles.miniIconButton}
                          title="Ocultar"
                        >
                          <EyeOff size={13} />
                        </button>
                      </div>
                    </div>
                    {renderWidgetContent(w.id)}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
