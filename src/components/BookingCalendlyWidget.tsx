"use client";

import { useState, useEffect, useTransition } from "react";
import styles from "./BookingCalendlyWidget.module.css";
import {
  getSuperadminCalendarSettings,
  getAvailableBookingSlots,
  bookMeetingFromLanding,
} from "@/actions/superadminCalendarActions";
import { SuperadminCalendarConfig, SuperadminMeeting } from "@/lib/superadminCalendarStore";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function BookingCalendlyWidget() {
  // Configuración cargada desde el Superadmin
  const [config, setConfig] = useState<SuperadminCalendarConfig>({
    availableDays: [1, 2, 3, 4, 5],
    displayDaysAhead: 14,
    meetingDurationMinutes: 30,
    consultationHours: { startTime: "09:00", endTime: "18:00" },
  });
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Estados del calendario
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // "YYYY-MM-DD"
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Estados de selección de horario y formulario
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"calendar" | "form" | "confirmed">("calendar");

  // Campos del formulario
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos de la reunión confirmada
  const [confirmedMeeting, setConfirmedMeeting] = useState<SuperadminMeeting | null>(null);

  // 1. Cargar configuración del Superadmin al montar
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await getSuperadminCalendarSettings();
        if (res && res.config) {
          setConfig(res.config);
        }
      } catch (e) {
        console.error("Error cargando configuración de agenda:", e);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  // 2. Al seleccionar una fecha, consultar horarios disponibles
  const handleSelectDate = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setIsLoadingSlots(true);
    setSlotsError(null);

    try {
      const res = await getAvailableBookingSlots(dateStr);
      if (res.success && Array.isArray(res.slots)) {
        setAvailableSlots(res.slots);
        if (res.slots.length === 0) {
          setSlotsError("No hay horarios disponibles para esta fecha.");
        }
      } else {
        setAvailableSlots([]);
        setSlotsError(res.reason || "Día no disponible para consultas.");
      }
    } catch (e) {
      console.error("Error al consultar horarios disponibles:", e);
      setSlotsError("Error al cargar horarios. Por favor intenta de nuevo.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // 3. Al seleccionar un horario
  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setCurrentStep("form");
  };

  // 4. Enviar formulario de agendamiento
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim() || !clientEmail.trim()) {
      setFormError("Por favor completa tu nombre y correo electrónico.");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      setFormError("Por favor selecciona una fecha y horario.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookMeetingFromLanding({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        agencyName: agencyName.trim(),
        notes: notes.trim(),
        date: selectedDate,
        time: selectedSlot,
      });

      if (res.success && res.meeting) {
        setConfirmedMeeting(res.meeting);
        setCurrentStep("confirmed");
      } else {
        setFormError(res.error || "No se pudo agendar la reunión. Por favor intenta de nuevo.");
      }
    } catch (err) {
      console.error("Error al procesar reserva:", err);
      setFormError("Ocurrió un error inesperado al reservar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Generar enlace de Google Calendar para la reunión confirmada
  const getGoogleCalendarAddUrl = () => {
    if (!confirmedMeeting) return "#";
    const title = encodeURIComponent(confirmedMeeting.title);
    const details = encodeURIComponent(
      `Asesoría comercial y demo en vivo de N-Autos.\nEnlace a Google Meet: ${confirmedMeeting.meetUrl || ""}`
    );
    const location = encodeURIComponent(confirmedMeeting.meetUrl || "Google Meet");

    // Formato Google Calendar: YYYYMMDDTHHmmssZ
    const startIso = new Date(confirmedMeeting.start)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(confirmedMeeting.end)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  // Helpers de Calendario
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + (config.displayDaysAhead || 14));

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
  // Ajustar para que Lunes sea el primer día de la semana visual (0 = Lun, 6 = Dom)
  const startingDay = (firstDayIndex + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setCurrentMonthDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setCurrentMonthDate(next);
  };

  // Formato amigable de fecha seleccionada
  const formatFriendlyDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className={styles.bookingContainer}>
      {/* PANEL IZQUIERDO: Información del Evento */}
      <div className={styles.leftPanel}>
        <div className={styles.hostBadge}>
          <div className={styles.hostAvatar}>N</div>
          <div className={styles.hostDetails}>
            <h4>N-Autos Asesoría</h4>
            <span>Mauricio Negrin · Fundador</span>
          </div>
        </div>

        <h2 className={styles.meetingTitle}>
          Asesoría Estratégica & Demo de Plataforma
        </h2>

        <div className={styles.metaList}>
          <div className={styles.metaItem}>
            <Clock size={18} className={styles.metaIcon} />
            <span>{config.meetingDurationMinutes} minutos</span>
          </div>
          <div className={styles.metaItem}>
            <Video size={18} className={styles.metaIcon} />
            <span>Google Meet (videollamada 1 a 1)</span>
          </div>
          <div className={styles.metaItem}>
            <Globe size={18} className={styles.metaIcon} />
            <span>Zona horaria: Montevideo / Bs. As. (GMT-3)</span>
          </div>
        </div>

        <p className={styles.meetingDescription}>
          Agendá una reunión de 30 minutos para analizar el flujo digital de tu automotora,
          ver la plataforma en vivo y resolver cualquier duda técnica o comercial.
        </p>
      </div>

      {/* PANEL DERECHO: Paso 1 (Calendario), Paso 2 (Formulario) o Paso 3 (Confirmado) */}
      <div className={styles.rightPanel}>
        {/* PASO 1: SELECCIÓN DE DÍA Y HORA */}
        {currentStep === "calendar" && (
          <div>
            <h3 className={styles.stepTitle}>Selecciona una fecha y horario</h3>

            <div style={{ display: "grid", gridTemplateColumns: selectedDate ? "1.2fr 1fr" : "1fr", gap: "1.5rem" }}>
              {/* Calendario Mensual */}
              <div className={styles.calendarWrapper}>
                <div className={styles.calendarNav}>
                  <span className={styles.monthLabel}>
                    {currentMonthDate.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={handlePrevMonth}
                      disabled={month <= today.getMonth() && year <= today.getFullYear()}
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={handleNextMonth}
                      aria-label="Mes siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.calendarGrid}>
                  {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
                    <div key={d} className={styles.dayHeader}>
                      {d}
                    </div>
                  ))}

                  {/* Celdas vacías antes del primer día del mes */}
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Celdas con los días del mes */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const thisDate = new Date(year, month, dayNumber);
                    thisDate.setHours(0, 0, 0, 0);

                    const dayOfWeek = thisDate.getDay(); // 0 = Dom, 1 = Lun, ...
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

                    const isPast = thisDate < today;
                    const isBeyondMax = thisDate > maxDate;
                    const isAllowedDay = config.availableDays.includes(dayOfWeek);
                    const isDisabled = isPast || isBeyondMax || !isAllowedDay;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectDate(dateStr)}
                        className={`${styles.dayCell} ${isSelected ? styles.dayCellSelected : ""} ${
                          isDisabled ? styles.dayCellDisabled : ""
                        }`}
                      >
                        {dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horarios Disponibles */}
              {selectedDate && (
                <div>
                  <div className={styles.slotsHeader}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "capitalize" }}>
                      {formatFriendlyDate(selectedDate)}
                    </span>
                  </div>

                  {isLoadingSlots ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "0.5rem", opacity: 0.7 }}>
                      <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: "0.85rem" }}>Buscando horarios sincronizados...</span>
                    </div>
                  ) : slotsError ? (
                    <div style={{ padding: "1.5rem 1rem", textAlign: "center", backgroundColor: "rgba(239, 68, 68, 0.05)", borderRadius: "10px", border: "1px dashed rgba(239, 68, 68, 0.2)", fontSize: "0.85rem", color: "#ef4444" }}>
                      {slotsError}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: "1.5rem 1rem", textAlign: "center", opacity: 0.6, fontSize: "0.85rem" }}>
                      No hay horarios libres para esta fecha.
                    </div>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectSlot(slot)}
                          className={styles.slotButton}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: FORMULARIO DE ASISTENTE */}
        {currentStep === "form" && (
          <div>
            <button
              type="button"
              onClick={() => setCurrentStep("calendar")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "1rem",
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Cambiar fecha u horario
            </button>

            <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "10px", backgroundColor: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color)" }}>
                📅 {selectedDate && formatFriendlyDate(selectedDate)} a las {selectedSlot} hs
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: "2px" }}>
                Duración: {config.meetingDurationMinutes} min · Sala Google Meet
              </div>
            </div>

            <form onSubmit={handleSubmitBooking} className={styles.bookingForm}>
              {formError && (
                <div style={{ padding: "0.75rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "0.85rem", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tu Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="juan@tuautomotora.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={styles.formInput}
                />
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  Te enviaremos la confirmación y el enlace de Google Meet a este email.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+598 99 123 456"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de tu Automotora</label>
                <input
                  type="text"
                  placeholder="Ej: Automotora del Parque"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>¿Qué te gustaría ver en la reunión? (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cómo funciona la sincronización con MercadoLibre y la gestión de vendedores..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.formInput}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Agendando tu reunión por Google Meet...
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    Confirmar Reunión por Google Meet
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN EXITOSA */}
        {currentStep === "confirmed" && confirmedMeeting && (
          <div className={styles.successCard}>
            <div className={styles.successIconBadge}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.4rem", fontWeight: 800 }}>
              ¡Reunión Agendada con Éxito!
            </h3>

            <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.95rem", opacity: 0.8, maxWidth: "420px" }}>
              Te esperamos el{" "}
              <strong>
                {selectedDate && formatFriendlyDate(selectedDate)} a las {confirmedMeeting.time} hs
              </strong>
              . Se envió una invitación por correo a <strong>{confirmedMeeting.clientEmail}</strong>.
            </p>

            {confirmedMeeting.meetUrl && (
              <div style={{ margin: "0.5rem 0 1.5rem 0", width: "100%", maxWidth: "420px", padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(26, 115, 232, 0.08)", border: "1px solid rgba(26, 115, 232, 0.2)" }}>
                <span style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "#1a73e8", marginBottom: "0.5rem" }}>
                  Enlace Directo a la Videollamada
                </span>
                <a
                  href={confirmedMeeting.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.meetButton}
                  style={{ width: "100%", boxSizing: "border-box", justifyContent: "center" }}
                >
                  <Video size={18} /> Entrar a Google Meet
                </a>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              <a
                href={getGoogleCalendarAddUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.65rem 1.1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <CalendarPlus size={16} /> Agregar a mi Google Calendar
              </a>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep("calendar");
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setConfirmedMeeting(null);
                  setNotes("");
                }}
                style={{
                  padding: "0.65rem 1.1rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#2563eb",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Agendar otra reunión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
