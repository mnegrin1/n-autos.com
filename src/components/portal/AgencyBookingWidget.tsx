"use client";

import { useState, useEffect, useTransition } from "react";
import styles from "./AgencyBookingWidget.module.css";
import { getAgencyAvailableSlotsAction, bookAgencyAppointmentAction } from "@/actions/agendaActions";
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  Users,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  MessageSquare,
  Sparkles,
  Key,
  ShieldCheck,
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

const APPOINTMENT_TYPES = [
  { id: "test_drive", label: "Test Drive", icon: Car, desc: "Prueba de manejo" },
  { id: "visita", label: "Visita al Showroom", icon: Users, desc: "Conocer las unidades" },
  { id: "tasacion", label: "Tasación de mi Usado", icon: Key, desc: "Cotizar tu vehículo" },
  { id: "entrega", label: "Entrega / Retiro", icon: ShieldCheck, desc: "Coordinar entrega" },
  { id: "reunion", label: "Asesoría Comercial", icon: Sparkles, desc: "Planes y financiación" },
];

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

  // Estados del flujo
  const [eventType, setEventType] = useState<string>("test_drive");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVehicleId || "");
  const [selectedVehicleTitle, setSelectedVehicleTitle] = useState<string>(defaultVehicleTitle || "");

  // Generación de los próximos 14 días
  const [availableDaysList, setAvailableDaysList] = useState<Array<{ dateStr: string; weekday: string; dayNumber: number; monthName: string }>>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  // Slots
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; startIso: string; endIso: string }>>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

  // Formulario
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Resultado
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    title: string;
    date: string;
    time: string;
    startIso: string;
    endIso: string;
  } | null>(null);

  // Inicializar días hacia adelante
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

      list.push({
        dateStr,
        weekday: weekdaysNames[d.getDay()],
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
      });
    }

    setAvailableDaysList(list);
    if (list.length > 0) {
      setSelectedDateStr(list[0].dateStr);
    }
  }, []);

  // Consultar disponibilidad al cambiar la fecha seleccionada
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
          setSlotsMessage(res.reason || "No hay horarios disponibles para esta fecha.");
        }
      } catch (err) {
        if (!isMounted) return;
        setAvailableSlots([]);
        setSlotsMessage("No se pudo verificar la disponibilidad. Por favor intenta con otra fecha.");
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDateStr, agencyId]);

  // Actualizar vehículo seleccionado
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
      setFormError("Por favor completa tu nombre y teléfono de contacto.");
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
        clientEmail,
        eventType: eventType as any,
        vehicleId: selectedVehicleId || undefined,
        vehicleTitle: selectedVehicleTitle || undefined,
        date: selectedDateStr,
        time: selectedSlotTime,
        notes,
      });

      if (res.success && res.appointment) {
        setIsConfirmed(true);
        setConfirmedDetails({
          title: res.appointment.title,
          date: selectedDateStr,
          time: selectedSlotTime,
          startIso: res.appointment.event_date,
          endIso: res.appointment.end_date || res.appointment.event_date,
        });
      } else {
        setFormError((res as any)?.error || "No se pudo agendar la cita. Por favor intenta nuevamente.");
      }
    });
  };

  // Helper de Google Calendar Add Link
  const getGoogleCalendarAddUrl = () => {
    if (!confirmedDetails) return "#";
    const title = encodeURIComponent(confirmedDetails.title);
    const details = encodeURIComponent(
      `Cita agendada en ${agencyName}.\nDirección: ${locationAddress}\nNotas: ${notes || "Sin notas adicionales"}`
    );
    const location = encodeURIComponent(locationAddress || agencyName);

    // Formato Google Calendar: YYYYMMDDTHHmmssZ
    const toGCalIso = (isoStr: string) =>
      new Date(isoStr).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const start = toGCalIso(confirmedDetails.startIso);
    const end = toGCalIso(confirmedDetails.endIso);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const cleanWhatsapp = whatsappPhone.replace(/\D/g, "");

  return (
    <div id="agendar" className={styles.bookingContainer}>
      <div className={styles.bookingHeader}>
        <span className={styles.eyebrow}>
          <Clock size={14} /> Agendamiento Directo Online
        </span>
        <h2 className={styles.title}>Agenda tu Visita o Test Drive</h2>
        <p className={styles.subtitle}>
          Selecciona el tipo de cita, elige la fecha y hora que mejor te quede y recibe la confirmación al instante.
        </p>
      </div>

      {isConfirmed && confirmedDetails ? (
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--primary, #10b981)" }}>
            ¡Tu Cita ha sido Agendada con Éxito!
          </h3>

          <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.85, maxWidth: "480px" }}>
            Hemos reservado tu turno en nuestro sistema. El equipo de <strong>{agencyName}</strong> te estará esperando puntualmente.
          </p>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.7 }}>Motivo:</span>
              <strong>{confirmedDetails.title}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.7 }}>Fecha & Hora:</span>
              <strong style={{ color: "var(--primary, #10b981)" }}>
                {confirmedDetails.date} a las {confirmedDetails.time} hs
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.7 }}>Concesionario:</span>
              <strong>{agencyName}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span style={{ opacity: 0.7 }}>Ubicación:</span>
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
              <CalendarPlus size={16} /> Agregar a mi Google Calendar
            </a>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Hola ${agencyName}, acabo de agendar una cita (${confirmedDetails.title}) para el ${confirmedDetails.date} a las ${confirmedDetails.time} hs.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            >
              <MessageSquare size={16} /> Contactar por WhatsApp
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
              fontSize: "0.85rem",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            ← Agendar otra visita
          </button>
        </div>
      ) : (
        <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* PASO 1: TIPO DE VISITA */}
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>1</span>
              <span>¿Qué tipo de visita deseas realizar?</span>
            </div>

            <div className={styles.typeGrid}>
              {APPOINTMENT_TYPES.map(type => {
                const IconComponent = type.icon;
                const isActive = eventType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setEventType(type.id)}
                    className={`${styles.typeBtn} ${isActive ? styles.typeBtnActive : ""}`}
                  >
                    <IconComponent size={20} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* VEHÍCULO ASOCIADO SI HAY CATÁLOGO */}
            {vehicles.length > 0 && (
              <div className={styles.inputGroup} style={{ marginTop: "0.5rem" }}>
                <label>Vehículo de tu interés (Opcional):</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => handleVehicleChange(e.target.value)}
                >
                  <option value="">-- Consulta general de vehículos --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* PASO 2: DÍA Y HORARIO DISPONIBLE */}
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>2</span>
              <span>Selecciona una fecha disponible:</span>
            </div>

            <div className={styles.daysStrip}>
              {availableDaysList.map(item => {
                const isActive = item.dateStr === selectedDateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(item.dateStr)}
                    className={`${styles.dayCard} ${isActive ? styles.dayCardActive : ""}`}
                  >
                    <span className={styles.dayCardWeekday}>{item.weekday}</span>
                    <span className={styles.dayCardNumber}>{item.dayNumber}</span>
                    <span className={styles.dayCardMonth}>{item.monthName}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Horarios disponibles para esta fecha:
              </div>

              {isLoadingSlots ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7, padding: "1rem 0" }}>
                  <Loader2 size={18} className="spin" />
                  <span>Consultando horarios disponibles...</span>
                </div>
              ) : slotsMessage ? (
                <div style={{ fontSize: "0.85rem", color: "#f59e0b", padding: "0.5rem 0" }}>
                  {slotsMessage}
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ fontSize: "0.85rem", opacity: 0.6, padding: "0.5rem 0" }}>
                  No quedan horarios libres para este día. Por favor elige otra fecha arriba.
                </div>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map(slot => {
                    const isActive = selectedSlotTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlotTime(slot.time)}
                        className={`${styles.slotBtn} ${isActive ? styles.slotBtnActive : ""}`}
                      >
                        {slot.time} hs
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PASO 3: DATOS DE CONTACTO */}
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>3</span>
              <span>Tus datos de contacto para confirmar:</span>
            </div>

            <div className={styles.inputsRow}>
              <div className={styles.inputGroup}>
                <label>Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Teléfono de Contacto / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +598 99 123 456"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputsRow}>
              <div className={styles.inputGroup}>
                <label>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="juan.perez@gmail.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Comentarios o consultas específicas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Deseo consultar por financiación bancaria..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", padding: "0.5rem 0" }}>
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
                <Loader2 size={18} className="spin" /> Confirmando Cita...
              </>
            ) : selectedSlotTime ? (
              <>
                <CalendarCheck size={18} /> Confirmar Cita para el {selectedDateStr} a las {selectedSlotTime} hs
              </>
            ) : (
              "Selecciona un horario disponible para continuar"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
