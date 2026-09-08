"use client";

import { useState, useEffect, useId, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getSuperadminCalendarSettings,
  saveSuperadminCalendarSettings,
  getSuperadminMeetingsList,
  cancelSuperadminMeeting,
  disconnectSuperadminGoogle,
  syncGoogleEventsAction,
} from "@/actions/superadminCalendarActions";
import {
  SuperadminCalendarConfig,
  SuperadminMeeting,
  TimeRange,
} from "@/lib/superadminCalendarStore";
import {
  CalendarClock,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Building2,
  Save,
  Link2,
  Unlink,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Info,
  Check,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { id: 1, name: "Lunes", short: "Lun" },
  { id: 2, name: "Martes", short: "Mar" },
  { id: 3, name: "Miércoles", short: "Mié" },
  { id: 4, name: "Jueves", short: "Jue" },
  { id: 5, name: "Viernes", short: "Vie" },
  { id: 6, name: "Sábado", short: "Sáb" },
  { id: 0, name: "Domingo", short: "Dom" },
];

function SuperadminCalendarContent() {
  const searchParams = useSearchParams();

  // Estados de datos
  const [config, setConfig] = useState<SuperadminCalendarConfig>({
    availableDays: [1, 2, 3, 4, 5],
    displayDaysAhead: 14,
    meetingDurationMinutes: 30,
    consultationHours: {
      startTime: "09:00",
      endTime: "18:00",
      timeRanges: [{ startTime: "09:00", endTime: "18:00" }],
    },
  });
  const [googleAuth, setGoogleAuth] = useState<{ connected: boolean; email: string | null }>({
    connected: false,
    email: null,
  });
  const [meetings, setMeetings] = useState<SuperadminMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados de vista de calendario visual
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Filtros de reuniones
  const [meetingFilter, setMeetingFilter] = useState<"upcoming" | "all" | "past" | "cancelled">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Cargar datos
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, meetingsRes] = await Promise.all([
        getSuperadminCalendarSettings(),
        getSuperadminMeetingsList(),
      ]);

      if (settingsRes && settingsRes.config) {
        const c = settingsRes.config;
        if (!c.consultationHours.timeRanges || c.consultationHours.timeRanges.length === 0) {
          c.consultationHours.timeRanges = [
            { startTime: c.consultationHours.startTime || "09:00", endTime: c.consultationHours.endTime || "18:00" },
          ];
        }
        setConfig(c);
        setGoogleAuth(settingsRes.googleAuth);
      }
      if (Array.isArray(meetingsRes)) {
        setMeetings(meetingsRes);
      }
    } catch (e) {
      console.error("Error al cargar datos del calendario:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const count = searchParams.get("count");

    if (success === "google_connected") {
      const countNum = count ? Number(count) : 0;
      const countMsg = countNum > 0 ? ` (${countNum} eventos importados)` : "";
      setStatusMessage({
        type: "success",
        text: `¡Google Calendar conectado y sincronizado automáticamente con éxito!${countMsg}`,
      });
      // Asegurar refresco inmediato con los nuevos eventos
      setTimeout(() => {
        loadData();
      }, 500);
    } else if (error) {
      setStatusMessage({
        type: "error",
        text: `Aviso de conexión con Google: ${error}. El calendario autónomo por defecto sigue funcionando al 100%.`,
      });
    }
  }, [searchParams]);

  // Manejo de días disponibles
  const handleToggleDay = (dayId: number) => {
    setConfig((prev) => {
      const exists = prev.availableDays.includes(dayId);
      const updated = exists
        ? prev.availableDays.filter((d) => d !== dayId)
        : [...prev.availableDays, dayId].sort();
      return { ...prev, availableDays: updated };
    });
  };

  // Manejo de franjas horarias múltiples
  const handleAddTimeRange = () => {
    setConfig((prev) => {
      const currentRanges = prev.consultationHours.timeRanges || [];
      const newRange: TimeRange = { startTime: "17:00", endTime: "19:00" };
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: [...currentRanges, newRange],
        },
      };
    });
  };

  const handleRemoveTimeRange = (index: number) => {
    setConfig((prev) => {
      const currentRanges = prev.consultationHours.timeRanges || [];
      if (currentRanges.length <= 1) return prev;
      const filtered = currentRanges.filter((_, i) => i !== index);
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: filtered,
        },
      };
    });
  };

  const handleUpdateTimeRange = (index: number, field: "startTime" | "endTime", value: string) => {
    setConfig((prev) => {
      const currentRanges = [...(prev.consultationHours.timeRanges || [])];
      if (currentRanges[index]) {
        currentRanges[index] = {
          ...currentRanges[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: currentRanges,
        },
      };
    });
  };

  // Guardar configuración
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");

    try {
      const res = await saveSuperadminCalendarSettings(config);
      if (res.success) {
        setConfig(res.config);
        setSaveSuccessMsg("¡Disponibilidad y franjas horarias actualizadas correctamente!");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Error al guardar disponibilidad:", err);
      alert("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Sincronizar eventos con Google
  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncGoogleEventsAction();
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Eventos sincronizados con éxito." });
        loadData();
      } else {
        setStatusMessage({ type: "error", text: res.error || "No se pudo sincronizar con Google." });
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e?.message || "Error al conectar con Google." });
    } finally {
      setIsSyncing(false);
    }
  };

  // Desconectar Google
  const handleDisconnectGoogle = async () => {
    if (!confirm("¿Seguro que deseas desconectar tu cuenta de Google Calendar?")) return;
    try {
      await disconnectSuperadminGoogle();
      setGoogleAuth({ connected: false, email: null });
      setStatusMessage({ type: "success", text: "Google Calendar desconectado. El calendario continúa en modo autónomo." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error("Error desconectando Google:", e);
    }
  };

  // Cancelar una reunión
  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm("¿Deseas cancelar esta reunión? Se notificará y deshabilitará el enlace de Meet.")) return;
    setCancellingId(meetingId);
    try {
      await cancelSuperadminMeeting(meetingId);
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status: "cancelled" } : m))
      );
    } catch (e) {
      console.error("Error al cancelar reunión:", e);
    } finally {
      setCancellingId(null);
    }
  };

  // Filtrar reuniones
  const now = new Date();
  const filteredMeetings = meetings.filter((m) => {
    const meetingDate = new Date(m.start);

    // Si hay un día seleccionado en el calendario visual
    if (selectedCalendarDay && m.date !== selectedCalendarDay) {
      return false;
    }

    if (meetingFilter === "upcoming") {
      if (m.status === "cancelled") return false;
      if (meetingDate < now) return false;
    } else if (meetingFilter === "past") {
      if (m.status === "cancelled") return false;
      if (meetingDate >= now) return false;
    } else if (meetingFilter === "cancelled") {
      if (m.status !== "cancelled") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.clientName.toLowerCase().includes(q);
      const matchEmail = m.clientEmail.toLowerCase().includes(q);
      const matchAgency = (m.agencyName || "").toLowerCase().includes(q);
      const matchPhone = (m.clientPhone || "").includes(q);
      return matchName || matchEmail || matchAgency || matchPhone;
    }

    return true;
  });

  // Helpers de calendario mensual
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: "2rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--text-color)" }}>
              Agenda de Videollamadas & Google Meet
            </h1>
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>
              Calendario del Superadmin para gestionar consultas 1 a 1 y disponibilidad de la landing page.
            </p>
          </div>
        </div>

        {/* Botón de Sincronización Directa de Google */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.15rem",
              borderRadius: "10px",
              backgroundColor: "var(--surface-color)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: isSyncing ? "not-allowed" : "pointer",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <RefreshCw size={16} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
            {isSyncing ? "Sincronizando..." : "Sincronizar eventos con Google"}
          </button>
        </div>
      </div>

      {/* Banner de Notificación */}
      {statusMessage && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor:
              statusMessage.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: statusMessage.type === "success" ? "#10b981" : "#ef4444",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {statusMessage.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* SECCIÓN 1: ESTADO DE SINCRONIZACIÓN GOOGLE / MODO AUTÓNOMO */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: googleAuth.connected ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Video size={24} style={{ color: googleAuth.connected ? "#10b981" : "#3b82f6" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-color)" }}>
                  Sincronización con Google Calendar & Google Meet
                </h2>
                {googleAuth.connected ? (
                  <span
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: 700,
                    }}
                  >
                    CONECTADO
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      color: "#3b82f6",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: 700,
                    }}
                  >
                    MODO AUTÓNOMO ACTIVO
                  </span>
                )}
              </div>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.75 }}>
                {googleAuth.connected
                  ? `Sincronizado con ${googleAuth.email || "tu cuenta de Google"}. Los eventos ocupados se descuentan en tiempo real.`
                  : "Tu calendario por defecto está listo y vacío para recibir reservas desde la landing page. Puedes conectar Google Calendar para sincronizar tus eventos."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setShowGoogleHelp(!showGoogleHelp)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-color)",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <HelpCircle size={16} /> Configuración Google Cloud
            </button>

            {googleAuth.connected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleSyncGoogle}
                  disabled={isSyncing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: isSyncing ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={15} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
                  {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 0.9rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Unlink size={15} /> Desconectar
                </button>
              </div>
            ) : (
              <a
                href="/api/auth/google?target=superadmin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "10px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                }}
              >
                <Link2 size={18} /> Conectar y sincronizar con Google
              </a>
            )}
          </div>
        </div>

        {/* Panel de Ayuda para Desarrollador Google (Error 400 redirect_uri_mismatch) */}
        {showGoogleHelp && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              backgroundColor: "rgba(59, 130, 246, 0.06)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Info size={16} /> Para habilitar Google Calendar en tu Google Cloud Console:
            </div>
            <p style={{ margin: "0 0 0.5rem 0", opacity: 0.85 }}>
              Si al conectar Google te muestra <code>Error 400: redirect_uri_mismatch</code>, debes agregar la siguiente URI en tu consola de Google Cloud (en <em>APIs y Servicios &gt; Credenciales &gt; IDs de cliente de OAuth 2.0 &gt; URIs de redireccionamiento autorizados</em>):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", backgroundColor: "var(--bg-color)", padding: "0.6rem 0.85rem", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid var(--border-color)" }}>
              <div>• <strong>http://localhost:3000/api/auth/google/callback</strong> (para pruebas locales)</div>
              <div>• <strong>https://superadmin.n-autos.com/api/auth/google/callback</strong> (para producción)</div>
            </div>
            <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.7 }}>
              * Mientras tanto, no te preocupes: el sistema trabaja de forma autónoma con su propio calendario interno.
            </span>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: CONFIGURACIÓN DE DISPONIBILIDAD (LOS 4 CAMPOS CON FRANJAS MÚLTIPLES) */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.75rem",
          marginBottom: "2rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-color)" }}>
            Configuración de Horarios de Consulta & Disponibilidad
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
            Define qué días y en qué franjas horarias podrán agendarte una consulta o videollamada.
          </p>
        </div>

        <form onSubmit={handleSaveConfig}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* 1. DÍAS DISPONIBLES */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-color)" }}>
                1. Días disponibles de atención
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = config.availableDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDay(d.id)}
                      style={{
                        padding: "0.6rem 1.1rem",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid var(--primary, #10b981)" : "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "rgba(16, 185, 129, 0.12)" : "var(--bg-color)",
                        color: isSelected ? "var(--primary, #10b981)" : "var(--text-color)",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      {isSelected && <Check size={16} />}
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CUÁNTOS DÍAS SE MUESTRAN A LOS INTERESADOS */}
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-color)" }}>
                2. Cuántos días se muestran a los interesados
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setConfig({ ...config, displayDaysAhead: days })}
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.5rem",
                      borderRadius: "8px",
                      border: config.displayDaysAhead === days ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                      backgroundColor: config.displayDaysAhead === days ? "rgba(59, 130, 246, 0.12)" : "var(--bg-color)",
                      color: config.displayDaysAhead === days ? "#3b82f6" : "var(--text-color)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {days} días
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>O valor exacto:</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={config.displayDaysAhead}
                  onChange={(e) => setConfig({ ...config, displayDaysAhead: Number(e.target.value) || 14 })}
                  style={{
                    width: "70px",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>días</span>
              </div>
            </div>

            {/* 3. TIEMPOS DE DURACIÓN DE LAS REUNIONES */}
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-color)" }}>
                3. Tiempo de duración de las consultas
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setConfig({ ...config, meetingDurationMinutes: mins })}
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.5rem",
                      borderRadius: "8px",
                      border: config.meetingDurationMinutes === mins ? "2px solid #8b5cf6" : "1px solid var(--border-color)",
                      backgroundColor: config.meetingDurationMinutes === mins ? "rgba(139, 92, 246, 0.12)" : "var(--bg-color)",
                      color: config.meetingDurationMinutes === mins ? "#8b5cf6" : "var(--text-color)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* 4. HORARIOS DE CONSULTA (FRANJAS HORARIAS MÚLTIPLES OPCIONALES) */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color)" }}>
                  4. Horarios de consulta (Franjas horarias disponibles)
                </label>
                <button
                  type="button"
                  onClick={handleAddTimeRange}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#10b981",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Agregar otra franja horaria
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(config.consultationHours.timeRanges || [{ startTime: "09:00", endTime: "18:00" }]).map(
                  (range, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        backgroundColor: "var(--bg-color)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: "80px", color: "var(--text-color)" }}>
                        Franja #{idx + 1}:
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Desde:</span>
                        <select
                          value={range.startTime}
                          onChange={(e) => handleUpdateTimeRange(idx, "startTime", e.target.value)}
                          style={{
                            padding: "0.45rem 0.65rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--surface-color)",
                            color: "var(--text-color)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {Array.from({ length: 24 }).map((_, h) => {
                            const timeStr = `${String(h).padStart(2, "0")}:00`;
                            return <option key={timeStr} value={timeStr}>{timeStr} hs</option>;
                          })}
                        </select>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Hasta:</span>
                        <select
                          value={range.endTime}
                          onChange={(e) => handleUpdateTimeRange(idx, "endTime", e.target.value)}
                          style={{
                            padding: "0.45rem 0.65rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--surface-color)",
                            color: "var(--text-color)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {Array.from({ length: 24 }).map((_, h) => {
                            const timeStr = `${String(h).padStart(2, "0")}:00`;
                            return <option key={timeStr} value={timeStr}>{timeStr} hs</option>;
                          })}
                        </select>
                      </div>

                      {(config.consultationHours.timeRanges || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeRange(idx)}
                          title="Eliminar esta franja"
                          style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "0.3rem",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              <span style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginTop: "0.5rem" }}>
                Ejemplo: De 09:00 a 14:00 y de 17:00 a 19:00 (las horas intermedias quedarán libres para almuerzo/descanso).
              </span>
            </div>
          </div>

          {/* Botón de Guardado */}
          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#fff",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Save size={18} />
              {isSaving ? "Guardando..." : "Guardar Disponibilidad"}
            </button>

            {saveSuccessMsg && (
              <span style={{ color: "#10b981", fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle2 size={16} /> {saveSuccessMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* SECCIÓN 3: VISTA DE CALENDARIO MENSUAL & REUNIONES */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-color)" }}>
              Calendario y Reuniones Agendadas
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
              {selectedCalendarDay
                ? `Mostrando eventos para el ${selectedCalendarDay}. Haz clic en "Ver todas" para reiniciar.`
                : "Calendario por defecto del Superadmin sincronizable con Google."}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            {selectedCalendarDay && (
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Ver todas las fechas ✕
              </button>
            )}

            <div style={{ display: "flex", backgroundColor: "var(--bg-color)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <button
                type="button"
                onClick={() => setMeetingFilter("upcoming")}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: meetingFilter === "upcoming" ? "var(--surface-color)" : "transparent",
                  color: meetingFilter === "upcoming" ? "var(--primary, #10b981)" : "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Próximas ({meetings.filter((m) => m.status !== "cancelled" && new Date(m.start) >= now).length})
              </button>
              <button
                type="button"
                onClick={() => setMeetingFilter("all")}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: meetingFilter === "all" ? "var(--surface-color)" : "transparent",
                  color: meetingFilter === "all" ? "var(--primary, #10b981)" : "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Todas ({meetings.length})
              </button>
              <button
                type="button"
                onClick={() => setMeetingFilter("past")}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: meetingFilter === "past" ? "var(--surface-color)" : "transparent",
                  color: meetingFilter === "past" ? "var(--primary, #10b981)" : "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Pasadas
              </button>
              <button
                type="button"
                onClick={() => setMeetingFilter("cancelled")}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: meetingFilter === "cancelled" ? "var(--surface-color)" : "transparent",
                  color: meetingFilter === "cancelled" ? "#ef4444" : "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Canceladas ({meetings.filter((m) => m.status === "cancelled").length})
              </button>
            </div>

            <div style={{ position: "relative", minWidth: "180px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar reunión..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.75rem 0.4rem 2rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Mini Calendario de Navegación Visual */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "12px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", textTransform: "capitalize" }}>
              {currentCalendarDate.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
            </span>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1))}
                style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-color)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1))}
                style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-color)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((h) => (
              <div key={h} style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6, paddingBottom: "4px" }}>
                {h}
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInCalMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayMeetings = meetings.filter((m) => m.date === dateStr && m.status !== "cancelled");
              const isSelected = selectedCalendarDay === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                  style={{
                    aspectRatio: 1.3,
                    borderRadius: "8px",
                    border: isSelected ? "2px solid #2563eb" : "1px solid transparent",
                    backgroundColor: isSelected ? "rgba(37, 99, 235, 0.15)" : dayMeetings.length > 0 ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    color: isSelected ? "#2563eb" : "var(--text-color)",
                    fontWeight: isSelected || dayMeetings.length > 0 ? 800 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                  }}
                >
                  <span>{dayNum}</span>
                  {dayMeetings.length > 0 && (
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Reuniones */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
            Cargando reuniones...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-color)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
              No hay reuniones agendadas {meetingFilter === "upcoming" ? "próximas" : ""}.
            </p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.6 }}>
              Tu calendario autónomo está limpio. Cuando los interesados reserven una consulta desde la landing aparecerán aquí.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredMeetings.map((m) => {
              const meetingStart = new Date(m.start);
              const isPast = meetingStart < now;
              const isCancelled = m.status === "cancelled";

              return (
                <div
                  key={m.id}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    opacity: isCancelled ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "220px" }}>
                    <div
                      style={{
                        padding: "0.6rem 0.85rem",
                        borderRadius: "10px",
                        backgroundColor: isCancelled
                          ? "rgba(239, 68, 68, 0.1)"
                          : isPast
                          ? "rgba(107, 114, 128, 0.1)"
                          : "rgba(16, 185, 129, 0.15)",
                        color: isCancelled ? "#ef4444" : isPast ? "#6b7280" : "#10b981",
                        textAlign: "center",
                        minWidth: "65px",
                      }}
                    >
                      <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                        {meetingStart.toLocaleDateString("es-UY", { weekday: "short" })}
                      </span>
                      <span style={{ display: "block", fontSize: "1.2rem", fontWeight: 900, lineHeight: 1.1 }}>
                        {meetingStart.getDate()}
                      </span>
                      <span style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                        {meetingStart.toLocaleDateString("es-UY", { month: "short" })}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.95rem" }}>
                        <Clock size={16} style={{ opacity: 0.6 }} />
                        {m.time} hs ({m.durationMinutes} min)
                      </div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "2px" }}>
                        {isCancelled ? "Cancelada" : isPast ? "Reunión finalizada" : m.isGoogleEvent ? "Google Calendar" : "Consulta Landing"}
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-color)" }}>
                        {m.clientName}
                      </span>
                      {m.agencyName && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            color: "#3b82f6",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <Building2 size={12} /> {m.agencyName}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.85rem", marginTop: "0.35rem", fontSize: "0.85rem", opacity: 0.8 }}>
                      {m.clientEmail && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Mail size={14} style={{ opacity: 0.6 }} /> {m.clientEmail}
                        </span>
                      )}
                      {m.clientPhone && (
                        <a
                          href={`https://wa.me/${m.clientPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#10b981", textDecoration: "none", fontWeight: 600 }}
                        >
                          <Phone size={14} /> {m.clientPhone}
                        </a>
                      )}
                    </div>

                    {m.notes && (
                      <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.8rem", opacity: 0.7, fontStyle: "italic" }}>
                        &ldquo;{m.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {m.meetUrl && !isCancelled && (
                      <a
                        href={m.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.6rem 1.1rem",
                          borderRadius: "8px",
                          backgroundColor: "#1a73e8",
                          color: "#fff",
                          textDecoration: "none",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          boxShadow: "0 2px 6px rgba(26, 115, 232, 0.3)",
                        }}
                      >
                        <Video size={16} /> Entrar a Google Meet
                      </a>
                    )}

                    {!isCancelled && !isPast && (
                      <button
                        type="button"
                        onClick={() => handleCancelMeeting(m.id)}
                        disabled={cancellingId === m.id}
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {cancellingId === m.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperadminCalendarPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "3rem", textAlign: "center", opacity: 0.6 }}>
          Cargando agenda de reuniones...
        </div>
      }
    >
      <SuperadminCalendarContent />
    </Suspense>
  );
}
