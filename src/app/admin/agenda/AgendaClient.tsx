"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./agenda.module.css";
import {
  AgendaAppointment,
  createAgendaAppointment,
  updateAgendaAppointmentStatus,
  deleteAgendaAppointment,
  saveAgencyCalendarSettings,
  syncAgencyGoogleEventsAction,
  disconnectAgencyGoogle,
} from "@/actions/agendaActions";
import { AgencyCalendarConfig } from "@/lib/agencyCalendarStore";
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  Users,
  Plus,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Trash2,
  Search,
  Settings,
  Sparkles,
  Key,
  Wrench,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";

interface AgendaClientProps {
  initialAppointments: AgendaAppointment[];
  initialCalendarSettings: {
    config: AgencyCalendarConfig;
    googleAuth: { connected: boolean; email?: string | null };
  };
  vehicles: Array<{ id: string; brand: string; model: string; year: number }>;
  agencyId: string;
  agencySlug: string;
  agencyName: string;
}

const WEEKDAYS = [
  { id: 1, label: "Lunes", short: "Lun" },
  { id: 2, label: "Martes", short: "Mar" },
  { id: 3, label: "Miércoles", short: "Mié" },
  { id: 4, label: "Jueves", short: "Jue" },
  { id: 5, label: "Viernes", short: "Vie" },
  { id: 6, label: "Sábado", short: "Sáb" },
  { id: 0, label: "Domingo", short: "Dom" },
];

