"use client";

import { useState, useEffect } from "react";
import { LandingClickMetrics, LandingClickEvent } from "@/lib/serverLandingClickStore";
import {
  MousePointerClick,
  RefreshCw,
  Download,
  Trash2,
  Calendar,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  PieChart,
  BarChart3,
  Clock
} from "lucide-react";

export default function SuperAdminClicksPage() {
  const [metrics, setMetrics] = useState<LandingClickMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");

  const fetchMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/landing-clicks", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error("Error al cargar métricas de clics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => {
      if (autoRefresh && !document.hidden) {
        fetchMetrics();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearMetrics = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas reiniciar y borrar el historial de clics registrados? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/landing-clicks", { method: "DELETE" });
      if (res.ok) {
        setActionMsg("✅ Historial de clics reiniciado correctamente.");
        setTimeout(() => setActionMsg(""), 4000);
        fetchMetrics(true);
      }
    } catch (e) {
      alert("Error al intentar reiniciar las métricas.");
    }
  };

  const handleExportCSV = () => {
    if (!metrics || !metrics.recentEvents || metrics.recentEvents.length === 0) {
      alert("No hay datos de clics disponibles para exportar.");
      return;
    }

    const headers = ["ID", "Fecha_Hora", "Boton_ID", "Texto_Boton", "Seccion", "Dispositivo", "URL_Pagina", "Referrer"];
    const rows = metrics.recentEvents.map((e) => [
      e.id,
      `"${new Date(e.timestamp || e.createdAt).toLocaleString("es-UY")}"`,
      `"${e.buttonId.replace(/"/g, '""')}"`,
      `"${e.buttonText.replace(/"/g, '""')}"`,
      `"${e.section.replace(/"/g, '""')}"`,
      e.deviceType,
      `"${e.pageUrl}"`,
      `"${e.referrer || ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `landing_clicks_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado de eventos recientes para la tabla
  const filteredEvents = (metrics?.recentEvents || []).filter((e) => {
    const matchesSearch =
      searchQuery === "" ||
      e.buttonText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.buttonId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.section.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection = selectedSectionFilter === "all" || e.section === selectedSectionFilter;
    const matchesDevice = selectedDeviceFilter === "all" || e.deviceType === selectedDeviceFilter;

    return matchesSearch && matchesSection && matchesDevice;
  });

  if (loading && !metrics) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-color)" }}>
        <RefreshCw size={36} className="spinning-icon" style={{ marginBottom: "1rem", color: "#3b82f6" }} />
        <p style={{ fontWeight: 600 }}>Cargando estadísticas de clics...</p>
      </div>
    );
  }

  const maxTimelineCount = Math.max(...(metrics?.timeline.map((t) => t.count) || [1]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <div style={{
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              padding: "0.4rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <MousePointerClick size={22} />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Estadísticas de Clics en Landing Page
            </h1>
          </div>
          <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0, fontSize: "0.9rem" }}>
            Medición de interacción de usuarios y conversión de llamados a la acción en <strong>n-autos.com</strong>
          </p>
        </div>

        {/* Acciones del Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Toggle Auto-refresh */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: autoRefresh ? "rgba(16, 185, 129, 0.1)" : "var(--surface-color)",
              color: autoRefresh ? "#10b981" : "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
            title={autoRefresh ? "Auto-actualización cada 10s activada" : "Activar auto-actualización"}
          >
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: autoRefresh ? "#10b981" : "#6b7280"
            }} />
            {autoRefresh ? "En Vivo (10s)" : "Pausado"}
          </button>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-color)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Actualizar
          </button>

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            <Download size={14} /> Exportar CSV
          </button>

          {/* Limpiar Métricas */}
          <button
            type="button"
            onClick={handleClearMetrics}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
            title="Reiniciar historial de clics"
          >
            <Trash2 size={14} /> Reset
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          color: "#10b981",
          padding: "0.85rem 1.25rem",
          borderRadius: "10px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem"
        }}>
          <CheckCircle2 size={18} /> {actionMsg}
        </div>
      )}

      {/* TARJETAS KPI TOP */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem"
      }}>
        {/* KPI 1: Clics Totales */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total de Clics
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
              <MousePointerClick size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.totalClicks || 0}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
            ● Captura continua en tiempo real
          </span>
        </div>

        {/* KPI 2: Clics Hoy */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Clics de Hoy
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.clicksToday || 0}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.6 }}>
            Registrados el día de hoy
          </span>
        </div>

        {/* KPI 3: Botón Más Clickeado */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              CTA Principal (Top 1)
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {metrics?.topButton ? metrics.topButton.buttonText : "Sin registros"}
          </div>
          {metrics?.topButton && (
            <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700 }}>
              {metrics.topButton.count} clics ({metrics.topButton.percentage}% del total)
            </span>
          )}
        </div>

        {/* KPI 4: Sección Más Popular */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sección Más Popular
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {metrics?.topSection ? metrics.topSection.section : "Sin registros"}
          </div>
          {metrics?.topSection && (
            <span style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 700 }}>
              {metrics.topSection.count} clics ({metrics.topSection.percentage}% de interacción)
            </span>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: LÍNEA DE TIEMPO & DESGLOSE POR DISPOSITIVO */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Gráfico de Línea de Tiempo (14 Días) */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Evolución de Clics (Últimos 14 Días)</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", opacity: 0.6 }}>Tendencia diaria de interacción en la landing</p>
            </div>
            <BarChart3 size={20} style={{ color: "#3b82f6" }} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "140px", paddingTop: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
            {metrics?.timeline.map((item, idx) => {
              const heightPercent = maxTimelineCount > 0 ? (item.count / maxTimelineCount) * 100 : 0;
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: item.count > 0 ? "#3b82f6" : "var(--text-color)", opacity: item.count > 0 ? 1 : 0.4 }}>
                    {item.count}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "24px",
                      height: `${Math.max(heightPercent, 4)}%`,
                      backgroundColor: item.count > 0 ? "#3b82f6" : "rgba(128,128,128,0.2)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease"
                    }}
                    title={`${item.displayDate}: ${item.count} clics`}
                  />
                  <span style={{ fontSize: "0.62rem", color: "var(--text-color)", opacity: 0.6, transform: "rotate(-30deg)", transformOrigin: "top left", whiteSpace: "nowrap" }}>
                    {item.displayDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por Dispositivo */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Dispositivos de los Usuarios</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", opacity: 0.6 }}>Desktop vs Mobile vs Tablet</p>
            </div>
            <PieChart size={20} style={{ color: "#10b981" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {metrics?.byDevice.map((dev) => {
              const icon =
                dev.deviceType === "mobile" ? (
                  <Smartphone size={18} color="#3b82f6" />
                ) : dev.deviceType === "tablet" ? (
                  <Tablet size={18} color="#f59e0b" />
                ) : (
                  <Monitor size={18} color="#10b981" />
                );

              const label =
                dev.deviceType === "mobile"
                  ? "Teléfono Móvil"
                  : dev.deviceType === "tablet"
                  ? "Tablet"
                  : "Escritorio (Desktop)";

              return (
                <div key={dev.deviceType} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <span>{dev.count} clics ({dev.percentage}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${dev.percentage}%`,
                        height: "100%",
                        backgroundColor: dev.deviceType === "mobile" ? "#3b82f6" : dev.deviceType === "tablet" ? "#f59e0b" : "#10b981",
                        borderRadius: "4px",
                        transition: "width 0.3s ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {(!metrics?.byDevice || metrics.byDevice.length === 0) && (
              <p style={{ fontSize: "0.85rem", opacity: 0.6, textAlign: "center", margin: "1rem 0" }}>
                Aún no hay clics registrados para clasificar dispositivos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: RANKING DE BOTONES / CTAs Y SECCIONES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Ranking de Botones */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Ranking de Botones & CTAs</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "360px", overflowY: "auto" }}>
            {metrics?.byButton.map((btn, i) => (
              <div key={btn.buttonId} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.6rem", borderRadius: "10px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, color: "#3b82f6", width: "20px" }}>#{i + 1}</span>
                    <strong style={{ color: "var(--text-color)" }}>{btn.buttonText}</strong>
                  </div>
                  <span style={{ fontWeight: 700, color: "#10b981", fontSize: "0.8rem" }}>
                    {btn.count} clics ({btn.percentage}%)
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", opacity: 0.6, backgroundColor: "rgba(0,0,0,0.06)", padding: "1px 6px", borderRadius: "4px" }}>
                    {btn.section} • ID: {btn.buttonId}
                  </span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "3px", overflow: "hidden", marginTop: "4px" }}>
                  <div style={{ width: `${btn.percentage}%`, height: "100%", backgroundColor: "#3b82f6", borderRadius: "3px" }} />
                </div>
              </div>
            ))}

            {(!metrics?.byButton || metrics.byButton.length === 0) && (
              <p style={{ fontSize: "0.85rem", opacity: 0.6, textAlign: "center", margin: "1rem 0" }}>
                Sin registros de botones clickeados aún.
              </p>
            )}
          </div>
        </div>

        {/* Clics por Sección de Landing */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Interacción por Sección de la Landing</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {metrics?.bySection.map((sec) => (
              <div key={sec.section} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.6rem", borderRadius: "10px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                  <span>{sec.section}</span>
                  <span style={{ color: "#8b5cf6" }}>{sec.count} clics ({sec.percentage}%)</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "3px", overflow: "hidden", marginTop: "4px" }}>
                  <div style={{ width: `${sec.percentage}%`, height: "100%", backgroundColor: "#8b5cf6", borderRadius: "3px" }} />
                </div>
              </div>
            ))}

            {(!metrics?.bySection || metrics.bySection.length === 0) && (
              <p style={{ fontSize: "0.85rem", opacity: 0.6, textAlign: "center", margin: "1rem 0" }}>
                Sin registros de secciones aún.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: TABLA DE EVENTOS RECIENTES CON BUSCADOR Y FILTROS */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        padding: "1.5rem",
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Historial de Eventos de Clics</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", opacity: 0.6 }}>Registro en tiempo real de cada interacción realizada en la landing</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar por botón o sección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "inherit",
                  fontSize: "0.82rem"
                }}
              />
            </div>

            {/* Filtro por Sección */}
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "inherit",
                fontSize: "0.82rem"
              }}
            >
              <option value="all">Todas las Secciones</option>
              {metrics?.bySection.map((s) => (
                <option key={s.section} value={s.section}>
                  {s.section}
                </option>
              ))}
            </select>

            {/* Filtro por Dispositivo */}
            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "inherit",
                fontSize: "0.82rem"
              }}
            >
              <option value="all">Todos los Dispositivos</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {filteredEvents.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", opacity: 0.6 }}>
            <Clock size={40} style={{ marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No hay eventos de clics que coincidan con los filtros.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", opacity: 0.7 }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Fecha & Hora</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Botón / CTA Clickeado</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Sección</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Dispositivo</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Página / Referrer</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => {
                  const formattedDate = new Date(evt.timestamp || evt.createdAt).toLocaleString("es-UY", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  return (
                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600 }}>{formattedDate}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-color)" }}>{evt.buttonText}</div>
                        <span style={{ fontSize: "0.72rem", opacity: 0.6, fontFamily: "monospace" }}>ID: {evt.buttonId}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          color: "#3b82f6"
                        }}>
                          {evt.section}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textTransform: "capitalize"
                        }}>
                          {evt.deviceType === "mobile" ? <Smartphone size={14} color="#3b82f6" /> : evt.deviceType === "tablet" ? <Tablet size={14} color="#f59e0b" /> : <Monitor size={14} color="#10b981" />}
                          {evt.deviceType}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", opacity: 0.8, fontSize: "0.78rem" }}>
                        <div>{evt.pageUrl}</div>
                        {evt.referrer && <div style={{ opacity: 0.6 }}>Ref: {evt.referrer}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
