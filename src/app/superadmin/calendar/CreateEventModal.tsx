"use client";

import React, { useState, useEffect } from "react";
import { SuperadminMeeting } from "@/lib/superadminCalendarStore";
import { createSuperadminManualEventAction } from "@/actions/superadminCalendarActions";
import {
  X,
  Plus,
  AlertCircle,
} from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  isGoogleConnected: boolean;
  onEventCreated: (newMeeting: SuperadminMeeting) => void;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h <= 23; h++) {
  const hh = String(h).padStart(2, "0");
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:15`);
  TIME_OPTIONS.push(`${hh}:30`);
  TIME_OPTIONS.push(`${hh}:45`);
}

export default function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  initialStartTime = "10:00",
  initialEndTime = "11:00",
  isGoogleConnected,
  onEventCreated,
}: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const defaultDate = initialDate || `${y}-${m}-${d}`;

      setTitle("");
      setDate(defaultDate);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setNotes("");
      setSyncToGoogle(isGoogleConnected);
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen, initialDate, initialStartTime, initialEndTime, isGoogleConnected]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Por favor ingresa un título para el evento.");
      return;
    }
    if (!date) {
      setErrorMsg("Por favor selecciona una fecha.");
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createSuperadminManualEventAction({
        title: title.trim(),
        date,
        startTime,
        endTime,
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        syncToGoogle,
      });

      if (res.success && res.meeting) {
        onEventCreated(res.meeting);
        onClose();
      } else {
        setErrorMsg(res.error || "No se pudo crear el evento.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error inesperado al crear el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--surface-color, #1e293b)",
          borderRadius: "16px",
          border: "1px solid var(--border-color, #334155)",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "var(--text-color, #f8fafc)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Encabezado del modal */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color, #334155)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Nuevo Evento</h2>
              <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.7 }}>
                Agrega una reunión o bloque de tiempo en tu agenda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              opacity: 0.6,
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMsg && (
            <div
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              Título del evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Reunión con cliente, Demo plataforma, Tarea..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #334155)",
                backgroundColor: "var(--bg-color, #0f172a)",
                color: "inherit",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            />
          </div>

          {/* Fecha y Horarios */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #334155)",
                  backgroundColor: "var(--bg-color, #0f172a)",
                  color: "inherit",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Desde *
              </label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (e.target.value >= endTime) {
                    const idx = TIME_OPTIONS.indexOf(e.target.value);
                    if (idx !== -1 && idx < TIME_OPTIONS.length - 1) {
                      setEndTime(TIME_OPTIONS[idx + 1]);
                    }
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #334155)",
                  backgroundColor: "var(--bg-color, #0f172a)",
                  color: "inherit",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={`start-${t}`} value={t}>{t} hs</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Hasta *
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #334155)",
                  backgroundColor: "var(--bg-color, #0f172a)",
                  color: "inherit",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={`end-${t}`} value={t}>{t} hs</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contacto / Interesado opcional */}
          <div style={{ borderTop: "1px solid var(--border-color, #334155)", paddingTop: "0.85rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.6 }}>
              Datos del Contacto (Opcional)
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "0.5rem" }}>
              <div>
                <input
                  type="text"
                  placeholder="Nombre / Empresa"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #334155)",
                    backgroundColor: "var(--bg-color, #0f172a)",
                    color: "inherit",
                    fontSize: "0.8rem",
                  }}
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email del participante"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #334155)",
                    backgroundColor: "var(--bg-color, #0f172a)",
                    color: "inherit",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              Notas / Descripción
            </label>
            <textarea
              rows={2}
              placeholder="Detalles adicionales, temario o notas sobre el evento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #334155)",
                backgroundColor: "var(--bg-color, #0f172a)",
                color: "inherit",
                fontSize: "0.82rem",
                resize: "none",
              }}
            />
          </div>

          {/* Opción Sincronizar con Google */}
          {isGoogleConnected && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                backgroundColor: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#3b82f6",
              }}
            >
              <input
                type="checkbox"
                checked={syncToGoogle}
                onChange={(e) => setSyncToGoogle(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
              />
              <span>Sincronizar también con mi Google Calendar</span>
            </label>
          )}

          {/* Botones de acción */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #334155)",
                backgroundColor: "transparent",
                color: "inherit",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#fff",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
              }}
            >
              {isSubmitting ? "Creando evento..." : "Crear Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
