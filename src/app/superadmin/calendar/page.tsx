"use client";

import { useState, useEffect, Suspense } from "react";
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
} from "@/lib/superadminCalendarStore";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Video,
  CalendarDays,
  List,
} from "lucide-react";
import WeeklyCalendarView from "./WeeklyCalendarView";
import CalendarConfigSidebar from "./CalendarConfigSidebar";
import EventDetailModal from "./EventDetailModal";

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
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helper para obtener el Lunes de la semana
  const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Estados de navegación del calendario
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<SuperadminMeeting | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Filtros de reuniones
  const [meetingFilter, setMeetingFilter] = useState<"all" | "upcoming" | "google" | "meet">("all");
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

  // Guardar configuración
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");

    try {
      const res = await saveSuperadminCalendarSettings(config);
      if (res.success) {
        setConfig(res.config);
        setSaveSuccessMsg("¡Disponibilidad y franjas horarias actualizadas!");
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
        await loadData();
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

  // Navegación de semana
  const handlePrevWeek = () => {
    setSelectedWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setSelectedWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleTodayWeek = () => {
    setSelectedWeekStart(getMonday(new Date()));
    setSelectedCalendarDay(null);
  };

  const handleSelectDayFromMini = (dateStr: string) => {
    setSelectedCalendarDay(dateStr);
    const [y, m, d] = dateStr.split("-").map(Number);
    setSelectedWeekStart(getMonday(new Date(y, m - 1, d)));
  };

  // Formatear hoy
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  // 7 días de la semana actual
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(selectedWeekStart);
    d.setDate(selectedWeekStart.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    return {
      dateObj: d,
      dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString("es-UY", { weekday: "short" }),
      isToday: dateStr === todayStr,
    };
  });

  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(selectedWeekStart.getDate() + 6);
  const weekLabel = `${selectedWeekStart.toLocaleDateString("es-UY", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })}`;

  // Filtrado de reuniones
  const now = new Date();
  const filteredMeetings = meetings.filter((m) => {
    const meetingDate = new Date(m.start);

    // Si hay un día seleccionado
    if (selectedCalendarDay && m.date !== selectedCalendarDay) {
      return false;
    }

    if (meetingFilter === "upcoming") {
      if (m.status === "cancelled") return false;
      if (meetingDate < now) return false;
    } else if (meetingFilter === "google") {
      if (!m.isGoogleEvent && !m.id.startsWith("gcal-")) return false;
    } else if (meetingFilter === "meet") {
      if (m.isGoogleEvent || m.id.startsWith("gcal-")) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (m.clientName || "").toLowerCase().includes(q);
      const matchTitle = (m.title || "").toLowerCase().includes(q);
      const matchEmail = (m.clientEmail || "").toLowerCase().includes(q);
      const matchAgency = (m.agencyName || "").toLowerCase().includes(q);
      const matchPhone = (m.clientPhone || "").includes(q);
      return matchName || matchTitle || matchEmail || matchAgency || matchPhone;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: "1440px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* ENCABEZADO SUPERIOR */}
      <div
        style={{
          marginBottom: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
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
            <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.7 }}>
              Configuración de disponibilidad y vista semanal sincronizada con Google Calendar.
            </p>
          </div>
        </div>

        {/* Acciones del Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1.15rem",
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
            <RefreshCw size={15} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Google"}
          </button>
        </div>
      </div>

      {/* BANNER DE ESTADO */}
      {statusMessage && (
        <div
          style={{
            padding: "0.9rem 1.25rem",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* LAYOUT PRINCIPAL DE 2 COLUMNAS (ESTILO CONFIGURACIONES) */}
      <div
        style={{
          display: "flex",
          gap: "1.75rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN & MINI CALENDARIO */}
        <div
          style={{
            flex: "0 0 350px",
            maxWidth: "100%",
            width: "350px",
          }}
        >
          <CalendarConfigSidebar
            config={config}
            onConfigChange={setConfig}
            onSaveConfig={handleSaveConfig}
            isSaving={isSaving}
            saveSuccessMsg={saveSuccessMsg}
            googleAuth={googleAuth}
            onSyncGoogle={handleSyncGoogle}
            isSyncing={isSyncing}
            onDisconnectGoogle={handleDisconnectGoogle}
            currentCalendarDate={currentCalendarDate}
            onMonthChange={setCurrentCalendarDate}
            selectedCalendarDay={selectedCalendarDay}
            onSelectDay={handleSelectDayFromMini}
            meetings={meetings}
          />
        </div>

        {/* COLUMNA DERECHA / CENTRAL: CALENDARIO SEMANAL EN GRANDE */}
        <div
          style={{
            flex: "1 1 700px",
            minWidth: "0",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* BARRA DE NAVEGACIÓN Y CONTROLES DE LA SEMANA */}
          <div
            style={{
              backgroundColor: "var(--surface-color)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              padding: "1rem 1.25rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Navegación Semanal */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handlePrevWeek}
                title="Semana anterior"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleTodayWeek}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                title="Semana siguiente"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={16} />
              </button>

              <span
                style={{
                  marginLeft: "0.5rem",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "var(--text-color)",
                  textTransform: "capitalize",
                }}
              >
                {weekLabel}
              </span>

              {selectedCalendarDay && (
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDay(null)}
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: "#2563eb",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Día filtrado: {selectedCalendarDay} ✕
                </button>
              )}
            </div>

            {/* Controles de vista y filtros */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem" }}>
              {/* Selector de modo de vista */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "var(--bg-color)",
                  padding: "3px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewMode === "week" ? "var(--surface-color)" : "transparent",
                    color: viewMode === "week" ? "#10b981" : "var(--text-color)",
                    fontWeight: viewMode === "week" ? 800 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: viewMode === "week" ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <CalendarDays size={14} /> Semana
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: viewMode === "list" ? "var(--surface-color)" : "transparent",
                    color: viewMode === "list" ? "#10b981" : "var(--text-color)",
                    fontWeight: viewMode === "list" ? 800 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <List size={14} /> Lista
                </button>
              </div>

              {/* Filtro rápido */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "var(--bg-color)",
                  padding: "3px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setMeetingFilter("all")}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: meetingFilter === "all" ? "var(--surface-color)" : "transparent",
                    color: meetingFilter === "all" ? "#10b981" : "var(--text-color)",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Todos ({meetings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingFilter("meet")}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: meetingFilter === "meet" ? "var(--surface-color)" : "transparent",
                    color: meetingFilter === "meet" ? "#10b981" : "var(--text-color)",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Meet Landing
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingFilter("google")}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: meetingFilter === "google" ? "var(--surface-color)" : "transparent",
                    color: meetingFilter === "google" ? "#2563eb" : "var(--text-color)",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Google
                </button>
              </div>

              {/* Barra de Búsqueda */}
              <div style={{ position: "relative", minWidth: "160px" }}>
                <Search size={14} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Buscar evento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.6rem 0.35rem 1.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* VISTA PRINCIPAL: SEMANAL O LISTA */}
          {isLoading ? (
            <div
              style={{
                backgroundColor: "var(--surface-color)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                padding: "4rem",
                textAlign: "center",
                opacity: 0.6,
              }}
            >
              Cargando eventos del calendario...
            </div>
          ) : viewMode === "week" ? (
            <WeeklyCalendarView
              weekDays={weekDays}
              meetings={filteredMeetings}
              onSelectMeeting={(m) => setSelectedMeetingDetail(m)}
              selectedCalendarDay={selectedCalendarDay}
              onSelectDay={(dStr) => setSelectedCalendarDay(selectedCalendarDay === dStr ? null : dStr)}
            />
          ) : (
            /* VISTA DE LISTA */
            <div
              style={{
                backgroundColor: "var(--surface-color)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {filteredMeetings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
                  No se encontraron eventos con los filtros seleccionados.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {filteredMeetings.map((m) => {
                    const isGoogle = m.isGoogleEvent || m.id.startsWith("gcal-");
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMeetingDetail(m)}
                        style={{
                          padding: "1rem 1.25rem",
                          borderRadius: "12px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-color)",
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div
                            style={{
                              padding: "0.5rem 0.75rem",
                              borderRadius: "8px",
                              backgroundColor: isGoogle ? "rgba(59, 130, 246, 0.12)" : "rgba(16, 185, 129, 0.12)",
                              color: isGoogle ? "#2563eb" : "#10b981",
                              textAlign: "center",
                              minWidth: "60px",
                              fontWeight: 800,
                            }}
                          >
                            <span style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                              {new Date(m.start).toLocaleDateString("es-UY", { weekday: "short" })}
                            </span>
                            <span style={{ fontSize: "1.1rem" }}>{new Date(m.start).getDate()}</span>
                          </div>

                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{m.title || m.clientName}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", opacity: 0.7 }}>
                              <Clock size={13} /> {m.time} hs ({m.durationMinutes} min) • {m.date}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {isGoogle ? (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#2563eb", padding: "0.2rem 0.5rem", borderRadius: "10px" }}>
                              Google Calendar
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "0.2rem 0.5rem", borderRadius: "10px" }}>
                              Videollamada Meet
                            </span>
                          )}

                          {m.meetUrl && (
                            <a
                              href={m.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.45rem 0.85rem",
                                borderRadius: "6px",
                                backgroundColor: "#1a73e8",
                                color: "#fff",
                                textDecoration: "none",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              <Video size={14} /> Meet
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALLES DEL EVENTO */}
      <EventDetailModal
        meeting={selectedMeetingDetail}
        onClose={() => setSelectedMeetingDetail(null)}
        onCancelMeeting={handleCancelMeeting}
        isCancelling={cancellingId === selectedMeetingDetail?.id}
      />
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
