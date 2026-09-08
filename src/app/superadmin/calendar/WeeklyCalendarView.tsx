"use client";

import React, { useState, useEffect } from "react";
import { SuperadminMeeting } from "@/lib/superadminCalendarStore";
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  ExternalLink,
  Plus,
  User,
  Sparkles,
} from "lucide-react";

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

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

function getMontevideoNowTime() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Montevideo",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());

    let hour = 0;
    let minute = 0;
    for (const p of parts) {
      if (p.type === "hour") hour = Number(p.value);
      if (p.type === "minute") minute = Number(p.value);
    }
    return { hour, minute };
  } catch (e) {
    const d = new Date(Date.now() - 3 * 3600 * 1000);
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
}

export default function WeeklyCalendarView({
  weekDays,
  meetings,
  onSelectMeeting,
  selectedCalendarDay,
  onSelectDay,
  onDragCreate,
}: WeeklyCalendarViewProps) {
  // Estado para arrastrar y seleccionar intervalo
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dayStr: string | null;
    startHour: string | null;
    currentHour: string | null;
  }>({
    isDragging: false,
    dayStr: null,
    startHour: null,
    currentHour: null,
  });

  // Hora actual en Montevideo para la línea indicadora
  const [nowTime, setNowTime] = useState<{ hour: number; minute: number }>(() =>
    getMontevideoNowTime()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(getMontevideoNowTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Agrupar reuniones por día
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

  // Ordenar reuniones de cada día por hora
  for (const dateStr in meetingsByDay) {
    meetingsByDay[dateStr].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
  }

  // Manejadores de arrastre
  const handleCellMouseDown = (dayStr: string, hourStr: string) => {
    setDragState({
      isDragging: true,
      dayStr,
      startHour: hourStr,
      currentHour: hourStr,
    });
  };

  const handleCellMouseEnter = (dayStr: string, hourStr: string) => {
    if (dragState.isDragging && dragState.dayStr === dayStr) {
      setDragState((prev) => ({ ...prev, currentHour: hourStr }));
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.dayStr && dragState.startHour && dragState.currentHour) {
      const h1 = parseInt(dragState.startHour.split(":")[0], 10);
      const h2 = parseInt(dragState.currentHour.split(":")[0], 10);
      const minH = Math.min(h1, h2);
      const maxH = Math.max(h1, h2);

      const startTime = `${String(minH).padStart(2, "0")}:00`;
      const endH = maxH === minH ? minH + 1 : maxH + 1;
      const endTime = `${String(Math.min(23, endH)).padStart(2, "0")}:${endH > 23 ? "59" : "00"}`;

      if (onDragCreate) {
        onDragCreate({
          date: dragState.dayStr,
          startTime,
          endTime,
        });
      }
    }
    setDragState({ isDragging: false, dayStr: null, startHour: null, currentHour: null });
  };

  // Calcular rango activo de arrastre
  let dragMinHour = -1;
  let dragMaxHour = -1;
  if (dragState.isDragging && dragState.startHour && dragState.currentHour) {
    const h1 = parseInt(dragState.startHour.split(":")[0], 10);
    const h2 = parseInt(dragState.currentHour.split(":")[0], 10);
    dragMinHour = Math.min(h1, h2);
    dragMaxHour = Math.max(h1, h2);
  }

  return (
    <div
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        userSelect: dragState.isDragging ? "none" : "auto",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* CUADRÍCULA SEMANAL: ENCABEZADO DE DÍAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "68px repeat(7, minmax(130px, 1fr))",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-color)",
          overflowX: "auto",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Columna de hora vacía en encabezado */}
        <div
          style={{
            padding: "0.75rem 0.5rem",
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.72rem",
            fontWeight: 800,
            opacity: 0.5,
            letterSpacing: "0.5px",
          }}
        >
          HORA
        </div>

        {/* 7 Columnas de días */}
        {weekDays.map((day) => {
          const dayMeetings = meetingsByDay[day.dateStr] || [];
          const isSelected = selectedCalendarDay === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDay(day.dateStr)}
              style={{
                padding: "0.75rem 0.5rem",
                textAlign: "center",
                borderRight: "1px solid var(--border-color)",
                backgroundColor: isSelected
                  ? "rgba(37, 99, 235, 0.08)"
                  : day.isToday
                  ? "rgba(16, 185, 129, 0.06)"
                  : "transparent",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: day.isToday ? "#10b981" : "var(--text-color)",
                  opacity: day.isToday ? 1 : 0.65,
                }}
              >
                {day.dayName}
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  marginTop: "0.2rem",
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  backgroundColor: day.isToday
                    ? "#10b981"
                    : isSelected
                    ? "#2563eb"
                    : "transparent",
                  color: day.isToday || isSelected ? "#fff" : "var(--text-color)",
                  boxShadow: day.isToday ? "0 2px 8px rgba(16, 185, 129, 0.35)" : "none",
                }}
              >
                {day.dayNum}
              </div>

              {dayMeetings.length > 0 && (
                <div style={{ marginTop: "0.2rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "10px",
                      backgroundColor: day.isToday
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(59, 130, 246, 0.15)",
                      color: day.isToday ? "#10b981" : "#3b82f6",
                    }}
                  >
                    {dayMeetings.length} {dayMeetings.length === 1 ? "evento" : "eventos"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CUERPO DE LA CUADRÍCULA: FILAS POR HORA */}
      <div
        style={{
          maxHeight: "750px",
          overflowY: "auto",
          overflowX: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "68px repeat(7, minmax(130px, 1fr))",
            minWidth: "980px",
          }}
        >
          {HOURS.map((hourStr, hourIdx) => {
            const currentHourNum = parseInt(hourStr.split(":")[0], 10);

            return (
              <React.Fragment key={hourStr}>
                {/* Etiqueta de hora a la izquierda */}
                <div
                  style={{
                    padding: "0.6rem 0.5rem",
                    borderRight: "1px solid var(--border-color)",
                    borderBottom: "1px solid var(--border-color)",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "var(--text-color)",
                    opacity: 0.6,
                    textAlign: "right",
                    backgroundColor: "var(--bg-color)",
                    userSelect: "none",
                  }}
                >
                  {hourStr}
                </div>

                {/* Celdas para cada día en esta hora */}
                {weekDays.map((day) => {
                  const dayMeetings = meetingsByDay[day.dateStr] || [];

                  // Filtrar eventos que caen dentro de esta hora (o si es 07:00 incluir más tempranos, si es 23:00 más tardíos)
                  const cellMeetings = dayMeetings.filter((m) => {
                    const [mHour] = (m.time || "00:00").split(":").map(Number);
                    if (hourIdx === 0 && mHour < currentHourNum) {
                      return true; // Eventos tempranos antes de las 7am
                    }
                    if (hourIdx === HOURS.length - 1 && mHour > currentHourNum) {
                      return true; // Eventos tardíos después de las 23hs
                    }
                    return mHour === currentHourNum;
                  });

                  // Comprobar si esta celda está dentro de la selección activa por arrastre
                  const isCellDragged =
                    dragState.isDragging &&
                    dragState.dayStr === day.dateStr &&
                    currentHourNum >= dragMinHour &&
                    currentHourNum <= dragMaxHour;

                  // Indicador de hora actual
                  const isCurrentHourCell = day.isToday && nowTime.hour === currentHourNum;
                  const currentMinutePercent = Math.min(100, Math.max(0, (nowTime.minute / 60) * 100));

                  return (
                    <div
                      key={`${day.dateStr}-${hourStr}`}
                      onMouseDown={() => handleCellMouseDown(day.dateStr, hourStr)}
                      onMouseEnter={() => handleCellMouseEnter(day.dateStr, hourStr)}
                      title="Arrastra para agendar un evento en este horario"
                      style={{
                        borderRight: "1px solid var(--border-color)",
                        borderBottom: "1px solid var(--border-color)",
                        minHeight: "62px",
                        padding: "3px",
                        backgroundColor: isCellDragged
                          ? "rgba(16, 185, 129, 0.18)"
                          : day.isToday
                          ? "rgba(16, 185, 129, 0.02)"
                          : "transparent",
                        outline: isCellDragged ? "2px dashed #10b981" : "none",
                        outlineOffset: "-2px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        position: "relative",
                        cursor: "crosshair",
                        transition: "background-color 0.1s",
                      }}
                    >
                      {/* Indicador de hora actual en vivo */}
                      {isCurrentHourCell && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${currentMinutePercent}%`,
                            height: "2px",
                            backgroundColor: "#ef4444",
                            zIndex: 5,
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#ef4444",
                              marginLeft: "-4px",
                              boxShadow: "0 0 6px #ef4444",
                            }}
                          />
                        </div>
                      )}

                      {/* Tag flotante de arrastre si es la primera celda seleccionada */}
                      {isCellDragged && currentHourNum === dragMinHour && (
                        <div
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            backgroundColor: "#10b981",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            zIndex: 6,
                            pointerEvents: "none",
                          }}
                        >
                          {String(dragMinHour).padStart(2, "0")}:00 - {String(dragMaxHour + 1).padStart(2, "0")}:00
                        </div>
                      )}

                      {/* Renderizado de eventos en la celda */}
                      {cellMeetings.map((m) => {
                        const isGoogle = m.isGoogleEvent || m.id.startsWith("gcal-");
                        const isMeet = !isGoogle && (m.meetUrl || m.id.startsWith("meet-"));
                        const isManual = !isGoogle && !isMeet;

                        // Colores de tarjeta
                        const badgeBg = isGoogle
                          ? "rgba(59, 130, 246, 0.14)"
                          : isMeet
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(139, 92, 246, 0.15)";

                        const borderColor = isGoogle
                          ? "#3b82f6"
                          : isMeet
                          ? "#10b981"
                          : "#8b5cf6";

                        const badgeText = isGoogle
                          ? "#3b82f6"
                          : isMeet
                          ? "#10b981"
                          : "#8b5cf6";

                        return (
                          <div
                            key={m.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMeeting(m);
                            }}
                            title={`${m.title} (${m.time} hs) - Clic para ver detalles`}
                            style={{
                              padding: "0.35rem 0.45rem",
                              borderRadius: "6px",
                              backgroundColor: badgeBg,
                              borderLeft: `3px solid ${borderColor}`,
                              borderTop: `1px solid ${badgeBg}`,
                              borderRight: `1px solid ${badgeBg}`,
                              borderBottom: `1px solid ${badgeBg}`,
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              lineHeight: 1.25,
                              transition: "transform 0.1s, box-shadow 0.1s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              position: "relative",
                              zIndex: 2,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "2px",
                                marginBottom: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: badgeText,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {m.time}
                              </span>

                              {isGoogle ? (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                                    color: "#3b82f6",
                                    padding: "0.05rem 0.35rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Google
                                </span>
                              ) : isMeet ? (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                                    color: "#10b981",
                                    padding: "0.05rem 0.35rem",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <Video size={9} /> Meet
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(139, 92, 246, 0.2)",
                                    color: "#8b5cf6",
                                    padding: "0.05rem 0.35rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Agenda
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--text-color)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {m.title || m.clientName}
                            </div>

                            {m.clientName && m.title !== m.clientName && (
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  opacity: 0.75,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {m.clientName}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