export default function AgendaClient({
  initialAppointments,
  initialCalendarSettings,
  vehicles,
  agencyId,
  agencySlug,
  agencyName,
}: AgendaClientProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [appointments, setAppointments] = useState<AgendaAppointment[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<"calendar" | "list" | "settings">("calendar");
  const [filterType, setFilterType] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Google Calendar state
  const [googleAuth, setGoogleAuth] = useState(initialCalendarSettings.googleAuth);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings form state
  const [config, setConfig] = useState<AgencyCalendarConfig>(initialCalendarSettings.config);
  const [savedSettingsFeedback, setSavedSettingsFeedback] = useState(false);

  // Visual Calendar states
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "test_drive" as AgendaAppointment["event_type"],
    event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    client_name: "",
    client_phone: "",
    client_email: "",
    vehicle_id: "",
    vehicle_title: "",
    notes: "",
  });

  // Read URL query params (?action=new, ?success=google_connected, etc.)
  useEffect(() => {
    const action = searchParams.get("action");
    const lead = searchParams.get("lead");
    const phone = searchParams.get("phone");
    const success = searchParams.get("success");
    const count = searchParams.get("count");

    if (action === "new" || lead || phone) {
      setFormData(prev => ({
        ...prev,
        client_name: lead || prev.client_name,
        client_phone: phone || prev.client_phone,
        title: lead ? `Test Drive con ${lead}` : prev.title,
        event_type: "test_drive",
      }));
      setIsModalOpen(true);
    }

    if (success === "google_connected") {
      setSyncFeedback(
        count ? `¡Google Calendar conectado y sincronizado! (${count} eventos importados)` : "¡Google Calendar conectado con éxito!"
      );
      setGoogleAuth(prev => ({ ...prev, connected: true }));
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  }, [searchParams]);

  // URL del portal público para que los clientes agenden
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicBookingUrl = `${origin}/portal/${agencySlug || "hola"}#agendar`;

  const copyBookingLink = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // KPIs
  const todayStr = new Date().toDateString();
  const todayCount = appointments.filter(a => new Date(a.event_date).toDateString() === todayStr && a.status !== "cancelada").length;
  const testDriveCount = appointments.filter(a => a.event_type === "test_drive" && a.status !== "cancelada").length;
  const deliveryCount = appointments.filter(a => a.event_type === "entrega" && a.status !== "cancelada").length;
  const googleEventsCount = appointments.filter(a => a.is_google_event).length;

  // Filtrado de citas para la vista de lista
  const filteredAppointments = appointments.filter(a => {
    const matchesFilter =
      filterType === "todos"
        ? true
        : filterType === "google"
        ? !!a.is_google_event
        : a.event_type === filterType;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(q) ||
      (a.client_name && a.client_name.toLowerCase().includes(q)) ||
      (a.client_phone && a.client_phone.includes(q)) ||
      (a.vehicle_title && a.vehicle_title.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  // Citas del día seleccionado para el panel lateral del calendario
  const selectedDayAppointments = appointments.filter(a => {
    const aptDate = new Date(a.event_date);
    const y = aptDate.getFullYear();
    const m = String(aptDate.getMonth() + 1).padStart(2, "0");
    const d = String(aptDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return dateStr === selectedDayStr;
  });

  // Guardar nueva cita
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let selectedVehicleTitle = formData.vehicle_title;
    if (formData.vehicle_id) {
      const v = vehicles.find(item => item.id === formData.vehicle_id);
      if (v) selectedVehicleTitle = `${v.brand} ${v.model} (${v.year})`;
    }

    startTransition(async () => {
      const res = await createAgendaAppointment({
        agency_id: agencyId,
        title: formData.title,
        event_type: formData.event_type,
        event_date: new Date(formData.event_date).toISOString(),
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        vehicle_id: formData.vehicle_id || undefined,
        vehicle_title: selectedVehicleTitle,
        notes: formData.notes,
        status: "confirmada",
      });

      if (res.success && res.appointment) {
        setAppointments(prev => [res.appointment, ...prev]);
        setIsModalOpen(false);
        setFormData({
          title: "",
          event_type: "test_drive",
          event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          client_name: "",
          client_phone: "",
          client_email: "",
          vehicle_id: "",
          vehicle_title: "",
          notes: "",
        });
      }
    });
  };

  // Cambiar estado
  const handleStatusChange = (id: string, newStatus: AgendaAppointment["status"]) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
    startTransition(async () => {
      await updateAgendaAppointmentStatus(id, newStatus);
    });
  };

  // Eliminar cita
  const handleDeleteAppointment = (id: string) => {
    if (!confirm("¿Eliminar este turno de la agenda?")) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
    startTransition(async () => {
      await deleteAgendaAppointment(id);
    });
  };

  // Sincronizar Google Calendar
  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAgencyGoogleEventsAction(agencyId);
      if (res.success) {
        setSyncFeedback(res.message || "Eventos sincronizados con éxito.");
        // Refrescar lista de turnos
        const updatedApts = await fetch(`/api/calendar/slots?date=${selectedDayStr}`).catch(() => null);
        window.location.reload();
      } else {
        setSyncFeedback(res.error || "No se pudo sincronizar Google Calendar.");
      }
    } catch (e: any) {
      setSyncFeedback(e?.message || "Error al sincronizar.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Desconectar Google Calendar
  const handleDisconnectGoogle = async () => {
    if (!confirm("¿Desconectar Google Calendar de esta automotora?")) return;
    startTransition(async () => {
      await disconnectAgencyGoogle(agencyId);
      setGoogleAuth({ connected: false });
    });
  };

  // Guardar configuración de horarios
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveAgencyCalendarSettings(agencyId, config);
      if (res.success) {
        setSavedSettingsFeedback(true);
        setTimeout(() => setSavedSettingsFeedback(false), 3000);
      }
    });
  };

  // Toggle de día disponible
  const toggleAvailableDay = (dayId: number) => {
    const currentDays = config.availableDays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId].sort((a, b) => a - b);
    setConfig({ ...config, availableDays: newDays });
  };

  // Helper de badges por tipo
  const renderTypeBadge = (type: AgendaAppointment["event_type"], isGoogle?: boolean) => {
    if (isGoogle) {
      return (
        <span className={styles.typeBadge} style={{ backgroundColor: "rgba(66, 133, 244, 0.12)", color: "#2563eb" }}>
          <CalendarIcon size={13} /> Google Calendar
        </span>
      );
    }
    switch (type) {
      case "test_drive":
        return (
          <span className={styles.typeBadge} style={{ backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
            <Car size={13} /> Test Drive
          </span>
        );
      case "visita":
        return (
          <span className={styles.typeBadge} style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
            <Users size={13} /> Visita Showroom
          </span>
        );
      case "entrega":
        return (
          <span className={styles.typeBadge} style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Key size={13} /> Entrega de Auto
          </span>
        );
      case "service":
        return (
          <span className={styles.typeBadge} style={{ backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
            <Wrench size={13} /> Service / Taller
          </span>
        );
      default:
        return (
          <span className={styles.typeBadge} style={{ backgroundColor: "rgba(128, 128, 128, 0.12)", color: "var(--text-color)" }}>
            <CalendarIcon size={13} /> {type}
          </span>
        );
    }
  };

  // Generador de días del mes para el calendario visual
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // 0 = Domingo -> cambiar a 1 = Lunes
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const calendarDays = [];
  // Días previos de relleno
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isOutside: true,
    });
  }
  // Días del mes
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push({ day: d, month, year, isOutside: false });
  }
  // Días posteriores de relleno para completar múltiplos de 7
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isOutside: true,
    });
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return (
    <div className={styles.agendaContainer}>
      {/* BANNER PRINCIPAL */}
      <div className={styles.topBanner}>
        <div className={styles.headerInfo}>
          <h1>
            <CalendarCheck size={26} style={{ color: "var(--primary)" }} />
            Agenda Inteligente & Calendario
          </h1>
          <p>
            Gestión unificada de citas, test drives y visitas al showroom con sincronización de <strong>Google Calendar</strong> y reservas desde tu web.
          </p>
        </div>

        <div className={styles.headerActions}>
          {googleAuth.connected ? (
            <button
              type="button"
              onClick={handleSyncGoogle}
              disabled={isSyncing}
              className={styles.secondaryBtn}
              title="Traer los últimos eventos de Google Calendar"
            >
              <RefreshCw size={15} className={isSyncing ? "spin" : ""} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Google"}
            </button>
          ) : (
            <a
              href={`/api/auth/google-calendar?agencyId=${agencyId}`}
              className={styles.googleBtn}
              title="Vincular con tu cuenta de Google Calendar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Conectar Google Calendar
            </a>
          )}

          <button
            type="button"
            onClick={copyBookingLink}
            className={styles.secondaryBtn}
            title="Copiar link del formulario web para que tus clientes agenden"
          >
            {copied ? <Check size={16} style={{ color: "var(--primary)" }} /> : <Copy size={16} />}
            {copied ? "¡Link Copiado!" : "Copiar Link Web"}
          </button>

          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
            title="Abrir formulario público de agendamiento"
          >
            <Globe size={15} /> Ver en mi Web
          </a>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.primaryBtn}
          >
            <Plus size={18} /> + Agendar Turno
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div style={{
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          border: "1px solid var(--primary)",
          borderRadius: "10px",
          padding: "0.85rem 1.25rem",
          color: "var(--primary)",
          fontWeight: 700,
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <CheckCircle2 size={18} /> {syncFeedback}
        </div>
      )}

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: "rgba(16, 185, 129, 0.14)", color: "var(--primary)" }}>
            <Clock size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{todayCount}</span>
            <span className={styles.kpiLabel}>Citas para Hoy</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: "rgba(59, 130, 246, 0.14)", color: "#2563eb" }}>
            <Car size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{testDriveCount}</span>
            <span className={styles.kpiLabel}>Test Drives Activos</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: "rgba(245, 158, 11, 0.14)", color: "#d97706" }}>
            <Key size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{deliveryCount}</span>
            <span className={styles.kpiLabel}>Entregas de Unidades</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: "rgba(66, 133, 244, 0.14)", color: "#2563eb" }}>
            <CalendarIcon size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{googleEventsCount}</span>
            <span className={styles.kpiLabel}>Eventos Google Sincronizados</span>
          </div>
        </div>
      </div>

      {/* TABS DE VISTA */}
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`${styles.tabBtn} ${activeTab === "calendar" ? styles.activeTabBtn : ""}`}
        >
          <CalendarIcon size={16} /> Calendario Visual Interactivo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`${styles.tabBtn} ${activeTab === "list" ? styles.activeTabBtn : ""}`}
        >
          <Clock size={16} /> Citas & Turnos del CRM ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`${styles.tabBtn} ${activeTab === "settings" ? styles.activeTabBtn : ""}`}
        >
          <Settings size={16} /> Horarios de Atención & Google Calendar
        </button>
      </div>

      {/* VISTA 1: CALENDARIO VISUAL INTERACTIVO */}
      {activeTab === "calendar" && (
        <div className={styles.calendarViewContainer}>
          {/* CUADRÍCULA MENSUAL */}
          <div className={styles.calendarMainCard}>
            <div className={styles.calendarNavHeader}>
              <span className={styles.monthTitle}>
                {monthNames[month]} {year}
              </span>

              <div className={styles.navControls}>
                <button
                  type="button"
                  onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
                  className={styles.iconBtn}
                  title="Mes anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedDayStr(
                      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
                    );
                  }}
                  className={styles.todayBtn}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
                  className={styles.iconBtn}
                  title="Mes siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className={styles.weekDaysHeader}>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            <div className={styles.calendarDaysGrid}>
              {calendarDays.map((item, idx) => {
                const cellDateStr = `${item.year}-${String(item.month + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
                const isSelected = cellDateStr === selectedDayStr;

                const now = new Date();
                const isToday =
                  item.day === now.getDate() &&
                  item.month === now.getMonth() &&
                  item.year === now.getFullYear();

                const dayApts = appointments.filter(a => {
                  const d = new Date(a.event_date);
                  return (
                    d.getDate() === item.day &&
                    d.getMonth() === item.month &&
                    d.getFullYear() === item.year &&
                    a.status !== "cancelada"
                  );
                });

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDayStr(cellDateStr)}
                    className={`${styles.dayCell} ${item.isOutside ? styles.outsideMonthDay : ""} ${
                      isToday ? styles.todayCell : ""
                    } ${isSelected ? styles.selectedDayCell : ""}`}
                  >
                    <span className={styles.dayNumber}>{item.day}</span>

                    <div className={styles.dayEventsDots}>
                      {dayApts.slice(0, 3).map(apt => (
                        <div
                          key={apt.id}
                          className={styles.eventDotBadge}
                          style={{
                            backgroundColor: apt.is_google_event
                              ? "rgba(66, 133, 244, 0.18)"
                              : apt.event_type === "test_drive"
                              ? "rgba(59, 130, 246, 0.18)"
                              : apt.event_type === "visita"
                              ? "rgba(16, 185, 129, 0.18)"
                              : apt.event_type === "entrega"
                              ? "rgba(245, 158, 11, 0.18)"
                              : "rgba(168, 85, 247, 0.18)",
                            color: apt.is_google_event
                              ? "#1d4ed8"
                              : apt.event_type === "test_drive"
                              ? "#1d4ed8"
                              : apt.event_type === "visita"
                              ? "#047857"
                              : apt.event_type === "entrega"
                              ? "#b45309"
                              : "#7e22ce",
                          }}
                          title={apt.title}
                        >
                          {apt.is_google_event ? "📅 GCal" : apt.title}
                        </div>
                      ))}
                      {dayApts.length > 3 && (
                        <span style={{ fontSize: "0.62rem", opacity: 0.7, fontWeight: 700 }}>
                          +{dayApts.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL LATERAL: DETALLE DEL DÍA SELECCIONADO */}
          <div className={styles.daySidebarCard}>
            <div className={styles.daySidebarHeader}>
              <div>
                <h3>
                  {new Date(selectedDayStr + "T12:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  {selectedDayAppointments.length} turnos programados
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    event_date: `${selectedDayStr}T10:00`,
                  }));
                  setIsModalOpen(true);
                }}
                className={styles.primaryBtn}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
              >
                <Plus size={14} /> + Turno
              </button>
            </div>

            <div className={styles.dayEventsList}>
              {selectedDayAppointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", opacity: 0.5, fontSize: "0.875rem" }}>
                  <CalendarIcon size={32} style={{ margin: "0 auto 0.5rem auto", display: "block", opacity: 0.4 }} />
                  No hay citas ni eventos agendados para este día.
                </div>
              ) : (
                selectedDayAppointments.map(item => {
                  const d = new Date(item.event_date);
                  const timeFormatted = d.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={item.id} className={styles.dayEventCard}>
                      <div className={styles.dayEventTimeRow}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--primary)" }}>
                          <Clock size={13} /> {timeFormatted} hs
                        </span>
                        {item.is_google_event ? (
                          <span className={styles.googleBadge}>
                            <CalendarIcon size={12} /> Google Calendar
                          </span>
                        ) : (
                          renderTypeBadge(item.event_type)
                        )}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{item.title}</div>

                      {item.vehicle_title && (
                        <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Car size={13} /> {item.vehicle_title}
                        </div>
                      )}

                      {item.client_name && (
                        <div style={{ fontSize: "0.82rem", opacity: 0.8 }}>
                          👤 {item.client_name} {item.client_phone ? `(${item.client_phone})` : ""}
                        </div>
                      )}

                      {item.notes && (
                        <div style={{ fontSize: "0.78rem", opacity: 0.65, fontStyle: "italic", marginTop: "0.1rem" }}>
                          &quot;{item.notes}&quot;
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-color)" }}>
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value as any)}
                          className={styles.statusSelect}
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="realizada">Realizada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>

                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {item.client_phone && (
                            <a
                              href={`https://wa.me/${item.client_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hola ${item.client_name || ""}, te contactamos de ${agencyName} por tu cita agendada para el ${d.toLocaleDateString("es-ES")} a las ${timeFormatted} hs.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar WhatsApp al cliente"
                              style={{
                                padding: "0.3rem 0.5rem",
                                borderRadius: "6px",
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                color: "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <MessageSquare size={13} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(item.id)}
                            className={styles.closeBtn}
                            title="Eliminar cita"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: LISTA DE CITAS DEL CRM */}
      {activeTab === "list" && (
        <div className={styles.listContainer}>
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search size={15} style={{ opacity: 0.6 }} />
              <input
                type="text"
                placeholder="Buscar por cliente, auto o teléfono..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterPills}>
              {[
                { id: "todos", label: "Todos" },
                { id: "test_drive", label: "🏎️ Test Drives" },
                { id: "visita", label: "🏢 Showroom" },
                { id: "entrega", label: "🔑 Entregas" },
                { id: "service", label: "🔧 Service" },
                { id: "google", label: "📅 Google Calendar" },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={`${styles.pillBtn} ${filterType === f.id ? styles.activePill : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.appointmentTable}>
              <thead>
                <tr>
                  <th>Fecha & Hora</th>
                  <th>Tipo / Origen</th>
                  <th>Cita / Evento</th>
                  <th>Vehículo de Interés</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
                      No se encontraron turnos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(item => {
                    const d = new Date(item.event_date);
                    const formattedDate = d.toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={item.id} className={styles.appointmentRow}>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Clock size={14} style={{ opacity: 0.6 }} />
                            <span>{formattedDate} hs</span>
                          </div>
                        </td>
                        <td>{renderTypeBadge(item.event_type, item.is_google_event)}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.title}</div>
                          {item.notes && (
                            <div style={{ fontSize: "0.78rem", opacity: 0.7, marginTop: "0.2rem" }}>
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          {item.vehicle_title ? (
                            <span style={{ fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Car size={14} /> {item.vehicle_title}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.5 }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.client_name || "Cliente General"}</div>
                          <div style={{ display: "flex", gap: "0.6rem", fontSize: "0.8rem", opacity: 0.7, marginTop: "0.2rem" }}>
                            {item.client_phone && <span>{item.client_phone}</span>}
                            {item.client_email && <span>• {item.client_email}</span>}
                          </div>
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={e => handleStatusChange(item.id, e.target.value as any)}
                            className={styles.statusSelect}
                            style={{
                              color:
                                item.status === "confirmada"
                                  ? "#059669"
                                  : item.status === "realizada"
                                  ? "#2563eb"
                                  : item.status === "cancelada"
                                  ? "#dc2626"
                                  : "#d97706",
                            }}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="realizada">Realizada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {item.client_phone && (
                              <a
                                href={`https://wa.me/${item.client_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                  `Hola ${item.client_name || ""}, te contactamos de ${agencyName} por tu turno del ${formattedDate}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Enviar mensaje de WhatsApp"
                                style={{
                                  padding: "0.4rem",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                                  color: "var(--primary)",
                                  display: "flex",
                                }}
                              >
                                <MessageSquare size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAppointment(item.id)}
                              title="Eliminar turno"
                              className={styles.closeBtn}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: CONFIGURACIÓN DE HORARIOS & GOOGLE CALENDAR */}
      {activeTab === "settings" && (
        <div className={styles.settingsCard}>
          <div>
            <h2>Configuración de Horarios de Atención & Google Calendar</h2>
            <p style={{ color: "var(--text-color)", opacity: 0.7, fontSize: "0.9rem", marginTop: "0.4rem" }}>
              Define los días y rangos en los que tu automotora atiende al público. Cuando tus clientes ingresen a agendar en la web, el sistema solo les ofrecerá los horarios que marcaste como disponibles aquí y bloqueará los que tengas ocupados en tu Google Calendar.
            </p>
          </div>

          {/* SECCIÓN 1: GOOGLE CALENDAR */}
          <div className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sincronización con Google Calendar
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.75 }}>
              Al conectar Google Calendar, tus reuniones y eventos personales se importan automáticamente al CRM y bloquean los horarios para que ningún cliente reserve en un momento en que estés ocupado.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                {googleAuth.connected ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "var(--primary)",
                      fontWeight: 800,
                      padding: "0.3rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}>
                      <Check size={14} /> Conectado exitosamente
                    </span>
                    {googleAuth.email && (
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.8 }}>
                        ({googleAuth.email})
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                    No has vinculado una cuenta de Google Calendar todavía.
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {googleAuth.connected ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncGoogle}
                      disabled={isSyncing}
                      className={styles.secondaryBtn}
                    >
                      <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
                      {isSyncing ? "Sincronizando..." : "Sincronizar Ahora"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className={styles.secondaryBtn}
                      style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <a
                    href={`/api/auth/google-calendar?agencyId=${agencyId}`}
                    className={styles.googleBtn}
                  >
                    Conectar con Google
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FORMULARIO DE HORARIOS */}
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>
                <Clock size={18} style={{ color: "var(--primary)" }} />
                Días y Horarios Disponibles para Clientes
              </h3>

              <div className={styles.inputGroup}>
                <label>Días de la semana habilitados para agendar citas:</label>
                <div className={styles.daysToggleGrid}>
                  {WEEKDAYS.map(w => {
                    const isActive = (config.availableDays || []).includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleAvailableDay(w.id)}
                        className={`${styles.dayToggleBtn} ${isActive ? styles.dayToggleActive : ""}`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Horario de Apertura (Inicio):</label>
                  <input
                    type="time"
                    value={config.startTime || "09:00"}
                    onChange={e => setConfig({ ...config, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Horario de Cierre (Fin):</label>
                  <input
                    type="time"
                    value={config.endTime || "19:00"}
                    onChange={e => setConfig({ ...config, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Duración estimada de cada cita / test drive:</label>
                  <select
                    value={config.slotDurationMinutes || 30}
                    onChange={e => setConfig({ ...config, slotDurationMinutes: Number(e.target.value) })}
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos (Recomendado)</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Anticipación máxima para que agenden clientes:</label>
                  <select
                    value={config.displayDaysAhead || 14}
                    onChange={e => setConfig({ ...config, displayDaysAhead: Number(e.target.value) })}
                  >
                    <option value={7}>Próximos 7 días</option>
                    <option value={14}>Próximos 14 días (2 semanas)</option>
                    <option value={30}>Próximos 30 días (1 mes)</option>
                    <option value={60}>Próximos 60 días</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                type="submit"
                disabled={isPending}
                className={styles.primaryBtn}
              >
                {isPending ? "Guardando..." : "Guardar Configuración de Horarios"}
              </button>

              {savedSettingsFeedback && (
                <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Check size={16} /> ¡Horarios guardados exitosamente!
                </span>
              )}
            </div>
          </form>

          {/* SECCIÓN 3: ENLACE PÚBLICO DEL SITIO WEB */}
          <div className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>
              <Globe size={18} style={{ color: "var(--primary)" }} />
              Formulario de Agendamiento en tu Sitio Web
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.75 }}>
              Tus clientes pueden agendar visitas y test drives directamente desde la página web de tu automotora. Puedes compartirles este enlace o invitarles a usar el formulario web:
            </p>

            <div className={styles.inputWithPrefix}>
              <span className={styles.prefix}>Web</span>
              <input type="text" readOnly value={publicBookingUrl} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={copyBookingLink}
                className={styles.secondaryBtn}
              >
                {copied ? <Check size={15} style={{ color: "var(--primary)" }} /> : <Copy size={15} />}
                {copied ? "¡Enlace Copiado!" : "Copiar Enlace"}
              </button>

              <a
                href={publicBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryBtn}
              >
                <ExternalLink size={15} /> Abrir Página Web de Reservas
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO TURNO / AGENDAR CITA MANUAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>+ Agendar Nuevo Turno / Cita</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAppointment}>
              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label>Título de la Cita *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Test Drive - Toyota Hilux"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Tipo de Evento *</label>
                    <select
                      value={formData.event_type}
                      onChange={e => setFormData({ ...formData, event_type: e.target.value as any })}
                    >
                      <option value="test_drive">🏎️ Test Drive</option>
                      <option value="visita">🏢 Visita a Showroom</option>
                      <option value="entrega">🔑 Entrega de Auto</option>
                      <option value="service">🔧 Service / Taller</option>
                      <option value="reunion">📅 Reunión</option>
                      <option value="llamada">📞 Llamada</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Fecha y Hora *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.event_date}
                      onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Vehículo Asociado (Opcional)</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                  >
                    <option value="">-- Ninguno / Consulta general --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Nombre del Cliente</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={formData.client_name}
                      onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ej. +598 99 123 456"
                      value={formData.client_phone}
                      onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email del Cliente</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formData.client_email}
                    onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Notas / Requerimientos</label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones de la cita, documentación a solicitar..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--surface-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.secondaryBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.primaryBtn}
                >
                  {isPending ? "Guardando..." : "Confirmar y Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
