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
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";
import WeeklyCalendarView from "./WeeklyCalendarView";
import CalendarConfigSidebar from "./CalendarConfigSidebar";
import EventDetailModal from "./EventDetailModal";
import CreateEventModal from "./CreateEventModal";

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

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

  // Estados para barra lateral y creación de eventos
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalData, setCreateModalData] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  }>({
    date: "",
    startTime: "10:00",
    endTime: "11:00",
  });

  // Filtros de reuniones
  const [meetingFilter, setMeetingFilter] = useState<"all" | "upcoming" | "google" | "meet">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleDragCreate = (range: { date: string; startTime: string; endTime: string }) => {
    setCreateModalData(range);
    setIsCreateModalOpen(true);
  };

  const handleOpenNewEvent = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    setCreateModalData({
      date: `${y}-${m}-${d}`,
      startTime: "10:00",
      endTime: "11:00",
    });
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = (newMeeting: SuperadminMeeting) => {
    setMeetings((prev) => [newMeeting, ...prev.filter((m) => m.id !== newMeeting.id)]);
    setStatusMessage({
      type: "success",
      text: `Evento "${newMeeting.title}" agendado con éxito.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

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

  const currentMonthYearLabel = selectedWeekStart.toLocaleDateString("es-UY", {
    month: "long",
    year: "numeric",
  });
  const weekNumber = getWeekNumber(selectedWeekStart);

  return (
    <div
      style={{
        margin: "-2rem",
        height: "calc(100vh - 60px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >
      {/* 1. BARRA SUPERIOR ESTILO GOOGLE CALENDAR */}
      <header
        style={{
          height: "54px",
          minHeight: "54px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--surface-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          gap: "0.75rem",
          zIndex: 20,
        }}
      >
        {/* Izquierda: Menú toggle, Logo Calendar, Hoy, Flechas, Mes y Badge Semana */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            title="Alternar barra lateral"
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu size={20} />
          </button>

          {/* Logo Google Calendar Style con número del día actual */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 900,
                boxShadow: "0 2px 6px rgba(26, 115, 232, 0.4)",
              }}
            >
              {todayObj.getDate()}
            </div>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
              Calendar
            </span>
          </div>

          {/* Botón Hoy */}
          <button
            type="button"
            onClick={handleTodayWeek}
            style={{
              marginLeft: "0.8rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hoy
          </button>

          {/* Flechas de Navegación < > */}
          <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
            <button
              type="button"
              onClick={handlePrevWeek}
              title="Semana anterior"
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              title="Semana siguiente"
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Mes y Año (ej: "Septiembre de 2026") */}
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              textTransform: "capitalize",
              marginLeft: "0.4rem",
            }}
          >
            {currentMonthYearLabel}
          </span>

          {/* Badge Semana (ej: "Semana 37") */}
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.55rem",
              borderRadius: "12px",
              backgroundColor: "rgba(128, 128, 128, 0.12)",
              color: "var(--text-color)",
              opacity: 0.85,
            }}
          >
            Semana {weekNumber}
          </span>
        </div>

        {/* Derecha: Búsqueda, Filtros, Selector Vista (Semana / Lista), Sincronizar Google */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Búsqueda */}
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

          {/* Filtro rápido */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--bg-color)",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={() => setMeetingFilter("all")}
              style={{
                padding: "0.3rem 0.55rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: meetingFilter === "all" ? "var(--surface-color)" : "transparent",
                color: meetingFilter === "all" ? "#1a73e8" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.76rem",
                cursor: "pointer",
              }}
            >
              Todos ({meetings.length})
            </button>
            <button
              type="button"
              onClick={() => setMeetingFilter("meet")}
              style={{
                padding: "0.3rem 0.55rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: meetingFilter === "meet" ? "var(--surface-color)" : "transparent",
                color: meetingFilter === "meet" ? "#10b981" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.76rem",
                cursor: "pointer",
              }}
            >
              Meet
            </button>
            <button
              type="button"
              onClick={() => setMeetingFilter("google")}
              style={{
                padding: "0.3rem 0.55rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: meetingFilter === "google" ? "var(--surface-color)" : "transparent",
                color: meetingFilter === "google" ? "#0284c7" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.76rem",
                cursor: "pointer",
              }}
            >
              Google
            </button>
          </div>

          {/* Selector de modo Semana / Lista */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--bg-color)",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("week")}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "week" ? "var(--surface-color)" : "transparent",
                color: viewMode === "week" ? "#1a73e8" : "var(--text-color)",
                fontWeight: viewMode === "week" ? 800 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "list" ? "var(--surface-color)" : "transparent",
                color: viewMode === "list" ? "#1a73e8" : "var(--text-color)",
                fontWeight: viewMode === "list" ? 800 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Lista
            </button>
          </div>

          {/* Sincronizar Google */}
          <button
            type="button"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface-color)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: isSyncing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={13} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </header>

      {/* Banner de Estado flotante/condicional */}
      {statusMessage && (
        <div
          style={{
            padding: "0.6rem 1rem",
            backgroundColor:
              statusMessage.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            borderBottom: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: statusMessage.type === "success" ? "#10b981" : "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* 2. CUERPO PRINCIPAL (SIDEBAR + CALENDARIO SEMANAL) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Barra lateral Google Calendar Style */}
        {isSidebarVisible && (
          <aside
            style={{
              width: "250px",
              minWidth: "250px",
              maxWidth: "250px",
              borderRight: "1px solid var(--border-color)",
              overflowY: "auto",
              backgroundColor: "var(--surface-color)",
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
              onOpenNewEvent={handleOpenNewEvent}
            />
          </aside>
        )}

        {/* Cuadrícula o Lista */}
        <div
          style={{
            flex: "1 1 0%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "0.4rem 0.5rem",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", opacity: 0.6 }}>
              Cargando eventos del calendario...
            </div>
          ) : viewMode === "week" ? (
            <WeeklyCalendarView
              weekDays={weekDays}
              meetings={filteredMeetings}
              onSelectMeeting={(m) => setSelectedMeetingDetail(m)}
              selectedCalendarDay={selectedCalendarDay}
              onSelectDay={(dStr) => setSelectedCalendarDay(selectedCalendarDay === dStr ? null : dStr)}
              onDragCreate={handleDragCreate}
            />
          ) : (
            /* Vista de lista */
            <div
              style={{
                backgroundColor: "var(--surface-color)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                overflowY: "auto",
                flex: 1,
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

      {/* MODAL DE CREACIÓN MANUAL DE EVENTOS */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDate={createModalData.date}
        initialStartTime={createModalData.startTime}
        initialEndTime={createModalData.endTime}
        isGoogleConnected={googleAuth.connected}
        onEventCreated={handleEventCreated}
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
