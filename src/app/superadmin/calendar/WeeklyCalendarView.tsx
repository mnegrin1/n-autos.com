"use client";

import React from "react";
import { SuperadminMeeting } from "@/lib/superadminCalendarStore";
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
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
}

const HOURS = [
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
];

export default function WeeklyCalendarView({
  weekDays,
  meetings,
  onSelectMeeting,
  selectedCalendarDay,
  onSelectDay,
}: WeeklyCalendarViewProps) {
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

  return (
    <div
      style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* CUADRÍCULA SEMANAL: ENCABEZADO DE DÍAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "65px repeat(7, minmax(130px, 1fr))",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-color)",
          overflowX: "auto",
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
            fontSize: "0.75rem",
            fontWeight: 700,
            opacity: 0.5,
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
                      padding: "0.1rem 0.4rem",
                      borderRadius: "10px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
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
          maxHeight: "720px",
          overflowY: "auto",
          overflowX: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "65px repeat(7, minmax(130px, 1fr))",
            minWidth: "975px",
          }}
        >
          {HOURS.map((hourStr, hourIdx) => {
            const currentHourNum = parseInt(hourStr.split(":")[0], 10);

            return (
              <React.Fragment key={hourStr}>
                {/* Etiqueta de hora a la izquierda */}
                <div
                  style={{
                    padding: "0.5rem 0.4rem",
                    borderRight: "1px solid var(--border-color)",
                    borderBottom: "1px solid var(--border-color)",
                    fontSize: "0.75rem",
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

                  // Filtrar eventos que caen dentro de esta hora (o si es la primera hora 08:00, incluir eventos más tempranos)
                  const cellMeetings = dayMeetings.filter((m) => {
                    const [mHour] = (m.time || "00:00").split(":").map(Number);
                    if (hourIdx === 0 && mHour < currentHourNum) {
                      return true; // Eventos tempranos antes de las 8am
                    }
                    if (hourIdx === HOURS.length - 1 && mHour > currentHourNum) {
                      return true; // Eventos tardíos después de las 20hs
                    }
                    return mHour === currentHourNum;
                  });

                  return (
                    <div
                      key={`${day.dateStr}-${hourStr}`}
                      style={{
                        borderRight: "1px solid var(--border-color)",
                        borderBottom: "1px solid var(--border-color)",
                        minHeight: "56px",
                        padding: "2px",
                        backgroundColor: day.isToday
                          ? "rgba(16, 185, 129, 0.02)"
                          : "transparent",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      {cellMeetings.map((m) => {
                        const isGoogle = m.isGoogleEvent || m.id.startsWith("gcal-");

                        return (
                          <div
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMeeting(m);
                            }}
                            title={`${m.title} (${m.time} hs) - Clic para ver detalles`}
                            style={{
                              padding: "0.35rem 0.45rem",
                              borderRadius: "6px",
                              backgroundColor: isGoogle
                                ? "rgba(59, 130, 246, 0.12)"
                                : "rgba(16, 185, 129, 0.14)",
                              borderLeft: `3px solid ${isGoogle ? "#2563eb" : "#10b981"}`,
                              borderTop: `1px solid ${isGoogle ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                              borderRight: `1px solid ${isGoogle ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                              borderBottom: `1px solid ${isGoogle ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              lineHeight: 1.25,
                              transition: "transform 0.1s, box-shadow 0.1s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                                  color: isGoogle ? "#2563eb" : "#10b981",
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
                                    color: "#2563eb",
                                    padding: "0.05rem 0.3rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Google
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                                    color: "#10b981",
                                    padding: "0.05rem 0.3rem",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <Video size={9} /> Meet
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

                            {!isGoogle && m.clientName && m.title !== m.clientName && (
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
