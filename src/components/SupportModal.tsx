"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getSupportTickets, 
  createSupportTicket, 
  addMessageToTicket, 
  markTicketAsRead, 
  subscribeSupport, 
  SupportTicket 
} from "@/lib/supportStore";
import { Headphones, Send, X, MessageSquare, Plus, CheckCircle2, Clock } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  agencyName?: string;
}

export default function SupportModal({
  isOpen,
  onClose,
  userEmail = "mauricio@automotora.com",
  userName = "Mauricio Negrin",
  agencyName = "Test-Automotora"
}: SupportModalProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [initialMessageText, setInitialMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const userTickets = getSupportTickets().filter(t => t.userEmail === userEmail || true);
    setTickets(userTickets);

    if (userTickets.length > 0 && !activeTicketId) {
      setActiveTicketId(userTickets[0].id);
      markTicketAsRead(userTickets[0].id, "user");
    }

    const unsubscribe = subscribeSupport(() => {
      const updated = getSupportTickets().filter(t => t.userEmail === userEmail || true);
      setTickets(updated);
    });
    return () => unsubscribe();
  }, [isOpen, activeTicketId, userEmail]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tickets, activeTicketId, isCreatingNew]);

  if (!isOpen) return null;

  const activeTicket = tickets.find(t => t.id === activeTicketId) || null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeTicket) return;

    addMessageToTicket(activeTicket.id, "user", userName, newMessageText.trim());
    setNewMessageText("");
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialMessageText.trim()) return;

    const created = createSupportTicket(
      userEmail,
      userName,
      agencyName,
      newSubject.trim() || "Consulta de Soporte",
      initialMessageText.trim()
    );

    setActiveTicketId(created.id);
    setIsCreatingNew(false);
    setNewSubject("");
    setInitialMessageText("");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "680px",
        height: "580px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(37, 99, 235, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)"
            }}>
              <Headphones size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-color)" }}>
                Soporte Técnico Directo
              </h3>
              <p style={{ fontSize: "0.775rem", color: "var(--text-color)", opacity: 0.7, margin: 0 }}>
                Hablá directamente con el equipo de Superadmin n-sistemas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-color)", cursor: "pointer", opacity: 0.7 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Split View */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", flex: 1, minHeight: 0 }}>
          {/* Historial de Tickets */}
          <div style={{
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(128,128,128,0.02)"
          }}>
            <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>
              <button
                onClick={() => setIsCreatingNew(true)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  cursor: "pointer"
                }}
              >
                <Plus size={14} /> Nueva Consulta
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {tickets.length === 0 ? (
                <div style={{ padding: "1.5rem", fontSize: "0.8rem", opacity: 0.6, textAlign: "center" }}>
                  Sin consultas previas
                </div>
              ) : (
                tickets.map((ticket) => {
                  const isSelected = !isCreatingNew && activeTicketId === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setIsCreatingNew(false);
                        setActiveTicketId(ticket.id);
                        markTicketAsRead(ticket.id, "user");
                      }}
                      style={{
                        padding: "0.75rem 0.85rem",
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "var(--primary-light)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem"
                      }}
                    >
                      <span style={{ fontSize: "0.825rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ticket.subject}
                      </span>
                      <span style={{
                        fontSize: "0.675rem",
                        fontWeight: 700,
                        color: ticket.status === "resolved" ? "#10b981" : "#f59e0b"
                      }}>
                        {ticket.status === "resolved" ? "Resuelto" : "En Proceso"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Area Principal de Chat / Nuevo Ticket */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {isCreatingNew ? (
              <form onSubmit={handleCreateTicket} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Nueva Consulta a Soporte</h4>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.3rem" }}>
                    Asunto / Tema
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ayuda con publicaciones, dudas sobre facturación..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.3rem" }}>
                    Detalle de tu mensaje
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Escribe aquí tu consulta o problema..."
                    value={initialMessageText}
                    onChange={(e) => setInitialMessageText(e.target.value)}
                    style={{
                      width: "100%",
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.875rem",
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      background: "transparent",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Enviar Consulta
                  </button>
                </div>
              </form>
            ) : activeTicket ? (
              <>
                {/* Mensajes del Chat */}
                <div style={{
                  flex: 1,
                  padding: "1.25rem",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem"
                }}>
                  {activeTicket.messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isUser ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          alignSelf: isUser ? "flex-end" : "flex-start"
                        }}
                      >
                        <span style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: "0.15rem" }}>
                          {msg.senderName} • {msg.timestamp}
                        </span>
                        <div style={{
                          padding: "0.75rem 1rem",
                          borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          backgroundColor: isUser ? "var(--primary)" : "rgba(128,128,128,0.12)",
                          color: isUser ? "#fff" : "var(--text-color)",
                          fontSize: "0.875rem",
                          lineHeight: 1.4
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input de respuesta */}
                <form onSubmit={handleSendMessage} style={{
                  padding: "0.85rem 1rem",
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  gap: "0.5rem"
                }}>
                  <input
                    type="text"
                    placeholder="Escribe tu respuesta a soporte..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: newMessageText.trim() ? "pointer" : "not-allowed",
                      opacity: newMessageText.trim() ? 1 : 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <Send size={15} /> Enviar
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, fontSize: "0.85rem" }}>
                Presiona "Nueva Consulta" para iniciar una conversación con Soporte.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
