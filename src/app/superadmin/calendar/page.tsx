"use client";

import { useState, useEffect, useTransition, useId, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getSuperadminCalendarSettings,
  saveSuperadminCalendarSettings,
  getSuperadminMeetingsList,
  cancelSuperadminMeeting,
  disconnectSuperadminGoogle,
} from "@/actions/superadminCalendarActions";
import {
  SuperadminCalendarConfig,
  SuperadminMeeting,
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
  ExternalLink,
  Save,
  Link2,
  Unlink,
  MessageSquare,
  Search,
  Filter,
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
  const startTimeSelectId = useId();
  const endTimeSelectId = useId();

  // Estados de datos
  const [config, setConfig] = useState<SuperadminCalendarConfig>({
    availableDays: [1, 2, 3, 4, 5],
    displayDaysAhead: 14,
    meetingDurationMinutes: 30,
    consultationHours: { startTime: "09:00", endTime: "18:00" },
  });
  const [googleAuth, setGoogleAuth] = useState<{ connected: boolean; email: string | null }>({
    connected: false,
    email: null,
  });
  const [meetings, setMeetings] = useState<SuperadminMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

      if (settingsRes) {
        setConfig(settingsRes.config);
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

    // Comprobar parámetros de URL tras OAuth
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      setStatusMessage({
        type: "success",
        text: "¡Google Calendar conectado y sincronizado con éxito!",
      });
    } else if (error) {
      setStatusMessage({
        type: "error",
        text: `No se pudo conectar Google Calendar: ${error}`,
      });
    }
  }, [searchParams]);

  // Toggle de día disponible
  const handleToggleDay = (dayId: number) => {
    setConfig((prev) => {
      const exists = prev.availableDays.includes(dayId);
      const updated = exists
        ? prev.availableDays.filter((d) => d !== dayId)
        : [...prev.availableDays, dayId].sort();
      return { ...prev, availableDays: updated };
    });
  };

  // Guardar configuración (los 4 campos estrictos)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");

    try {
      const res = await saveSuperadminCalendarSettings(config);
      if (res.success) {
        setConfig(res.config);
        setSaveSuccessMsg("¡Disponibilidad y horarios actualizados correctamente!");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Error al guardar disponibilidad:", err);
      alert("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Desconectar Google
  const handleDisconnectGoogle = async () => {
    if (!confirm("¿Seguro que deseas desconectar tu cuenta de Google Calendar?")) return;
    try {
      await disconnectSuperadminGoogle();
      setGoogleAuth({ connected: false, email: null });
      setStatusMessage({ type: "success", text: "Google Calendar desconectado." });
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

    // Filtro por estado / temporalidad
    if (meetingFilter === "upcoming") {
      if (m.status === "cancelled") return false;
      if (meetingDate < now) return false;
    } else if (meetingFilter === "past") {
      if (m.status === "cancelled") return false;
      if (meetingDate >= now) return false;
    } else if (meetingFilter === "cancelled") {
      if (m.status !== "cancelled") return false;
    }

    // Búsqueda textual
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

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
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
              Agenda de Reuniones & Google Meet
            </h1>
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>
              Configuración de disponibilidad sincronizada para el agendamiento estilo Calendly de la landing page.
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Estado / Notificación */}
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

      {/* SECCIÓN 1: SINCRONIZACIÓN CON GOOGLE */}
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
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#f59e0b",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: 700,
                    }}
                  >
                    PENDIENTE
                  </span>
                )}
              </div>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.75 }}>
                {googleAuth.connected
                  ? `Sincronizado con la cuenta ${googleAuth.email || "de Google"}. Los eventos ocupados se descuentan automáticamente y las reuniones generan link de Google Meet.`
                  : "Conecta tu Google Calendar para bloquear horarios ocupados en tiempo real y generar salas de Google Meet para los interesados de la landing."}
              </p>
            </div>
          </div>

          <div>
            {googleAuth.connected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Unlink size={16} /> Desconectar Google
              </button>
            ) : (
              <a
                href="/api/auth/google-calendar"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.7rem 1.25rem",
                  borderRadius: "10px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                <Link2 size={18} /> Conectar con Google
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: FORMULARIO DE DISPONIBILIDAD (LOS 4 CAMPOS EXCLUSIVOS) */}
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
            Define las reglas con las que los interesados podrán elegir fecha y hora desde el espacio de agendamiento en la landing.
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
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSelected && <CheckCircle2 size={16} />}
                      {d.name}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginTop: "0.4rem" }}>
                Los días no marcados aparecerán deshabilitados en el calendario de la landing.
              </span>
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
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>O valor personalizado:</span>
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
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>días hacia adelante</span>
              </div>
            </div>

            {/* 3. TIEMPOS DE DURACIÓN DE LAS REUNIONES */}
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-color)" }}>
                3. Tiempo de duración de las reuniones
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
              <span style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginTop: "0.4rem" }}>
                Determina el espaciado de los turnos en el agendamiento.
              </span>
            </div>

            {/* 4. HORARIOS DE CONSULTA */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-color)" }}>
                4. Horarios de consulta (Jornada diaria de atención)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label htmlFor={startTimeSelectId} style={{ fontSize: "0.85rem", fontWeight: 600 }}>Hora Inicio:</label>
                  <select
                    id={startTimeSelectId}
                    value={config.consultationHours.startTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        consultationHours: { ...config.consultationHours, startTime: e.target.value },
                      })
                    }
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.9rem",
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
                  <label htmlFor={endTimeSelectId} style={{ fontSize: "0.85rem", fontWeight: 600 }}>Hora Fin:</label>
                  <select
                    id={endTimeSelectId}
                    value={config.consultationHours.endTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        consultationHours: { ...config.consultationHours, endTime: e.target.value },
                      })
                    }
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.9rem",
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

                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  (Las consultas se agendarán entre las {config.consultationHours.startTime} y las {config.consultationHours.endTime} hs)
                </span>
              </div>
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
                opacity: isSaving ? 0.7 : 1,
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

      {/* SECCIÓN 3: LISTADO Y GESTIÓN DE REUNIONES */}
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
              Reuniones Agendadas por Google Meet
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
              Citas reservadas desde la landing page para demostraciones y asesorías.
            </p>
          </div>

          {/* Filtros rápidos y buscador */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
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

            <div style={{ position: "relative", minWidth: "200px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar cliente, automotora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
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
              No se encontraron reuniones {meetingFilter === "upcoming" ? "próximas" : ""}.
            </p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.6 }}>
              Cuando un interesado agende una consulta desde la landing page aparecerá listada aquí con su enlace de Google Meet.
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
                  {/* Fecha y Horario */}
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
                        {isCancelled ? "Cancelada" : isPast ? "Reunión finalizada" : "Próxima sesión"}
                      </div>
                    </div>
                  </div>

                  {/* Info del Cliente */}
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <Mail size={14} style={{ opacity: 0.6 }} /> {m.clientEmail}
                      </span>
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

                  {/* Enlace a Google Meet & Acciones */}
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
