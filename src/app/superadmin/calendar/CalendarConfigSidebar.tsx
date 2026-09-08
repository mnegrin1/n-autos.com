"use client";

import React, { useState } from "react";
import {
  SuperadminCalendarConfig,
  SuperadminMeeting,
  TimeRange,
} from "@/lib/superadminCalendarStore";
import {
  Video,
  Link2,
  Unlink,
  RefreshCw,
  Save,
  CheckCircle2,
  HelpCircle,
  Info,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";

interface CalendarConfigSidebarProps {
  config: SuperadminCalendarConfig;
  onConfigChange: (updater: (prev: SuperadminCalendarConfig) => SuperadminCalendarConfig) => void;
  onSaveConfig: (e: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  saveSuccessMsg: string;
  googleAuth: { connected: boolean; email: string | null };
  onSyncGoogle: () => Promise<void>;
  isSyncing: boolean;
  onDisconnectGoogle: () => Promise<void>;
  currentCalendarDate: Date;
  onMonthChange: (d: Date) => void;
  selectedCalendarDay: string | null;
  onSelectDay: (dateStr: string) => void;
  meetings: SuperadminMeeting[];
}

const DAYS_OF_WEEK = [
  { id: 1, name: "Lun", full: "Lunes" },
  { id: 2, name: "Mar", full: "Martes" },
  { id: 3, name: "Mié", full: "Miércoles" },
  { id: 4, name: "Jue", full: "Jueves" },
  { id: 5, name: "Vie", full: "Viernes" },
  { id: 6, name: "Sáb", full: "Sábado" },
  { id: 0, name: "Dom", full: "Domingo" },
];

export default function CalendarConfigSidebar({
  config,
  onConfigChange,
  onSaveConfig,
  isSaving,
  saveSuccessMsg,
  googleAuth,
  onSyncGoogle,
  isSyncing,
  onDisconnectGoogle,
  currentCalendarDate,
  onMonthChange,
  selectedCalendarDay,
  onSelectDay,
  meetings,
}: CalendarConfigSidebarProps) {
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);

  const handleToggleDay = (dayId: number) => {
    onConfigChange((prev) => {
      const exists = prev.availableDays.includes(dayId);
      const updated = exists
        ? prev.availableDays.filter((d) => d !== dayId)
        : [...prev.availableDays, dayId].sort();
      return { ...prev, availableDays: updated };
    });
  };

  const handleAddTimeRange = () => {
    onConfigChange((prev) => {
      const currentRanges = prev.consultationHours.timeRanges || [];
      const newRange: TimeRange = { startTime: "17:00", endTime: "19:00" };
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: [...currentRanges, newRange],
        },
      };
    });
  };

  const handleRemoveTimeRange = (index: number) => {
    onConfigChange((prev) => {
      const currentRanges = prev.consultationHours.timeRanges || [];
      if (currentRanges.length <= 1) return prev;
      const filtered = currentRanges.filter((_, i) => i !== index);
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: filtered,
        },
      };
    });
  };

  const handleUpdateTimeRange = (index: number, field: "startTime" | "endTime", value: string) => {
    onConfigChange((prev) => {
      const currentRanges = [...(prev.consultationHours.timeRanges || [])];
      if (currentRanges[index]) {
        currentRanges[index] = {
          ...currentRanges[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        consultationHours: {
          ...prev.consultationHours,
          timeRanges: currentRanges,
        },
      };
    });
  };

  // Helpers de calendario mensual
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* CARD 1: ESTADO Y ACCIONES DE GOOGLE CALENDAR */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.25rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: googleAuth.connected ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
                color: googleAuth.connected ? "#10b981" : "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-color)" }}>
              Google Calendar
            </h3>
          </div>

          {googleAuth.connected ? (
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "12px",
                fontWeight: 800,
              }}
            >
              CONECTADO
            </span>
          ) : (
            <span
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "#3b82f6",
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "12px",
                fontWeight: 800,
              }}
            >
              AUTÓNOMO
            </span>
          )}
        </div>

        <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.4 }}>
          {googleAuth.connected
            ? `Sincronizado con ${googleAuth.email || "tu cuenta de Google"}. Los eventos ocupados bloquean horarios en la landing.`
            : "Funciona en modo autónomo. Conecta tu cuenta para sincronizar automáticamente tus eventos."}
        </p>

        {googleAuth.connected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onSyncGoogle}
              disabled={isSyncing}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: isSyncing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={14} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Sincronizando..." : "Sincronizar eventos ahora"}
            </button>

            <button
              type="button"
              onClick={onDisconnectGoogle}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                backgroundColor: "transparent",
                color: "#ef4444",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Unlink size={13} /> Desconectar Google
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/google?target=superadmin"
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
            }}
          >
            <Link2 size={15} /> Conectar y sincronizar con Google
          </a>
        )}

        <div style={{ marginTop: "0.75rem", textAlign: "right" }}>
          <button
            type="button"
            onClick={() => setShowGoogleHelp(!showGoogleHelp)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-color)",
              opacity: 0.6,
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <HelpCircle size={13} /> Ayuda Google Cloud
          </button>
        </div>

        {showGoogleHelp && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              fontSize: "0.75rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: "0.3rem" }}>
              URIs de redireccionamiento autorizadas:
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.72rem", wordBreak: "break-all" }}>
              <div>• http://localhost:3000/api/auth/google/callback</div>
              <div>• https://superadmin.n-autos.com/api/auth/google/callback</div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 2: CONFIGURACIÓN DE DISPONIBILIDAD & FRANJAS HORARIAS */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.25rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-color)" }}>
            Configuración de Disponibilidad
          </h3>
          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.78rem", opacity: 0.7 }}>
            Ajusta los días y horarios que se ofrecen para consultas en la landing page.
          </p>
        </div>

        <form onSubmit={onSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* 1. Días disponibles */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              1. Días de atención
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = config.availableDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleToggleDay(d.id)}
                    title={d.full}
                    style={{
                      padding: "0.45rem 0.1rem",
                      borderRadius: "6px",
                      border: isSelected ? "1px solid var(--primary, #10b981)" : "1px solid var(--border-color)",
                      backgroundColor: isSelected ? "rgba(16, 185, 129, 0.15)" : "var(--bg-color)",
                      color: isSelected ? "var(--primary, #10b981)" : "var(--text-color)",
                      fontWeight: isSelected ? 800 : 500,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Días hacia adelante */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              2. Ventana de días futuros
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onConfigChange((prev) => ({ ...prev, displayDaysAhead: days }))}
                  style={{
                    flex: 1,
                    padding: "0.35rem 0.2rem",
                    borderRadius: "6px",
                    border: config.displayDaysAhead === days ? "1px solid #3b82f6" : "1px solid var(--border-color)",
                    backgroundColor: config.displayDaysAhead === days ? "rgba(59, 130, 246, 0.15)" : "var(--bg-color)",
                    color: config.displayDaysAhead === days ? "#3b82f6" : "var(--text-color)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* 3. Duración de consultas */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              3. Duración por reunión
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onConfigChange((prev) => ({ ...prev, meetingDurationMinutes: mins }))}
                  style={{
                    flex: 1,
                    padding: "0.35rem 0.2rem",
                    borderRadius: "6px",
                    border: config.meetingDurationMinutes === mins ? "1px solid #8b5cf6" : "1px solid var(--border-color)",
                    backgroundColor: config.meetingDurationMinutes === mins ? "rgba(139, 92, 246, 0.15)" : "var(--bg-color)",
                    color: config.meetingDurationMinutes === mins ? "#8b5cf6" : "var(--text-color)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* 4. Franjas Horarias */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                4. Horarios de consulta
              </label>
              <button
                type="button"
                onClick={handleAddTimeRange}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "6px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#10b981",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={11} /> Agregar
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {(config.consultationHours.timeRanges || [{ startTime: "09:00", endTime: "18:00" }]).map(
                (range, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ fontWeight: 700, opacity: 0.6 }}>#{idx + 1}</span>

                    <select
                      value={range.startTime}
                      onChange={(e) => handleUpdateTimeRange(idx, "startTime", e.target.value)}
                      style={{
                        padding: "0.25rem 0.4rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--surface-color)",
                        color: "var(--text-color)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, h) => {
                        const s = `${String(h).padStart(2, "0")}:00`;
                        return <option key={s} value={s}>{s}</option>;
                      })}
                    </select>

                    <span style={{ opacity: 0.5 }}>a</span>

                    <select
                      value={range.endTime}
                      onChange={(e) => handleUpdateTimeRange(idx, "endTime", e.target.value)}
                      style={{
                        padding: "0.25rem 0.4rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--surface-color)",
                        color: "var(--text-color)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, h) => {
                        const s = `${String(h).padStart(2, "0")}:00`;
                        return <option key={s} value={s}>{s}</option>;
                      })}
                    </select>

                    {(config.consultationHours.timeRanges || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeRange(idx)}
                        style={{
                          marginLeft: "auto",
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "0.1rem",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Botón Guardar */}
          <div style={{ marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#fff",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Save size={15} />
              {isSaving ? "Guardando..." : "Guardar Disponibilidad"}
            </button>

            {saveSuccessMsg && (
              <div
                style={{
                  marginTop: "0.5rem",
                  color: "#10b981",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                }}
              >
                <CheckCircle2 size={14} /> {saveSuccessMsg}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* CARD 3: MINI CALENDARIO MENSUAL */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.25rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", textTransform: "capitalize" }}>
            {currentCalendarDate.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
          </span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              onClick={() => onMonthChange(new Date(calYear, calMonth - 1, 1))}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-color)",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(new Date(calYear, calMonth + 1, 1))}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-color)",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((h) => (
            <div key={h} style={{ fontSize: "0.68rem", fontWeight: 700, opacity: 0.5, paddingBottom: "2px" }}>
              {h}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInCalMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayMeetings = meetings.filter((m) => m.date === dateStr && m.status !== "cancelled");
            const isSelected = selectedCalendarDay === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDay(dateStr)}
                title={`${dayNum} - ${dayMeetings.length} eventos`}
                style={{
                  aspectRatio: 1.1,
                  borderRadius: "6px",
                  border: isSelected ? "2px solid #2563eb" : "1px solid transparent",
                  backgroundColor: isSelected
                    ? "rgba(37, 99, 235, 0.15)"
                    : dayMeetings.length > 0
                    ? "rgba(16, 185, 129, 0.1)"
                    : "transparent",
                  color: isSelected ? "#2563eb" : "var(--text-color)",
                  fontWeight: isSelected || dayMeetings.length > 0 ? 800 : 500,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1px",
                  padding: 0,
                }}
              >
                <span>{dayNum}</span>
                {dayMeetings.length > 0 && (
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
