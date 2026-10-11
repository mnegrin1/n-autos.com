"use client";

import { useState, useEffect, useTransition } from "react";
import styles from "./AgencyBookingWidget.module.css";
import { getAgencyAvailableSlotsAction, bookAgencyAppointmentAction } from "@/actions/agendaActions";
import {
  Clock,
  Calendar,
  Car,
  MapPin,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  MessageSquare,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";

interface AgencyBookingWidgetProps {
  agencyId: string;
  agencySlug: string;
  agencyName: string;
  whatsappPhone?: string;
  locationAddress?: string;
  vehicles?: Array<{ id: string; brand: string; model: string; year: number }>;
  defaultVehicleId?: string;
  defaultVehicleTitle?: string;
}

export default function AgencyBookingWidget({
  agencyId,
  agencySlug,
  agencyName,
  whatsappPhone = "+598 99 123 456",
  locationAddress = "Showroom Oficial",
  vehicles = [],
  defaultVehicleId,
  defaultVehicleTitle,
}: AgencyBookingWidgetProps) {
  const [isPending, startTransition] = useTransition();

  // Vehículo seleccionado (opcional)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVehicleId || "");
  const [selectedVehicleTitle, setSelectedVehicleTitle] = useState<string>(defaultVehicleTitle || "");

  // Días y Horarios
  const [availableDaysList, setAvailableDaysList] = useState<
    Array<{ dateStr: string; weekday: string; dayNumber: number; monthName: string }>
  >([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; startIso: string; endIso: string }>>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

  // Formulario simple
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Estado de Confirmación
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    date: string;
    time: string;
    startIso: string;
    endIso: string;
    vehicleTitle?: string;
  } | null>(null);

  // Generar los próximos 14 días
  useEffect(() => {
    const list = [];
    const weekdaysNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      let weekdayLabel = weekdaysNames[d.getDay()];
      if (i === 0) weekdayLabel = "Hoy";
      else if (i === 1) weekdayLabel = "Mañana";

      list.push({
        dateStr,
        weekday: weekdayLabel,
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
      });
    }

    setAvailableDaysList(list);
    if (list.length > 0) {
      setSelectedDateStr(list[0].dateStr);
    }
  }, []);

  // Consultar disponibilidad en tiempo real (respetando horarios de la automotora y Google Calendar)
  useEffect(() => {
    if (!selectedDateStr) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setSlotsMessage(null);
    setSelectedSlotTime("");

    async function fetchSlots() {
      try {
        const res = await getAgencyAvailableSlotsAction({
          agencyId,
          dateStr: selectedDateStr,
        });

        if (!isMounted) return;

        if (res.success && res.slots && res.slots.length > 0) {
          setAvailableSlots(res.slots);
          setSlotsMessage(null);
        } else {
          setAvailableSlots([]);
          setSlotsMessage(res.reason || "No hay horarios disponibles para esta fecha. Elige otro día.");
        }
      } catch (err) {
        if (!isMounted) return;
        setAvailableSlots([]);
        setSlotsMessage("No se pudo verificar la disponibilidad para esta fecha.");
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDateStr, agencyId]);

  // Manejar selección de vehículo opcional
  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    if (vId) {
      const v = vehicles.find(item => item.id === vId);
      if (v) setSelectedVehicleTitle(`${v.brand} ${v.model} (${v.year})`);
    } else {
      setSelectedVehicleTitle("");
    }
  };

  // Enviar agendamiento
  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError("Por favor completa tu nombre y teléfono.");
      return;
    }
    if (!selectedSlotTime) {
      setFormError("Por favor selecciona un horario disponible.");
      return;
    }

    startTransition(async () => {
      const res = await bookAgencyAppointmentAction({
        agencyId,
        clientName,
        clientPhone,
        eventType: "visita",
        vehicleId: selectedVehicleId || undefined,
        vehicleTitle: selectedVehicleTitle || undefined,
        date: selectedDateStr,
        time: selectedSlotTime,
        notes: notes || (selectedVehicleTitle ? `Interés en: ${selectedVehicleTitle}` : "Visita al local"),
      });

      if (res.success && res.appointment) {
        setIsConfirmed(true);
        setConfirmedDetails({
          date: selectedDateStr,
          time: selectedSlotTime,
          startIso: res.appointment.event_date,
          endIso: res.appointment.end_date || res.appointment.event_date,
          vehicleTitle: selectedVehicleTitle,
        });
      } else {
        setFormError((res as any)?.error || "No se pudo agendar la visita. Intenta nuevamente.");
      }
    });
  };

  // Enlace para agregar a Google Calendar
  const getGoogleCalendarAddUrl = () => {
    if (!confirmedDetails) return "#";
    const title = encodeURIComponent(`Visita a ${agencyName}`);
    const details = encodeURIComponent(
      `Visita al showroom de ${agencyName}.${confirmedDetails.vehicleTitle ? `\nVehículo de interés: ${confirmedDetails.vehicleTitle}` : ""}\nDirección: ${locationAddress}`
    );
    const location = encodeURIComponent(locationAddress || agencyName);

    const toGCalIso = (isoStr: string) =>
      new Date(isoStr).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const start = toGCalIso(confirmedDetails.startIso);
    const end = toGCalIso(confirmedDetails.endIso);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const cleanWhatsapp = whatsappPhone.replace(/\D/g, "");

  return (
    <div id="agendar" className={styles.bookingCard}>
      {/* CABECERA MINIMALISTA */}
      <div className={styles.header}>
        <span className={styles.eyebrowBadge}>
          <MapPin size={12} /> Visita al local
        </span>
        <h2 className={styles.title}>Agenda tu visita al local</h2>
        <p className={styles.subtitle}>
          Elige el día y la hora que mejor te quede para recibirte en nuestro showroom.
        </p>
      </div>

      {isConfirmed && confirmedDetails ? (
        /* PANTALLA DE CONFIRMACIÓN ULTRA LIMPIA */
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "var(--primary, #10b981)" }}>
            ¡Tu visita está confirmada!
          </h3>

          <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8, maxWidth: "420px" }}>
            Te esperamos en <strong>{agencyName}</strong> para atenderte de forma personalizada.
          </p>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.65 }}>Fecha & Hora:</span>
              <strong style={{ color: "var(--primary, #10b981)", fontSize: "0.95rem" }}>
                {confirmedDetails.date} • {confirmedDetails.time} hs
              </strong>
            </div>

            {confirmedDetails.vehicleTitle && (
              <div className={styles.summaryRow}>
                <span style={{ opacity: 0.65 }}>Vehículo de interés:</span>
                <strong>{confirmedDetails.vehicleTitle}</strong>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.65 }}>Lugar:</span>
              <span>{locationAddress}</span>
            </div>
          </div>

          <div className={styles.actionsRow}>
            <a
              href={getGoogleCalendarAddUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.googleCalBtn}`}
            >
              <CalendarPlus size={15} /> Agregar a Google Calendar
            </a>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Hola ${agencyName}, acabo de agendar una visita al local para el ${confirmedDetails.date} a las ${confirmedDetails.time} hs.${confirmedDetails.vehicleTitle ? ` Me interesa ver el ${confirmedDetails.vehicleTitle}.` : ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            >
              <MessageSquare size={15} /> Confirmar por WhatsApp
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsConfirmed(false);
              setConfirmedDetails(null);
              setSelectedSlotTime("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary, #10b981)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              marginTop: "0.4rem",
            }}
          >
            ← Agendar otra visita
          </button>
        </div>
      ) : (
        /* FORMULARIO SIMPLE Y DIRECTO */
        <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 1. SELECCIÓN DE DÍA */}
          <div className={styles.sectionBlock}>
            <label className={styles.sectionLabel}>
              <Calendar size={14} style={{ color: "var(--primary, #10b981)" }} />
              1. Elige un día
            </label>

            <div className={styles.daysContainer}>
              {availableDaysList.map(item => {
                const isActive = item.dateStr === selectedDateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(item.dateStr)}
                    className={`${styles.dayChip} ${isActive ? styles.dayChipActive : ""}`}
                  >
                    <span className={styles.dayWeekday}>{item.weekday}</span>
                    <span className={styles.dayNumber}>{item.dayNumber}</span>
                    <span className={styles.dayMonth}>{item.monthName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELECCIÓN DE HORARIO DISPONIBLE */}
          <div className={styles.sectionBlock}>
            <label className={styles.sectionLabel}>
              <Clock size={14} style={{ color: "var(--primary, #10b981)" }} />
              2. Elige un horario disponible
            </label>

            <div className={styles.slotsContainer}>
              {isLoadingSlots ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
                  <Loader2 size={16} className="spin" />
                  <span>Verificando disponibilidad...</span>
                </div>
              ) : slotsMessage ? (
                <div className={styles.emptySlots}>{slotsMessage}</div>
              ) : availableSlots.length === 0 ? (
                <div className={styles.emptySlots}>No hay turnos disponibles para esta fecha. Elige otro día.</div>
              ) : (
                availableSlots.map(slot => {
                  const isActive = selectedSlotTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`${styles.slotChip} ${isActive ? styles.slotChipActive : ""}`}
                    >
                      {slot.time} hs
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. DATOS BÁSICOS DEL CLIENTE + VEHÍCULO OPCIONAL */}
          <div className={styles.sectionBlock}>
            <label className={styles.sectionLabel}>
              <User size={14} style={{ color: "var(--primary, #10b981)" }} />
              3. Tus datos de contacto
            </label>

            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  className={styles.inputControl}
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +598 99 123 456"
                  className={styles.inputControl}
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>

              {/* VEHÍCULO OPCIONAL */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>
                  <Car size={13} /> Vehículo de interés <span className={styles.optionalTag}>(Opcional)</span>
                </label>
                {vehicles.length > 0 ? (
                  <select
                    className={styles.inputControl}
                    value={selectedVehicleId}
                    onChange={e => handleVehicleChange(e.target.value)}
                  >
                    <option value="">-- Cualquiera / Consulta general en el local --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ej: Audi A4, camioneta 4x4, etc. (Opcional)"
                    className={styles.inputControl}
                    value={selectedVehicleTitle}
                    onChange={e => setSelectedVehicleTitle(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.82rem" }}>
              ⚠️ {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !selectedSlotTime}
            className={styles.submitBtn}
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="spin" /> Agendando tu visita...
              </>
            ) : selectedSlotTime ? (
              <>
                Confirmar Visita al Local ({selectedSlotTime} hs) <ArrowRight size={16} />
              </>
            ) : (
              "Selecciona un horario para confirmar"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
