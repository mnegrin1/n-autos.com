"use client";

import { useState, useEffect } from "react";
import { LandingClickMetrics, LandingTrackingEvent } from "@/lib/serverLandingClickStore";
import {
  MousePointerClick,
  Eye,
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
  Clock,
  Globe,
  Share2,
  Activity,
  ArrowUpRight,
  Inbox
} from "lucide-react";
import Link from "next/link";

export default function SuperAdminClicksPage() {
  const [metrics, setMetrics] = useState<LandingClickMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [daysRange, setDaysRange] = useState<number>(14);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");

  const fetchMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/landing-clicks?days=${daysRange}&refresh=true`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error("Error al cargar métricas de la landing:", e);
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
    }, 8000);

    return () => clearInterval(interval);
  }, [autoRefresh, daysRange]);

  const handleClearMetrics = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas reiniciar y borrar el historial de analíticas de la landing? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/landing-clicks", { method: "DELETE" });
      if (res.ok) {
        setActionMsg("✅ Historial de analíticas reiniciado correctamente.");
        setTimeout(() => setActionMsg(""), 4000);
        fetchMetrics(true);
      }
    } catch (e) {
      alert("Error al intentar reiniciar las métricas.");
    }
  };

  const handleExportCSV = () => {
    if (!metrics || !metrics.recentEvents || metrics.recentEvents.length === 0) {
      alert("No hay datos analíticos disponibles para exportar.");
      return;
    }

    const headers = [
      "ID",
      "Tipo_Evento",
      "Fecha_Hora",
      "Elemento_Boton_ID",
      "Texto_Accion",
      "Seccion",
      "Dispositivo",
      "URL_Pagina",
      "Referrer_Fuente",
      "Campana_UTM"
    ];

    const rows = metrics.recentEvents.map((e) => [
      e.id,
      e.eventType || "click",
      `"${new Date(e.timestamp || e.createdAt).toLocaleString("es-UY")}"`,
      `"${(e.buttonId || "").replace(/"/g, '""')}"`,
      `"${(e.buttonText || "").replace(/"/g, '""')}"`,
      `"${(e.section || "").replace(/"/g, '""')}"`,
      e.deviceType,
      `"${e.pageUrl || "/"}"`,
      `"${(e.referrer || "").replace(/"/g, '""')}"`,
      `"${(e.utmSource || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `landing_analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado de eventos para la tabla
  const filteredEvents = (metrics?.recentEvents || []).filter((e) => {
    const typeMatches =
      eventTypeFilter === "all" ||
      (eventTypeFilter === "pageview" && e.eventType === "pageview") ||
      (eventTypeFilter === "click" && (e.eventType === "click" || !e.eventType)) ||
      (eventTypeFilter === "conversion" && e.eventType === "conversion");

    const matchesSearch =
      searchQuery === "" ||
      (e.buttonText && e.buttonText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.buttonId && e.buttonId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.section && e.section.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.pageUrl && e.pageUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.referrer && e.referrer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSection = selectedSectionFilter === "all" || e.section === selectedSectionFilter;
    const matchesDevice = selectedDeviceFilter === "all" || e.deviceType === selectedDeviceFilter;

    return typeMatches && matchesSearch && matchesSection && matchesDevice;
  });

  if (loading && !metrics) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-color)" }}>
        <RefreshCw size={36} className="spinning-icon" style={{ marginBottom: "1rem", color: "#3b82f6" }} />
        <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Cargando analíticas en vivo de n-autos.com...</p>
      </div>
    );
  }

  const maxTimelineCount = Math.max(
    ...(metrics?.timeline.map((t) => Math.max(t.visits, t.clicks, t.conversions)) || [1]),
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <div style={{
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              padding: "0.45rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Activity size={22} />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Estadísticas de la Landing Page
            </h1>
          </div>
          <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0, fontSize: "0.9rem" }}>
            Tráfico en tiempo real, interacción con llamados a la acción (CTAs) y conversiones en <strong>n-autos.com</strong>
          </p>
        </div>

        {/* Acciones del Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Selector de Rango de Días */}
          <div style={{ display: "flex", backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "2px" }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysRange(d)}
                style={{
                  padding: "0.4rem 0.65rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: daysRange === d ? "var(--primary)" : "transparent",
                  color: daysRange === d ? "#ffffff" : "var(--text-color)"
                }}
              >
                {d}d
              </button>
            ))}
          </div>

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
            title={autoRefresh ? "Auto-actualización cada 8s activada" : "Activar auto-actualización"}
          >
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: autoRefresh ? "#10b981" : "#6b7280"
            }} />
            {autoRefresh ? "En Vivo (8s)" : "Pausado"}
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
            title="Reiniciar historial de eventos"
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
        {/* KPI 1: Visitas Totales */}
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
              Visitas a la Landing
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.totalVisits || 0}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 700 }}>
            {metrics?.visitsToday || 0} visitas hoy
          </span>
        </div>

        {/* KPI 2: Clics en CTAs */}
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
              Clics en Botones / CTAs
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
              <MousePointerClick size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.totalClicks || 0}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 700 }}>
            {metrics?.clicksToday || 0} clics hoy
          </span>
        </div>

        {/* KPI 3: Tasa de Interacción (CTR) */}
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
              Tasa de Clics (CTR)
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.ctr || 0}%
          </div>
          <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700 }}>
            Ratio de clics sobre visitantes
          </span>
        </div>

        {/* KPI 4: Conversiones / Leads */}
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
              Consultas / Conversión
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-color)" }}>
            {metrics?.totalConversions || 0}
          </div>
          <Link href="/superadmin/requests" style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
            Ver Consultas Recibidas <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* SECCIÓN 2: LÍNEA DE TIEMPO DIARIA (VISITAS VS CLICS) */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        padding: "1.5rem",
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Evolución Temporal ({daysRange} Días)</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.6 }}>Comparación de volumen diario de Visitas vs Clics en la landing</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.82rem", fontWeight: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#6366f1" }} />
              <span>Visitas</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
              <span>Clics CTAs</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
              <span>Leads</span>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: daysRange === 30 ? "0.25rem" : "0.5rem",
          height: "170px",
          paddingTop: "1.5rem",
          borderBottom: "1px solid var(--border-color)",
          overflowX: "auto"
        }}>
          {metrics?.timeline.map((item, idx) => {
            const visitHeight = maxTimelineCount > 0 ? (item.visits / maxTimelineCount) * 100 : 0;
            const clickHeight = maxTimelineCount > 0 ? (item.clicks / maxTimelineCount) * 100 : 0;

            return (
              <div key={idx} style={{ flex: 1, minWidth: daysRange === 30 ? "18px" : "26px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "100%", width: "100%", justifyContent: "center" }}>
                  {/* Barra de Visitas */}
                  <div
                    style={{
                      width: "45%",
                      maxWidth: "14px",
                      height: `${Math.max(visitHeight, item.visits > 0 ? 6 : 2)}%`,
                      backgroundColor: item.visits > 0 ? "#6366f1" : "rgba(128,128,128,0.15)",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s ease"
                    }}
                    title={`${item.displayDate}: ${item.visits} visitas`}
                  />
                  {/* Barra de Clics */}
                  <div
                    style={{
                      width: "45%",
                      maxWidth: "14px",
                      height: `${Math.max(clickHeight, item.clicks > 0 ? 6 : 2)}%`,
                      backgroundColor: item.clicks > 0 ? "#3b82f6" : "rgba(128,128,128,0.15)",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s ease"
                    }}
                    title={`${item.displayDate}: ${item.clicks} clics`}
                  />
                </div>
                <span style={{ fontSize: "0.62rem", color: "var(--text-color)", opacity: 0.6, transform: "rotate(-35deg)", transformOrigin: "top left", whiteSpace: "nowrap" }}>
                  {item.displayDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: RANKINGS Y DESGLOSES (GRID 4 PANELES) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Panel 1: Ranking de Botones / CTAs */}
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
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Ranking de Botones & CTAs</h3>
            <Flame size={18} style={{ color: "#f59e0b" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
            {metrics?.byButton.map((btn, i) => (
              <div key={btn.buttonId} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.65rem", borderRadius: "10px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, overflow: "hidden" }}>
                    <span style={{ fontWeight: 800, color: "#3b82f6", width: "20px" }}>#{i + 1}</span>
                    <strong style={{ color: "var(--text-color)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {btn.buttonText}
                    </strong>
                  </div>
                  <span style={{ fontWeight: 700, color: "#10b981", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
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

        {/* Panel 2: Desglose por Dispositivo */}
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
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Dispositivos de los Usuarios</h3>
            <PieChart size={18} style={{ color: "#10b981" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
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
                  ? "Teléfono Móvil (Smartphones)"
                  : dev.deviceType === "tablet"
                  ? "Tablet"
                  : "Escritorio (PC / Laptop)";

              return (
                <div key={dev.deviceType} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {icon}
                      <span>{label}</span>
                    </div>
                    <span>{dev.count} ({dev.percentage}%)</span>
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
                Aún no hay interacciones para clasificar dispositivos.
              </p>
            )}
          </div>
        </div>

        {/* Panel 3: Páginas Más Vistas */}
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
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Páginas con Mayor Tráfico</h3>
            <Globe size={18} style={{ color: "#6366f1" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
            {metrics?.byPage?.map((pg) => (
              <div key={pg.pageUrl} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.6rem", borderRadius: "10px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", fontWeight: 700 }}>
                  <span style={{ fontFamily: "monospace", color: "var(--primary)" }}>{pg.pageUrl}</span>
                  <span>{pg.total} eventos</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", opacity: 0.7 }}>
                  <span>{pg.visits} visitas</span>
                  <span>{pg.clicks} clics</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "3px", overflow: "hidden", marginTop: "2px" }}>
                  <div style={{ width: `${pg.percentage}%`, height: "100%", backgroundColor: "#6366f1", borderRadius: "3px" }} />
                </div>
              </div>
            ))}

            {(!metrics?.byPage || metrics.byPage.length === 0) && (
              <p style={{ fontSize: "0.85rem", opacity: 0.6, textAlign: "center", margin: "1rem 0" }}>
                Sin registros de páginas visitadas.
              </p>
            )}
          </div>
        </div>

        {/* Panel 4: Secciones y Fuentes de Tráfico */}
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
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Secciones y Fuentes (Referrers)</h3>
            <Share2 size={18} style={{ color: "#8b5cf6" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Fuentes de Tráfico:</div>
            {metrics?.byReferrer?.map((ref) => (
              <div key={ref.referrer} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ fontWeight: 600 }}>{ref.referrer}</span>
                <span style={{ fontWeight: 700, color: "#8b5cf6" }}>{ref.count} ({ref.percentage}%)</span>
              </div>
            ))}

            <div style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase", marginTop: "0.5rem" }}>Secciones con más Clics:</div>
            {metrics?.bySection?.map((sec) => (
              <div key={sec.section} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border-color)" }}>
                <span>{sec.section}</span>
                <span style={{ fontWeight: 700, color: "#3b82f6" }}>{sec.count} ({sec.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: TABLA DE EVENTOS EN TIEMPO REAL CON BUSCADOR Y FILTROS */}
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
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Registro de Actividad en Vivo</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", opacity: 0.6 }}>Flujo en tiempo real de cada visita, clic y conversión en la landing</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar botón, página, fuente..."
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

            {/* Filtro por Tipo de Evento */}
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "inherit",
                fontSize: "0.82rem"
              }}
            >
              <option value="all">Todos los Eventos</option>
              <option value="click">🖱️ Solo Clics</option>
              <option value="pageview">👁️ Solo Visitas</option>
              <option value="conversion">🎯 Conversiones</option>
            </select>

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
            <p style={{ margin: 0, fontWeight: 600 }}>No hay eventos analíticos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", opacity: 0.7 }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Fecha & Hora</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Tipo</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Acción / Elemento</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Sección</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Dispositivo</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Página / Origen</th>
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

                  const isVisit = evt.eventType === "pageview";
                  const isConversion = evt.eventType === "conversion";

                  return (
                    <tr key={evt.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600 }}>{formattedDate}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          backgroundColor: isConversion
                            ? "rgba(16, 185, 129, 0.15)"
                            : isVisit
                            ? "rgba(99, 102, 241, 0.15)"
                            : "rgba(59, 130, 246, 0.15)",
                          color: isConversion ? "#10b981" : isVisit ? "#6366f1" : "#3b82f6"
                        }}>
                          {isConversion ? "🎯 Lead" : isVisit ? "👁️ Visita" : "🖱️ Clic"}
                        </span>
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
                          backgroundColor: "rgba(128, 128, 128, 0.08)",
                          color: "var(--text-color)"
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
                      <td style={{ padding: "0.85rem 1rem", opacity: 0.85, fontSize: "0.78rem" }}>
                        <div style={{ fontWeight: 600 }}>{evt.pageUrl}</div>
                        {evt.utmSource ? (
                          <span style={{ color: "#8b5cf6", fontWeight: 700 }}>UTM: {evt.utmSource}</span>
                        ) : evt.referrer ? (
                          <div style={{ opacity: 0.6 }}>Ref: {evt.referrer}</div>
                        ) : null}
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

