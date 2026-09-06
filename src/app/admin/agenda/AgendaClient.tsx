"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./agenda.module.css";
import {
  AgendaAppointment,
  createAgendaAppointment,
  updateAgendaAppointmentStatus,
  deleteAgendaAppointment,
  saveCalcomSettings,
} from "@/actions/agendaActions";
import {
  Calendar,
  Clock,
  Car,
  Users,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Phone,
  MessageSquare,
  Trash2,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  FileText,
  Key,
  Wrench,
} from "lucide-react";

interface AgendaClientProps {
  initialAppointments: AgendaAppointment[];
  initialCalcomSettings: { calcom_link: string; calcom_active: boolean };
  vehicles: Array<{ id: string; brand: string; model: string; year: number }>;
  agencyId: string;
  agencyName: string;
}

export default function AgendaClient({
  initialAppointments,
  initialCalcomSettings,
  vehicles,
  agencyId,
  agencyName,
}: AgendaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [appointments, setAppointments] = useState<AgendaAppointment[]>(initialAppointments);
  const [calcomLink, setCalcomLink] = useState(initialCalcomSettings.calcom_link || "demo-automotora/test-drive");
  const [activeTab, setActiveTab] = useState<"calcom" | "list" | "settings">("calcom");
  const [filterType, setFilterType] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

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

  // Settings form
  const [settingsInput, setSettingsInput] = useState(calcomLink);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Read URL query params (?action=new&lead=...&phone=...)
  useEffect(() => {
    const action = searchParams.get("action");
    const lead = searchParams.get("lead");
    const phone = searchParams.get("phone");

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
  }, [searchParams]);

  // Clean Cal.com link helper
  const cleanLink = calcomLink
    .trim()
    .replace(/^https?:\/\/(app\.)?cal\.com\//i, "")
    .replace(/^\/+|\/+$/g, "");

  const fullCalcomUrl = `https://cal.com/${cleanLink}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(fullCalcomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // KPIs
  const todayStr = new Date().toDateString();
  const todayCount = appointments.filter(a => new Date(a.event_date).toDateString() === todayStr).length;
  const testDriveCount = appointments.filter(a => a.event_type === "test_drive" && a.status !== "cancelada").length;
  const deliveryCount = appointments.filter(a => a.event_type === "entrega" && a.status !== "cancelada").length;
  const showroomVisitsCount = appointments.filter(a => a.event_type === "visita" && a.status !== "cancelada").length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchesFilter = filterType === "todos" || a.event_type === filterType;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(q) ||
      (a.client_name && a.client_name.toLowerCase().includes(q)) ||
      (a.client_phone && a.client_phone.includes(q)) ||
      (a.vehicle_title && a.vehicle_title.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Handle Save Appointment
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

  // Handle Status Change
  const handleStatusChange = (id: string, newStatus: AgendaAppointment["status"]) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
    startTransition(async () => {
      await updateAgendaAppointmentStatus(id, newStatus);
    });
  };

  // Handle Delete
  const handleDeleteAppointment = (id: string) => {
    if (!confirm("¿Eliminar este turno de la agenda?")) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
    startTransition(async () => {
      await deleteAgendaAppointment(id);
    });
  };

  // Handle Save Cal.com Settings
  const handleSaveCalcomSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCalcomSettings(agencyId, {
        calcom_link: settingsInput,
        calcom_active: true,
      });
      if (res.success) {
        setCalcomLink(settingsInput);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3000);
      }
    });
  };

  // Type helper badge
  const renderTypeBadge = (type: AgendaAppointment["event_type"]) => {
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
            <Calendar size={13} /> {type}
          </span>
        );
    }
  };

  return (
    <div className={styles.agendaContainer}>
      {/* BANNER PRINCIPAL */}
      <div className={styles.topBanner}>
        <div className={styles.headerInfo}>
          <h1>
            <Calendar size={26} style={{ color: "var(--primary)" }} />
            Agenda Electrónica & Turnos
          </h1>
          <p>
            Agendamiento inteligente de Test Drives, visitas al showroom y entregas de unidades integrado con <strong>Cal.com</strong>.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={copyPublicLink}
            className={styles.secondaryBtn}
            title="Copiar enlace de agendamiento para enviar a clientes"
          >
            {copied ? <Check size={16} style={{ color: "var(--primary)" }} /> : <Copy size={16} />}
            {copied ? "¡Enlace Copiado!" : "Copiar Link Cal.com"}
          </button>

          <a
            href={fullCalcomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
            title="Abrir página de reservas en Cal.com"
          >
            <ExternalLink size={16} /> Abrir en Cal.com
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
            <span className={styles.kpiLabel}>Entregas de Vehículos</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: "rgba(168, 85, 247, 0.14)", color: "#9333ea" }}>
            <Users size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{showroomVisitsCount}</span>
            <span className={styles.kpiLabel}>Visitas a Showroom</span>
          </div>
        </div>
      </div>

      {/* TABS DE VISTA */}
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab("calcom")}
          className={`${styles.tabBtn} ${activeTab === "calcom" ? styles.activeTabBtn : ""}`}
        >
          <Sparkles size={16} /> Cal.com (Agendador en Vivo)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`${styles.tabBtn} ${activeTab === "list" ? styles.activeTabBtn : ""}`}
        >
          <Calendar size={16} /> Citas & Turnos del CRM ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`${styles.tabBtn} ${activeTab === "settings" ? styles.activeTabBtn : ""}`}
        >
          <Settings size={16} /> Configuración Cal.com
        </button>
      </div>

      {/* VISTA 1: CAL.COM LIVE EMBED */}
      {activeTab === "calcom" && (
        <div className={styles.embedContainer}>
          <div className={styles.embedHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span className={styles.embedBadge}>
                <ShieldCheck size={14} /> Cal.com Sincronizado
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-color)", opacity: 0.8 }}>
                Canal oficial: <strong>cal.com/{cleanLink}</strong>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={copyPublicLink}
                className={styles.secondaryBtn}
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar Enlace"}
              </button>
              <a
                href={fullCalcomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryBtn}
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
              >
                <ExternalLink size={14} /> Abrir Completo
              </a>
            </div>
          </div>

          <iframe
            src={`https://cal.com/${cleanLink}?embed=true&layout=month_view`}
            title="Cal.com Booking Embed"
            className={styles.embedIframe}
            allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
          />
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
                  <th>Tipo</th>
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
                      No se encontraron turnos agendados con los filtros seleccionados.
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
                        <td>{renderTypeBadge(item.event_type)}</td>
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
                                  `Hola ${item.client_name || ""}, te escribimos de ${agencyName} para coordinar tu cita agendada para el ${formattedDate}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Enviar mensaje de WhatsApp al cliente"
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
                              title="Eliminar cita"
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

      {/* VISTA 3: CONFIGURACIÓN CAL.COM */}
      {activeTab === "settings" && (
        <div className={styles.settingsCard}>
          <div>
            <h2>Configuración de Cal.com para tu Concesionario</h2>
            <p style={{ color: "var(--text-color)", opacity: 0.7, fontSize: "0.9rem", marginTop: "0.4rem" }}>
              Vincula tu cuenta oficial de <strong>Cal.com</strong> para que los clientes puedan agendar visitas y pruebas de manejo directamente con tus horarios disponibles sincronizados en tiempo real.
            </p>
          </div>

          <form onSubmit={handleSaveCalcomSettings} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className={styles.inputGroup}>
              <label>Enlace público o usuario en Cal.com</label>
              <div className={styles.inputWithPrefix}>
                <span className={styles.prefix}>https://cal.com/</span>
                <input
                  type="text"
                  placeholder="tu-automotora/test-drive"
                  value={settingsInput}
                  onChange={e => setSettingsInput(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: "0.78rem", opacity: 0.6, marginTop: "0.2rem" }}>
                Puedes ingresar tu usuario (ej. <code>automotora-nacional</code>) o un evento específico (ej. <code>automotora-nacional/test-drive-30min</code>).
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                type="submit"
                disabled={isPending}
                className={styles.primaryBtn}
              >
                {isPending ? "Guardando..." : "Guardar Configuración"}
              </button>
              {savedFeedback && (
                <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Check size={16} /> ¡Configuración guardada exitosamente!
                </span>
              )}
            </div>
          </form>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "0.5rem 0" }} />

          <div style={{ backgroundColor: "rgba(128, 128, 128, 0.04)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Sparkles size={16} style={{ color: "var(--primary)" }} /> ¿Cómo configurar tu cuenta en Cal.com?
            </h4>
            <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", lineHeight: 1.6, opacity: 0.85 }}>
              <li>Crea una cuenta gratuita en <a href="https://cal.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>cal.com</a>.</li>
              <li>Conecta tu calendario habitual (Google Calendar, Outlook o iCloud) para evitar superposición de turnos.</li>
              <li>Crea un tipo de evento llamado <strong>&quot;Test Drive Automotora&quot;</strong> (ej. de 30 o 45 minutos) y configura tus horarios de atención.</li>
              <li>Copia tu enlace generado y pégalo en el campo superior para activar el agendamiento instantáneo.</li>
            </ol>
          </div>
        </div>
      )}

      {/* MODAL NUEVO TURNO / AGENDAR CITA */}
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
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Tipo de Evento</label>
                    <select
                      value={formData.event_type}
                      onChange={e => setFormData({ ...formData, event_type: e.target.value as any })}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="test_drive">🏎️ Test Drive (Prueba de Manejo)</option>
                      <option value="visita">🏢 Visita al Showroom</option>
                      <option value="entrega">🔑 Entrega de Vehículo</option>
                      <option value="service">🔧 Service / Taller</option>
                      <option value="reunion">📝 Firma / Documentación</option>
                      <option value="llamada">📞 Llamada Comercial</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Fecha y Hora *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.event_date}
                      onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Vehículo de Interés (Opcional)</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={e => {
                      const selId = e.target.value;
                      const matched = vehicles.find(v => v.id === selId);
                      setFormData({
                        ...formData,
                        vehicle_id: selId,
                        vehicle_title: matched ? `${matched.brand} ${matched.model} (${matched.year})` : "",
                      });
                    }}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="">-- Sin vehículo específico asignado --</option>
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
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ej. +598 99 123 456"
                      value={formData.client_phone}
                      onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Notas / Indicaciones</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Traer libreta de conducir, interesado en permuta..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      resize: "vertical",
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
