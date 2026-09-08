"use client";

import React from "react";
import { SuperadminMeeting } from "@/lib/superadminCalendarStore";
import {
  X,
  Video,
  Clock,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  Trash2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface EventDetailModalProps {
  meeting: SuperadminMeeting | null;
  onClose: () => void;
  onCancelMeeting: (id: string) => Promise<void>;
  isCancelling: boolean;
}

export default function EventDetailModal({
  meeting,
  onClose,
  onCancelMeeting,
  isCancelling,
}: EventDetailModalProps) {
  if (!meeting) return null;

  const meetingStart = new Date(meeting.start);
  const isPast = meetingStart.getTime() < Date.now();
  const isCancelled = meeting.status === "cancelled";
  const isGoogle = meeting.isGoogleEvent || meeting.id.startsWith("gcal-");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isGoogle ? "rgba(59, 130, 246, 0.05)" : "rgba(16, 185, 129, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isGoogle ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#2563eb",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "20px",
                }}
              >
                <CalendarIcon size={12} /> Google Calendar
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "20px",
                }}
              >
                <Video size={12} /> Videollamada Landing Meet
              </span>
            )}

            {isCancelled && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "20px",
                }}
              >
                Cancelada
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-color)",
              opacity: 0.7,
              padding: "0.25rem",
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--text-color)" }}>
              {meeting.title || "Reunión Agendada"}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.4rem",
                color: "var(--text-color)",
                opacity: 0.8,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <CalendarIcon size={15} />
              <span>
                {meetingStart.toLocaleDateString("es-UY", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <Clock size={15} />
              <span>
                {meeting.time} hs ({meeting.durationMinutes} min)
              </span>
            </div>
          </div>

          {/* Botón de Google Meet si existe */}
          {meeting.meetUrl && !isCancelled && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                backgroundColor: "rgba(26, 115, 232, 0.08)",
                border: "1px solid rgba(26, 115, 232, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "#1a73e8",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Video size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a73e8" }}>Google Meet</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Sala de videollamada lista</div>
                </div>
              </div>
              <a
                href={meeting.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#1a73e8",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  boxShadow: "0 2px 6px rgba(26, 115, 232, 0.3)",
                }}
              >
                Unirse <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Información del Cliente / Interesado */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-color)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.6 }}>
              {isGoogle ? "Detalles del Evento" : "Datos del Interesado"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{meeting.clientName}</span>
              {meeting.agencyName && (
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
                  <Building2 size={12} /> {meeting.agencyName}
                </span>
              )}
            </div>

            {meeting.clientEmail && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", opacity: 0.85 }}>
                <Mail size={14} style={{ opacity: 0.6 }} />
                <a href={`mailto:${meeting.clientEmail}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {meeting.clientEmail}
                </a>
              </div>
            )}

            {meeting.clientPhone && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
                <Phone size={14} style={{ opacity: 0.6 }} />
                <span>{meeting.clientPhone}</span>
                <a
                  href={`https://wa.me/${meeting.clientPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#10b981",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  WhatsApp <ExternalLink size={10} />
                </a>
              </div>
            )}

            {meeting.notes && (
              <div style={{ marginTop: "0.25rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-color)" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.2rem" }}>Mensaje / Notas:</div>
                <div style={{ fontSize: "0.85rem", fontStyle: "italic", opacity: 0.85 }}>
                  &ldquo;{meeting.notes}&rdquo;
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones de pie de modal */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-color)",
          }}
        >
          {!isCancelled && !isPast && !isGoogle ? (
            <button
              type="button"
              disabled={isCancelling}
              onClick={async () => {
                await onCancelMeeting(meeting.id);
                onClose();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: isCancelling ? "not-allowed" : "pointer",
              }}
            >
              <Trash2 size={14} />
              {isCancelling ? "Cancelando..." : "Cancelar reunión"}
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-color)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
