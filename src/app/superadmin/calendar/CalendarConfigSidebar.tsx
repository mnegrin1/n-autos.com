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
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  Clock,
  Sliders,
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
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(true);
  const [isMiniCalOpen, setIsMiniCalOpen] = useState(true);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* CARD 1: ESTADO Y ACCIONES DE GOOGLE CALENDAR */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "1rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: googleAuth.connected ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
                color: googleAuth.connected ? "#10b981" : "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color)" }}>
              Google Calendar
            </h3>
          </div>

          {googleAuth.connected ? (
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: "0.68rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "10px",
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
                fontSize: "0.68rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "10px",
                fontWeight: 800,
              }}
            >
              AUTÓNOMO
            </span>
          )}
        </div>

        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.76rem", opacity: 0.7, lineHeight: 1.35 }}>
          {googleAuth.connected
            ? `Sincronizado con ${googleAuth.email || "tu cuenta"}. Bloquea horarios en la landing.`
            : "Modo autónomo activo. Conecta tu cuenta para sincronizar con Google."}
        </p>

        {googleAuth.connected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
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
                padding: "0.5rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: isSyncing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={13} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
            </button>

            <button
              type="button"
              onClick={onDisconnectGoogle}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                padding: "0.4rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                backgroundColor: "transparent",
                color: "#ef4444",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Unlink size={12} /> Desconectar cuenta
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
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.8rem",
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Link2 size={14} /> Conectar con Google
          </a>
        )}

        <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
          <button
            type="button"
            onClick={() => setShowGoogleHelp(!showGoogleHelp)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-color)",
              opacity: 0.55,
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
            }}
          >
            <HelpCircle size={12} /> Info URIs
          </button>
        </div>

        {showGoogleHelp && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem",
              borderRadius: "8px",
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              fontSize: "0.72rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: "0.2rem" }}>
              Redirección Google Cloud:
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.68rem", wordBreak: "break-all" }}>
              <div>• http://localhost:3000/api/auth/google/callback</div>
              <div>• https://superadmin.n-autos.com/api/auth/google/callback</div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 2: CONFIGURACIÓN DE DISPONIBILIDAD (COLAPSIBLE) */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "1rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <Sliders size={16} style={{ opacity: 0.7 }} />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color)" }}>
              Disponibilidad Landing
            </h3>
          </div>
          <button
            type="button"
            style={{ background: "none", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", padding: 0 }}
          >
            {isAvailabilityOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {isAvailabilityOpen && (
          <form onSubmit={onSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.85rem" }}>
            {/* 1. Días de atención */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Días de atención
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = config.availableDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDay(d.id)}
                      title={d.full}
                      style={{
                        padding: "0.4rem 0.1rem",
                        borderRadius: "6px",
                        border: isSelected ? "1px solid #10b981" : "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "rgba(16, 185, 129, 0.15)" : "var(--bg-color)",
                        color: isSelected ? "#10b981" : "var(--text-color)",
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: "0.72rem",
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

            {/* 2. Días hacia adelante y Duración */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Ventana futuros
                </label>
                <select
                  value={config.displayDaysAhead}
                  onChange={(e) => onConfigChange((prev) => ({ ...prev, displayDaysAhead: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.4rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={21}>21 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Duración cita
                </label>
                <select
                  value={config.meetingDurationMinutes}
                  onChange={(e) => onConfigChange((prev) => ({ ...prev, meetingDurationMinutes: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.4rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            {/* 3. Franjas Horarias */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                  Franjas horarias
                </label>
                <button
                  type="button"
                  onClick={handleAddTimeRange}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.15rem",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "5px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#10b981",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={10} /> Franja
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {(config.consultationHours.timeRanges || [{ startTime: "09:00", endTime: "18:00" }]).map(
                  (range, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.35rem 0.45rem",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-color)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.75rem",
                      }}
                    >
                      <select
                        value={range.startTime}
                        onChange={(e) => handleUpdateTimeRange(idx, "startTime", e.target.value)}
                        style={{
                          padding: "0.2rem 0.3rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--surface-color)",
                          color: "var(--text-color)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                        }}
                      >
                        {Array.from({ length: 24 }).map((_, h) => {
                          const s = `${String(h).padStart(2, "0")}:00`;
                          return <option key={s} value={s}>{s}</option>;
                        })}
                      </select>

                      <span style={{ opacity: 0.5 }}>-</span>

                      <select
                        value={range.endTime}
                        onChange={(e) => handleUpdateTimeRange(idx, "endTime", e.target.value)}
                        style={{
                          padding: "0.2rem 0.3rem",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--surface-color)",
                          color: "var(--text-color)",
                          fontSize: "0.72rem",
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
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Botón Guardar */}
            <div>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 0.8rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary, #10b981)",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                }}
              >
                <Save size={14} />
                {isSaving ? "Guardando..." : "Guardar Disponibilidad"}
              </button>

              {saveSuccessMsg && (
                <div
                  style={{
                    marginTop: "0.4rem",
                    color: "#10b981",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                  }}
                >
                  <CheckCircle2 size={13} /> {saveSuccessMsg}
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* CARD 3: MINI CALENDARIO MENSUAL (COLAPSIBLE) */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "1rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          onClick={() => setIsMiniCalOpen(!isMiniCalOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <CalendarIcon size={16} style={{ opacity: 0.7 }} />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color)" }}>
              Navegar Mes
            </h3>
          </div>
          <button
            type="button"
            style={{ background: "none", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", padding: 0 }}
          >
            {isMiniCalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {isMiniCalOpen && (
          <div style={{ marginTop: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.82rem", textTransform: "capitalize" }}>
                {currentCalendarDate.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
              </span>
              <div style={{ display: "flex", gap: "0.2rem" }}>
                <button
                  type="button"
                  onClick={() => onMonthChange(new Date(calYear, calMonth - 1, 1))}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-color)",
                    borderRadius: "5px",
                    width: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-color)",
                  }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onMonthChange(new Date(calYear, calMonth + 1, 1))}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-color)",
                    borderRadius: "5px",
                    width: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-color)",
                  }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((h) => (
                <div key={h} style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.5, paddingBottom: "2px" }}>
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
                      borderRadius: "5px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid transparent",
                      backgroundColor: isSelected
                        ? "rgba(37, 99, 235, 0.15)"
                        : dayMeetings.length > 0
                        ? "rgba(16, 185, 129, 0.1)"
                        : "transparent",
                      color: isSelected ? "#2563eb" : "var(--text-color)",
                      fontWeight: isSelected || dayMeetings.length > 0 ? 800 : 500,
                      fontSize: "0.72rem",
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
        )}
      </div>
    </div>
  );
}
