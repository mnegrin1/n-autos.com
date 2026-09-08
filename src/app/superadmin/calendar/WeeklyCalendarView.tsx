"use client";

import React, { useState, useEffect, useRef } from "react";
import { SuperadminMeeting } from "@/lib/superadminCalendarStore";
import { Video, Clock, ChevronRight } from "lucide-react";

interface WeekDayInfo {
  dateObj: Date;
  dateStr: string;
  dayNum: number;
  dayName: string;
  isToday: boolean;
}

interface WeeklyCalendarViewProps {
  weekDays: WeekDayInfo[];
  meetings: SuperadminMeeting[];
  onSelectMeeting: (m: SuperadminMeeting) => void;
  selectedCalendarDay: string | null;
  onSelectDay: (dateStr: string) => void;
  onDragCreate?: (range: { date: string; startTime: string; endTime: string }) => void;
}

const HOUR_HEIGHT = 60; // 1 minuto = 1 píxel exacto
const TOTAL_HOURS = 24;
const TOTAL_GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 1440px

// Formatear minutos (0 - 1440) a "HH:mm"
function minutesToTimeString(minutes: number): string {
  const bounded = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Convertir "HH:mm" a minutos desde medianoche
function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Formatear hora estilo Google Calendar ("1 PM", "2 PM", "12 AM")
function formatHourLabel(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// Helper para hora actual en Montevideo
function getMontevideoNowMinutes() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Montevideo",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());

    let h = 0;
    let m = 0;
    for (const p of parts) {
      if (p.type === "hour") h = Number(p.value);
      if (p.type === "minute") m = Number(p.value);
    }
    return h * 60 + m;
  } catch (e) {
    const d = new Date(Date.now() - 3 * 3600 * 1000);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
}

// Asignación de colores idéntica a la captura de Google Calendar del usuario
function getEventColors(m: SuperadminMeeting) {
  const isMeet = m.meetUrl || m.id.startsWith("meet-");
  const titleLower = (m.title || "").toLowerCase();
  const notesLower = (m.notes || "").toLowerCase();
  const emailLower = (m.clientEmail || "").toLowerCase();

  // Naranja de Google Calendar para eventos personales/rutina (almuerzo, siesta, comer, dormir)
  const isPersonalRoutine =
    titleLower.includes("almuerzo") ||
    titleLower.includes("siesta") ||
    titleLower.includes("comer") ||
    (titleLower.includes("dormir") && notesLower.includes("estudian")) ||
    emailLower.includes("estudian");

  if (isMeet) {
    return {
      bg: "#10b981",
      border: "#059669",
      text: "#ffffff",
      type: "meet",
    };
  }

  if (isPersonalRoutine) {
    return {
      bg: "#ea580c", // Naranja vibrante de Google Calendar
      border: "#c2410c",
      text: "#ffffff",
      type: "personal",
    };
  }

  // Azul estándar de Google Calendar
  if (m.isGoogleEvent || m.id.startsWith("gcal-")) {
    return {
      bg: "#0284c7", // Azul Google Calendar
      border: "#0369a1",
      text: "#ffffff",
      type: "google",
    };
  }

  // Eventos manuales creados en superadmin
  return {
    bg: "#6366f1",
    border: "#4f46e5",
    text: "#ffffff",
    type: "manual",
  };
}

interface PositionedMeeting {
  meeting: SuperadminMeeting;
  startMinutes: number;
  endMinutes: number;
  colIndex: number;
  totalCols: number;
}

export default function WeeklyCalendarView({
  weekDays,
  meetings,
  onSelectMeeting,
  selectedCalendarDay,
  onSelectDay,
  onDragCreate,
}: WeeklyCalendarViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [nowMinutes, setNowMinutes] = useState<number>(() => getMontevideoNowMinutes());

  // Estado de arrastre con discretización en 15 minutos
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dayStr: string | null;
    startMinutes: number;
    currentMinutes: number;
  }>({
    isDragging: false,
    dayStr: null,
    startMinutes: 0,
    currentMinutes: 0,
  });

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinutes(getMontevideoNowMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll inicial a las 08:00 AM (o 1 hora antes de la hora actual)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollHour = Math.max(7, Math.floor(nowMinutes / 60) - 1);
      scrollContainerRef.current.scrollTop = scrollHour * HOUR_HEIGHT;
    }
  }, []);

  // 1. Agrupar reuniones por día
  const meetingsByDay: Record<string, SuperadminMeeting[]> = {};
  for (const day of weekDays) {
    meetingsByDay[day.dateStr] = [];
  }

  for (const m of meetings) {
    if (m.status === "cancelled") continue;
    if (meetingsByDay[m.date]) {
      meetingsByDay[m.date].push(m);
    }
  }

  // 2. Calcular posicionamiento lado a lado para eventos solapados (Google Calendar overlapping algorithm)
  const positionedByDay: Record<string, PositionedMeeting[]> = {};

  for (const day of weekDays) {
    const dayMeetings = [...(meetingsByDay[day.dateStr] || [])];

    const parsed = dayMeetings.map((m) => {
      const startMin = timeStringToMinutes(m.time || "09:00");
      const duration = m.durationMinutes || 30;
      const endMin = Math.min(1440, startMin + duration);
      return {
        meeting: m,
        startMinutes: startMin,
        endMinutes: endMin,
      };
    });

    // Ordenar por hora de inicio ascendente y duración descendente
    parsed.sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

    // Agrupar en clusters solapados
    const clusters: Array<typeof parsed> = [];
    let currentCluster: typeof parsed = [];
    let clusterEnd = -1;

    for (const item of parsed) {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endMinutes;
      } else if (item.startMinutes < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMinutes);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMinutes;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // Para cada cluster, asignar columnas libres
    const result: PositionedMeeting[] = [];
    for (const cluster of clusters) {
      const columns: Array<number> = []; // Guarda el endMinutes de cada columna

      for (const item of cluster) {
        let placedCol = -1;
        for (let col = 0; col < columns.length; col++) {
          if (columns[col] <= item.startMinutes) {
            placedCol = col;
            columns[col] = item.endMinutes;
            break;
          }
        }
        if (placedCol === -1) {
          placedCol = columns.length;
          columns.push(item.endMinutes);
        }

        result.push({
          meeting: item.meeting,
          startMinutes: item.startMinutes,
          endMinutes: item.endMinutes,
          colIndex: placedCol,
          totalCols: 1, // Se actualizará abajo
        });
      }

      // Total de columnas en este cluster
      const totalCols = Math.max(1, columns.length);
      const clusterEventIds = new Set(cluster.map((c) => c.meeting.id));
      for (const res of result) {
        if (clusterEventIds.has(res.meeting.id)) {
          res.totalCols = totalCols;
        }
      }
    }

    positionedByDay[day.dateStr] = result;
  }

  // Manejadores de arrastre con discretización en 15 minutos
  const handleColumnMouseDown = (e: React.MouseEvent<HTMLDivElement>, dayStr: string) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = Math.max(0, Math.min(1425, Math.floor((offsetY / HOUR_HEIGHT) * 60)));
    const snapped = Math.floor(rawMinutes / 15) * 15;

    setDragState({
      isDragging: true,
      dayStr,
      startMinutes: snapped,
      currentMinutes: snapped + 15,
    });
  };

  const handleColumnMouseMove = (e: React.MouseEvent<HTMLDivElement>, dayStr: string) => {
    if (!dragState.isDragging || dragState.dayStr !== dayStr) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = Math.max(0, Math.min(1425, Math.floor((offsetY / HOUR_HEIGHT) * 60)));
    const snapped = Math.floor(rawMinutes / 15) * 15;

    if (snapped !== dragState.currentMinutes) {
      setDragState((prev) => ({
        ...prev,
        currentMinutes: snapped,
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.dayStr) {
      let minMin = Math.min(dragState.startMinutes, dragState.currentMinutes);
      let maxMin = Math.max(dragState.startMinutes, dragState.currentMinutes);

      // Si fue un clic simple sin arrastre, por defecto crear bloque de 30 minutos
      if (minMin === maxMin || maxMin - minMin < 15) {
        maxMin = Math.min(1440, minMin + 30);
      }

      const startTime = minutesToTimeString(minMin);
      const endTime = minutesToTimeString(maxMin);

      if (onDragCreate) {
        onDragCreate({
          date: dragState.dayStr,
          startTime,
          endTime,
        });
      }
    }

    setDragState({
      isDragging: false,
      dayStr: null,
      startMinutes: 0,
      currentMinutes: 0,
    });
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        userSelect: dragState.isDragging ? "none" : "auto",
      }}
    >
      {/* 1. ENCABEZADO DE DÍAS (GOOGLE CALENDAR STYLE) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "64px repeat(7, 1fr)",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-color)",
          zIndex: 10,
        }}
      >
        {/* Celda superior izquierda: Zona horaria GMT-03 */}
        <div
          style={{
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0.5rem 0.25rem",
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "var(--text-color)",
            opacity: 0.5,
            letterSpacing: "0.5px",
          }}
        >
          GMT-03
        </div>

        {/* 7 Columnas de días de la semana */}
        {weekDays.map((day) => {
          const isSelected = selectedCalendarDay === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDay(day.dateStr)}
              style={{
                padding: "0.6rem 0.4rem",
                textAlign: "center",
                borderRight: "1px solid var(--border-color)",
                backgroundColor: isSelected
                  ? "rgba(37, 99, 235, 0.08)"
                  : day.isToday
                  ? "rgba(26, 115, 232, 0.04)"
                  : "transparent",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {/* Nombre de día (LUN, MAR, MIÉ, ...) */}
              <div
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  color: day.isToday ? "#1a73e8" : "var(--text-color)",
                  opacity: day.isToday ? 1 : 0.65,
                }}
              >
                {day.dayName}
              </div>

              {/* Número de día grande (Google Calendar blue circle si es hoy) */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  marginTop: "0.15rem",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  backgroundColor: day.isToday ? "#1a73e8" : isSelected ? "#2563eb" : "transparent",
                  color: day.isToday || isSelected ? "#ffffff" : "var(--text-color)",
                  boxShadow: day.isToday ? "0 2px 6px rgba(26, 115, 232, 0.4)" : "none",
                }}
              >
                {day.dayNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CUERPO DE LA CUADRÍCULA 24H (CON SCROLL CONTINUO Y EVENTOS POSICIONADOS) */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          backgroundColor: "var(--surface-color)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "64px repeat(7, 1fr)",
            height: `${TOTAL_GRID_HEIGHT}px`,
            position: "relative",
          }}
        >
          {/* Columna de etiquetas horarias a la izquierda */}
          <div
            style={{
              borderRight: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              position: "relative",
              userSelect: "none",
            }}
          >
            {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
              <div
                key={h}
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  position: "relative",
                  borderBottom: "1px solid var(--border-color)",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "8px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "var(--text-color)",
                    opacity: 0.5,
                  }}
                >
                  {formatHourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* 7 Columnas de Días */}
          {weekDays.map((day) => {
            const dayPositioned = positionedByDay[day.dateStr] || [];

            // Selección activa de arrastre en este día
            const isDraggingThisDay = dragState.isDragging && dragState.dayStr === day.dateStr;
            const dragMin = isDraggingThisDay
              ? Math.min(dragState.startMinutes, dragState.currentMinutes)
              : 0;
            const dragMax = isDraggingThisDay
              ? Math.max(dragState.startMinutes, dragState.currentMinutes)
              : 0;
            const dragHeight = Math.max(15, dragMax - dragMin);

            return (
              <div
                key={day.dateStr}
                onMouseDown={(e) => handleColumnMouseDown(e, day.dateStr)}
                onMouseMove={(e) => handleColumnMouseMove(e, day.dateStr)}
                style={{
                  borderRight: "1px solid var(--border-color)",
                  position: "relative",
                  height: `${TOTAL_GRID_HEIGHT}px`,
                  backgroundColor: day.isToday ? "rgba(26, 115, 232, 0.015)" : "transparent",
                  cursor: "cell",
                }}
              >
                {/* Líneas horizontales de cada hora */}
                {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
                  <div
                    key={h}
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      borderBottom: "1px solid var(--border-color)",
                      opacity: 0.6,
                      boxSizing: "border-box",
                      pointerEvents: "none",
                    }}
                  />
                ))}

                {/* Línea roja indicadora de Hora Actual (Google Calendar Red Line) */}
                {day.isToday && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${nowMinutes}px`,
                      height: "2px",
                      backgroundColor: "#ea4335",
                      zIndex: 8,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#ea4335",
                        marginLeft: "-5px",
                        boxShadow: "0 0 6px rgba(234, 67, 53, 0.6)",
                      }}
                    />
                  </div>
                )}

                {/* Recuadro visual de selección por arrastre (15 min discretized) */}
                {isDraggingThisDay && (
                  <div
                    style={{
                      position: "absolute",
                      left: "2px",
                      right: "2px",
                      top: `${dragMin}px`,
                      height: `${dragHeight}px`,
                      backgroundColor: "rgba(26, 115, 232, 0.25)",
                      border: "2px dashed #1a73e8",
                      borderRadius: "6px",
                      zIndex: 9,
                      pointerEvents: "none",
                      display: "flex",
                      flexDirection: "column",
                      padding: "4px 6px",
                      boxSizing: "border-box",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#1a73e8",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        alignSelf: "flex-start",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      {minutesToTimeString(dragMin)} - {minutesToTimeString(dragMax || dragMin + 15)}
                    </span>
                  </div>
                )}

                {/* Eventos posicionados en el día */}
                {dayPositioned.map((pos) => {
                  const m = pos.meeting;
                  const colors = getEventColors(m);
                  const top = pos.startMinutes;
                  const height = Math.max(22, pos.endMinutes - pos.startMinutes - 2);

                  // Ancho y posición lateral para eventos solapados lado a lado
                  const widthPercent = 100 / pos.totalCols;
                  const leftPercent = pos.colIndex * widthPercent;

                  return (
                    <div
                      key={m.id}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMeeting(m);
                      }}
                      title={`${m.title} (${m.time} hs) - Clic para detalles`}
                      style={{
                        position: "absolute",
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderRadius: "5px",
                        padding: height < 35 ? "2px 5px" : "4px 7px",
                        fontSize: "0.74rem",
                        lineHeight: 1.25,
                        overflow: "hidden",
                        cursor: "pointer",
                        zIndex: 4,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        transition: "filter 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                    >
                      {/* Título en negrita */}
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: height < 30 ? "0.7rem" : "0.75rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {colors.type === "meet" && <Video size={11} style={{ flexShrink: 0 }} />}
                        <span>{m.title || m.clientName}</span>
                      </div>

                      {/* Horario si la tarjeta tiene suficiente altura */}
                      {height >= 34 && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            opacity: 0.9,
                            fontWeight: 600,
                            marginTop: "1px",
                          }}
                        >
                          {m.time} – {minutesToTimeString(pos.endMinutes)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
