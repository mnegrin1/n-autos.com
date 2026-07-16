"use client";

import { useState, useTransition, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Car, Trash2, X, AlertCircle } from "lucide-react";
import { createEvent, deleteEvent } from "@/actions/otherActions";
import { useSearchParams, useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  start: string; // ISO String
  end: string;   // ISO String
  type: "visita" | "reunion" | "llamada"; // visita represents test drive in auto
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
}

interface CalendarClientProps {
  initialEvents: Event[];
  vehicles: Vehicle[];
}

export default function CalendarClient({ initialEvents, vehicles }: CalendarClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setShowAddModal(true);
      router.replace("/admin/calendar");
    }
  }, [searchParams]);

  const [formState, setFormState] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    vehicleId: "",
    type: "visita" as const, // visita = test drive
    clientName: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get the first day of the month
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Get total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  // Previous month total days
  const prevTotalDays = new Date(year, month, 0).getDate();

  // Calendar matrix
  const daysArray: { dayNum: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Fill previous month trailing days
  // in JS, Sunday is 0, Monday is 1... let's adjust for Monday-first or standard Sunday-first
  // Let's use Sunday-first for simplicity
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevTotalDays - i;
    daysArray.push({
      dayNum,
      isCurrentMonth: false,
      date: new Date(year, month - 1, dayNum)
    });
  }

  // Fill current month days
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({
      dayNum: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Fill next month leading days
  const totalSlots = 42; // 6 rows of 7 days
  const nextMonthDaysNeeded = totalSlots - daysArray.length;
  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    daysArray.push({
      dayNum: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Fetch events for selected date
  const selectedDateEvents = events.filter((e) => {
    const eventDate = new Date(e.start);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => a.start.localeCompare(b.start));

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      const res = await deleteEvent(id);
      if (res.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
      } else {
        alert("Error al eliminar evento: " + res.error);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title) {
      alert("El título de la cita es obligatorio");
      return;
    }

    const startDateTime = new Date(`${formState.date}T${formState.time}:00`);
    // default end is +1 hr
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const vehicleObj = vehicles.find(v => v.id === formState.vehicleId);
    const vehicleText = vehicleObj ? ` - Auto: ${vehicleObj.brand} ${vehicleObj.model}` : "";
    const clientText = formState.clientName ? ` (Cliente: ${formState.clientName})` : "";
    
    const finalTitle = `${formState.title}${vehicleText}${clientText}`;

    startTransition(async () => {
      const res = await createEvent({
        title: finalTitle,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type: formState.type
      });

      if (res.success && res.data) {
        // format returned event to match frontend state
        const created = {
          id: res.data.id,
          title: res.data.title,
          start: res.data.start,
          end: res.data.end,
          type: res.data.type
        };
        setEvents(prev => [...prev, created]);
        setShowAddModal(false);
        setFormState({
          title: "",
          date: new Date().toISOString().split("T")[0],
          time: "10:00",
          vehicleId: "",
          type: "visita",
          clientName: "",
        });
      } else {
        alert("Error al crear evento.");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>Citas y Test Drives</h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem" }}>Programa y controla las pruebas de manejo de los vehículos.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ backgroundColor: "#10b981", borderColor: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}
          onClick={() => {
            setFormState(prev => ({ ...prev, date: selectedDate.toISOString().split("T")[0] }));
            setShowAddModal(true);
          }}
        >
          <Plus size={16} /> Agendar Test Drive
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "2rem" }}>
        
        {/* Calendar Grid Card */}
        <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={handlePrevMonth} 
                style={{ padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth} 
                style={{ padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", textAlign: "center", fontWeight: "600", fontSize: "0.8rem", opacity: 0.5, marginBottom: "0.5rem" }}>
            <div>DOM</div>
            <div>LUN</div>
            <div>MAR</div>
            <div>MIE</div>
            <div>JUE</div>
            <div>VIE</div>
            <div>SAB</div>
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {daysArray.map((day, i) => {
              const isSelected = day.date.toDateString() === selectedDate.toDateString();
              const isToday = day.date.toDateString() === new Date().toDateString();
              const dayEvents = events.filter((e) => {
                const eventDate = new Date(e.start);
                return eventDate.toDateString() === day.date.toDateString();
              });

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day.date)}
                  style={{
                    aspectRatio: "1",
                    padding: "0.5rem",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid #10b981" : "1px solid var(--border-color)",
                    backgroundColor: isSelected ? "rgba(16, 185, 129, 0.05)" : day.isCurrentMonth ? "var(--bg-color)" : "var(--surface-color)",
                    color: day.isCurrentMonth ? "var(--text-color)" : "rgba(var(--text-color), 0.3)",
                    opacity: day.isCurrentMonth ? 1 : 0.4,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative"
                  }}
                >
                  <span style={{
                    fontSize: "0.9rem",
                    fontWeight: isToday || isSelected ? "700" : "500",
                    color: isToday ? "#10b981" : "inherit",
                    backgroundColor: isToday ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "6px"
                  }}>
                    {day.dayNum}
                  </span>
                  
                  {/* Event Indicators */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", justifyContent: "center", width: "100%", overflow: "hidden" }}>
                      {dayEvents.slice(0, 3).map((e) => {
                        let dotColor = "#3b82f6"; // reunion
                        if (e.type === "visita") dotColor = "#10b981"; // test drive
                        if (e.type === "llamada") dotColor = "#f59e0b"; // llamada
                        return (
                          <div 
                            key={e.id} 
                            style={{ 
                              width: "6px", 
                              height: "6px", 
                              borderRadius: "50%", 
                              backgroundColor: dotColor 
                            }} 
                          />
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: "7px", fontWeight: "700", opacity: 0.6 }}>+</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agenda details */}
        <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            Agenda para el {selectedDate.toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", maxHeight: "400px" }}>
            {selectedDateEvents.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, opacity: 0.5, padding: "2rem 0" }}>
                <AlertCircle size={28} style={{ marginBottom: "0.5rem" }} />
                <span style={{ fontSize: "0.9rem" }}>Sin citas programadas para este día</span>
              </div>
            ) : (
              selectedDateEvents.map((e) => {
                const startTime = new Date(e.start).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
                let colorClass = "rgba(59, 130, 246, 0.1)";
                let textCol = "#3b82f6";
                let typeLabel = "Reunión";
                if (e.type === "visita") {
                  colorClass = "rgba(16, 185, 129, 0.1)";
                  textCol = "#10b981";
                  typeLabel = "Test Drive";
                } else if (e.type === "llamada") {
                  colorClass = "rgba(245, 158, 11, 0.1)";
                  textCol = "#f59e0b";
                  typeLabel = "Llamada";
                }

                return (
                  <div 
                    key={e.id}
                    style={{ 
                      padding: "1rem", 
                      borderRadius: "12px", 
                      backgroundColor: "var(--bg-color)", 
                      border: "1px solid var(--border-color)",
                      borderLeft: `4px solid ${textCol}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      position: "relative"
                    }}
                  >
                    <button
                      onClick={() => handleDelete(e.id)}
                      style={{ position: "absolute", right: "12px", top: "12px", background: "none", border: "none", color: "var(--danger)", cursor: "pointer", opacity: 0.6 }}
                      title="Cancelar cita"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        fontSize: "0.7rem", 
                        fontWeight: "700", 
                        backgroundColor: colorClass, 
                        color: textCol, 
                        padding: "0.15rem 0.4rem", 
                        borderRadius: "4px",
                        textTransform: "uppercase"
                      }}>
                        {typeLabel}
                      </span>
                      <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={12} /> {startTime} hs
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", paddingRight: "20px", color: "var(--text-color)" }}>
                      {e.title}
                    </h4>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", width: "90%", maxWidth: "450px", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Agendar Cita / Test Drive</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Título de la Cita *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Prueba Chevrolet Cruze"
                  value={formState.title}
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Daniela Rodríguez"
                  value={formState.clientName}
                  onChange={(e) => setFormState(prev => ({ ...prev, clientName: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Vehículo Relacionado</label>
                <select
                  value={formState.vehicleId}
                  onChange={(e) => setFormState(prev => ({ ...prev, vehicleId: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
                >
                  <option value="">-- Seleccionar Vehículo (Opcional) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Fecha</label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) => setFormState(prev => ({ ...prev, date: e.target.value }))}
                    style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Hora</label>
                  <input
                    type="time"
                    required
                    value={formState.time}
                    onChange={(e) => setFormState(prev => ({ ...prev, time: e.target.value }))}
                    style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tipo de cita</label>
                <select
                  value={formState.type}
                  onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as any }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
                >
                  <option value="visita">Test Drive (Prueba de manejo)</option>
                  <option value="reunion">Reunión en Local</option>
                  <option value="llamada">Llamada de Venta</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "var(--text-color)", cursor: "pointer" }}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: "#10b981", border: "none", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "white", cursor: "pointer" }}
                  disabled={isPending}
                >
                  {isPending ? "Programando..." : "Programar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
