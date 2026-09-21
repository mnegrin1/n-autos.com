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
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  Sliders,
  CheckSquare,
  Square,
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
  onOpenNewEvent?: () => void;
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
  onOpenNewEvent,
}: CalendarConfigSidebarProps) {
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isCalendarsOpen, setIsCalendarsOpen] = useState(true);

  // Filtros visuales de calendarios
  const [visibleCalendars, setVisibleCalendars] = useState<{
    primary: boolean;
    personal: boolean;
    meet: boolean;
  }>({
    primary: true,
    personal: true,
    meet: true,
  });

  const toggleCalendarFilter = (key: "primary" | "personal" | "meet") => {
    setVisibleCalendars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
  // Primer día del mes (0 = Domingo, 1 = Lunes, ...)
  const firstDayOfWeekSundayBased = new Date(calYear, calMonth, 1).getDay();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        width: "100%",
        padding: "0.5rem",
        boxSizing: "border-box",
      }}
    >
      {/* 1. BOTÓN PRINCIPAL: + CREAR (ESTILO GOOGLE CALENDAR) */}
      <div>
        <button
          type="button"
          onClick={onOpenNewEvent}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.75rem 1.35rem",
            borderRadius: "28px",
            backgroundColor: "var(--surface-color)",
            color: "var(--text-color)",
            border: "1px solid var(--border-color)",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.18)";
            e.currentTarget.style.backgroundColor = "rgba(128, 128, 128, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.12)";
            e.currentTarget.style.backgroundColor = "var(--surface-color)";
          }}
        >
          {/* Ícono de cruz colorida estilo Google */}
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#1a73e8",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={16} strokeWidth={3} />
          </div>
          <span>Crear</span>
        </button>
      </div>

      {/* 2. MINI CALENDARIO MENSUAL (ESTILO GOOGLE CALENDAR) */}
      <div
        style={{
          backgroundColor: "transparent",
          padding: "0.25rem 0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.86rem",
              textTransform: "capitalize",
              color: "var(--text-color)",
            }}
          >
            {currentCalendarDate.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
          </span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              onClick={() => onMonthChange(new Date(calYear, calMonth - 1, 1))}
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-color)",
                opacity: 0.7,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(new Date(calYear, calMonth + 1, 1))}
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-color)",
                opacity: 0.7,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Cuadrícula de 7 columnas (D L M X J V S) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
          {["D", "L", "M", "X", "J", "V", "S"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                opacity: 0.5,
                paddingBottom: "4px",
              }}
            >
              {h}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeekSundayBased }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInCalMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isSelected = selectedCalendarDay === dateStr;

            const today = new Date();
            const isToday =
              today.getFullYear() === calYear &&
              today.getMonth() === calMonth &&
              today.getDate() === dayNum;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDay(dateStr)}
                title={`${dayNum}`}
                style={{
                  aspectRatio: 1,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: isToday
                    ? "#1a73e8"
                    : isSelected
                    ? "rgba(26, 115, 232, 0.2)"
                    : "transparent",
                  color: isToday ? "#ffffff" : isSelected ? "#1a73e8" : "var(--text-color)",
                  fontWeight: isToday || isSelected ? 800 : 500,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECCIÓN: MIS CALENDARIOS (COMO EN LA CAPTURA DE GOOGLE CALENDAR) */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: "0.75rem",
        }}
      >
        <div
          onClick={() => setIsCalendarsOpen(!isCalendarsOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: "0.4rem",
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.8 }}>
            Mis calendarios
          </span>
          <button type="button" style={{ background: "none", border: "none", color: "inherit", opacity: 0.6, padding: 0 }}>
            {isCalendarsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isCalendarsOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {/* Mauricio Negrin (Google Calendar Azul) */}
            <div
              onClick={() => toggleCalendarFilter("primary")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "0.2rem 0.3rem",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  backgroundColor: visibleCalendars.primary ? "#0284c7" : "transparent",
                  border: "2px solid #0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {visibleCalendars.primary && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontWeight: 600 }}>{googleAuth.email ? "Mauricio Negrin" : "Google Calendar"}</span>
            </div>

            {/* Rutina / Personal (Naranja) */}
            <div
              onClick={() => toggleCalendarFilter("personal")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "0.2rem 0.3rem",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  backgroundColor: visibleCalendars.personal ? "#ea580c" : "transparent",
                  border: "2px solid #ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {visibleCalendars.personal && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontWeight: 600 }}>Rutina & Personal (Almuerzo / Comer)</span>
            </div>

            {/* Videollamadas N-Autos (Verde) */}
            <div
              onClick={() => toggleCalendarFilter("meet")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: "0.2rem 0.3rem",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  backgroundColor: visibleCalendars.meet ? "#10b981" : "transparent",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {visibleCalendars.meet && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontWeight: 600 }}>Videollamadas N-Autos</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. SECCIÓN: CONFIGURACIÓN DE DISPONIBILIDAD (COLAPSIBLE) */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: "0.75rem",
        }}
      >
        <div
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: "0.4rem",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sliders size={14} style={{ opacity: 0.7 }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-color)", opacity: 0.8 }}>
              Disponibilidad Landing
            </span>
          </div>
          <button type="button" style={{ background: "none", border: "none", color: "inherit", opacity: 0.6, padding: 0 }}>
            {isAvailabilityOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isAvailabilityOpen && (
          <form onSubmit={onSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            {/* Días disponibles */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                Días de atención
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = config.availableDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDay(d.id)}
                      title={d.full}
                      style={{
                        padding: "0.35rem 0.1rem",
                        borderRadius: "5px",
                        border: isSelected ? "1px solid #10b981" : "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "rgba(16, 185, 129, 0.15)" : "var(--bg-color)",
                        color: isSelected ? "#10b981" : "var(--text-color)",
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: "0.68rem",
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

            {/* Ventana de días y Duración */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                  Ventana días
                </label>
                <select
                  value={config.displayDaysAhead}
                  onChange={(e) => onConfigChange((prev) => ({ ...prev, displayDaysAhead: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "0.3rem 0.35rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.72rem",
                  }}
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={21}>21 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                  Duración
                </label>
                <select
                  value={config.meetingDurationMinutes}
                  onChange={(e) => onConfigChange((prev) => ({ ...prev, meetingDurationMinutes: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "0.3rem 0.35rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.72rem",
                  }}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            {/* Franjas Horarias */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700 }}>Franjas horarias</label>
                <button
                  type="button"
                  onClick={handleAddTimeRange}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.15rem",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#10b981",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={10} /> Franja
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {(config.consultationHours.timeRanges || [{ startTime: "09:00", endTime: "18:00" }]).map(
                  (range, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.35rem",
                        borderRadius: "5px",
                        backgroundColor: "var(--bg-color)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.72rem",
                      }}
                    >
                      <input
                        type="time"
                        step={900}
                        value={range.startTime}
                        onChange={(e) => handleUpdateTimeRange(idx, "startTime", e.target.value)}
                        style={{
                          padding: "0.15rem 0.25rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--surface-color)",
                          color: "var(--text-color)",
                          fontSize: "0.7rem",
                        }}
                      />
                      <span>-</span>
                      <input
                        type="time"
                        step={900}
                        value={range.endTime}
                        onChange={(e) => handleUpdateTimeRange(idx, "endTime", e.target.value)}
                        style={{
                          padding: "0.15rem 0.25rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--surface-color)",
                          color: "var(--text-color)",
                          fontSize: "0.7rem",
                        }}
                      />
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
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Enlace Permanente de Google Meet (Respaldo) */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                Enlace Google Meet de respaldo
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                value={config.fallbackMeetUrl || ""}
                onChange={(e) => onConfigChange((prev) => ({ ...prev, fallbackMeetUrl: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "0.35rem 0.45rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.72rem",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-muted, #9ca3af)", marginTop: "0.2rem" }}>
                Sala fija alternativa si Google Calendar no está vinculado.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "7px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#fff",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              <Save size={13} />
              {isSaving ? "Guardando..." : "Guardar Disponibilidad"}
            </button>

            {saveSuccessMsg && (
              <div
                style={{
                  color: "#10b981",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                ✓ {saveSuccessMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* 5. SECCIÓN: ESTADO GOOGLE CALENDAR */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: "0.75rem",
          fontSize: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontWeight: 700, opacity: 0.8 }}>Cuenta de Google</span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "0.1rem 0.4rem",
              borderRadius: "8px",
              backgroundColor: googleAuth.connected ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
              color: googleAuth.connected ? "#10b981" : "#3b82f6",
            }}
          >
            {googleAuth.connected ? "CONECTADO" : "AUTÓNOMO"}
          </span>
        </div>

        {googleAuth.connected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {googleAuth.email && (
              <span style={{ fontSize: "0.68rem", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {googleAuth.email}
              </span>
            )}
            <button
              type="button"
              onClick={onSyncGoogle}
              disabled={isSyncing}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                color: "#10b981",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: isSyncing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={12} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </button>

            <button
              type="button"
              onClick={onDisconnectGoogle}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: "0.7rem",
                cursor: "pointer",
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              Desconectar Google
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <a
              href="/api/auth/google?target=superadmin"
              style={{
                display: "block",
                textAlign: "center",
                padding: "0.45rem 0.6rem",
                borderRadius: "6px",
                backgroundColor: "#2563eb",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              Conectar con Google
            </a>
            <span style={{ fontSize: "0.62rem", color: "var(--text-muted, #9ca3af)", lineHeight: 1.3 }}>
              💡 En Google Cloud Console, publica la app (&quot;En producción&quot;) para que el token no caduque a los 7 días.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
