"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getSupportTickets, 
  addMessageToTicket, 
  markTicketAsRead, 
  updateTicketStatus, 
  subscribeSupport, 
  SupportTicket 
} from "@/lib/supportStore";
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Building2, 
  Search,
  Filter
} from "lucide-react";

export default function SuperAdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = getSupportTickets();
    setTickets(loaded);
    if (loaded.length > 0 && !selectedTicketId) {
      setSelectedTicketId(loaded[0].id);
      markTicketAsRead(loaded[0].id, "superadmin");
    }

    const unsubscribe = subscribeSupport(() => {
      const updated = getSupportTickets();
      setTickets(updated);
    });
    return () => unsubscribe();
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tickets, selectedTicketId]);

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    markTicketAsRead(ticketId, "superadmin");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    addMessageToTicket(activeTicket.id, "superadmin", "Superadmin", replyText.trim());
    setReplyText("");
  };

  const handleStatusChange = (status: "open" | "in_progress" | "resolved") => {
    if (!activeTicket) return;
    updateTicketStatus(activeTicket.id, status);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && t.status === filterStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "calc(100vh - 140px)" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
          Soporte & Mensajes de Usuarios
        </h1>
        <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0 }}>
          Atención al cliente y comunicación centralizada con las automotoras registradas.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: "1.25rem",
        flex: 1,
        minHeight: 0
      }}>
        {/* Panel Izquierdo: Lista de Conversaciones */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar ticket o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem 0.55rem 2.4rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.825rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["all", "open", "in_progress", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    flex: 1,
                    padding: "0.35rem 0.2rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: filterStatus === st ? "var(--primary)" : "rgba(128,128,128,0.08)",
                    color: filterStatus === st ? "#fff" : "var(--text-color)",
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {st === "all" ? "Todos" : st === "open" ? "Abiertos" : st === "in_progress" ? "En Proceso" : "Resueltos"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {filteredTickets.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", opacity: 0.6, fontSize: "0.85rem" }}>
                No hay conversaciones de soporte.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket.id)}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-color)",
                      backgroundColor: isSelected ? "var(--primary-light)" : ticket.unreadSuperadmin ? "rgba(37, 99, 235, 0.04)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-color)" }}>
                        {ticket.userName}
                      </span>
                      {ticket.unreadSuperadmin && (
                        <span style={{
                          backgroundColor: "#ef4444",
                          color: "#fff",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "10px"
                        }}>
                          NUEVO
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "0.775rem", opacity: 0.7, color: "var(--text-color)" }}>
                      {ticket.agencyName}
                    </span>

                    <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ticket.subject}
                    </span>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.2rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: ticket.status === "resolved" ? "rgba(16, 185, 129, 0.15)" : ticket.status === "in_progress" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: ticket.status === "resolved" ? "#10b981" : ticket.status === "in_progress" ? "#f59e0b" : "#ef4444"
                      }}>
                        {ticket.status === "resolved" ? "Resuelto" : ticket.status === "in_progress" ? "En Proceso" : "Abierto"}
                      </span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                        {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho: Vista del Chat */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {activeTicket ? (
            <>
              {/* Header del Chat */}
              <div style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(128,128,128,0.02)"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                    {activeTicket.subject}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.3rem", fontSize: "0.8rem", opacity: 0.75 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <User size={13} /> {activeTicket.userName} ({activeTicket.userEmail})
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Building2 size={13} /> {activeTicket.agencyName}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.7 }}>Estado:</span>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="open">Abierto</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                </div>
              </div>

              {/* Mensajes */}
              <div style={{
                flex: 1,
                padding: "1.5rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                {activeTicket.messages.map((msg) => {
                  const isSuperadmin = msg.sender === "superadmin";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isSuperadmin ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        alignSelf: isSuperadmin ? "flex-end" : "flex-start"
                      }}
                    >
                      <span style={{ fontSize: "0.725rem", opacity: 0.6, marginBottom: "0.2rem" }}>
                        {msg.senderName} • {msg.timestamp}
                      </span>
                      <div style={{
                        padding: "0.85rem 1.15rem",
                        borderRadius: isSuperadmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        backgroundColor: isSuperadmin ? "var(--primary)" : "rgba(128,128,128,0.1)",
                        color: isSuperadmin ? "#fff" : "var(--text-color)",
                        fontSize: "0.9rem",
                        lineHeight: 1.4,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulario de Respuesta */}
              <form onSubmit={handleSendReply} style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: "0.75rem",
                backgroundColor: "rgba(128,128,128,0.02)"
              }}>
                <input
                  type="text"
                  placeholder="Escribe una respuesta para el usuario..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: replyText.trim() ? "pointer" : "not-allowed",
                    opacity: replyText.trim() ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <Send size={16} /> Responder
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
              Selecciona una conversación para responder.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
