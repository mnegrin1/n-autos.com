"use client";

import { useState, useTransition } from "react";
import { Mail, Plus, Send, Tag, Users, CheckCircle2, AlertCircle, Clock, Search, X } from "lucide-react";
import { sendBroadcastAction, BroadcastLog } from "@/actions/broadcastActions";

interface BroadcastsClientProps {
  initialBroadcasts: BroadcastLog[];
  allLeads: { id: string; name: string; email: string; tags?: string[] }[];
  currentUser: any;
}

export default function BroadcastsClient({ initialBroadcasts, allLeads, currentUser }: BroadcastsClientProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastLog[]>(initialBroadcasts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedTargetTags, setSelectedTargetTags] = useState<string[]>(["ALL"]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Obtener la lista de todas las etiquetas únicas presentes en los leads
  const availableTags = Array.from(
    new Set(allLeads.flatMap(l => (Array.isArray(l.tags) ? l.tags : [])))
  ).sort();

  // Calcular número de destinatarios estimados en tiempo real según los tags seleccionados
  const matchingLeadsCount = allLeads.filter(lead => {
    if (!lead.email || !lead.email.trim() || !lead.email.includes("@")) return false;
    if (selectedTargetTags.includes("ALL") || selectedTargetTags.length === 0) return true;
    const leadTags = Array.isArray(lead.tags) ? lead.tags : [];
    return selectedTargetTags.some(t => leadTags.includes(t));
  }).length;

  const toggleTagSelection = (tag: string) => {
    if (tag === "ALL") {
      setSelectedTargetTags(["ALL"]);
      return;
    }

    const withoutAll = selectedTargetTags.filter(t => t !== "ALL");
    if (withoutAll.includes(tag)) {
      const next = withoutAll.filter(t => t !== tag);
      setSelectedTargetTags(next.length === 0 ? ["ALL"] : next);
    } else {
      setSelectedTargetTags([...withoutAll, tag]);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !bodyHtml.trim()) {
      alert("Por favor ingresa un asunto y el cuerpo del mensaje.");
      return;
    }

    if (matchingLeadsCount === 0) {
      alert("No hay contactos válidos con email para la selección de etiquetas actual.");
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas enviar este correo masivo a ${matchingLeadsCount} contacto(s)?`)) {
      return;
    }

    setStatusMessage(null);

    startTransition(async () => {
      const res = await sendBroadcastAction({
        agencyId: currentUser?.agency_id || "00000000-0000-0000-0000-000000000000",
        subject,
        bodyHtml,
        targetTags: selectedTargetTags
      });

      if (res.success && res.data) {
        setStatusMessage({
          type: "success",
          text: ` Broadcast enviado exitosamente a ${res.data.sentCount} contactos.`
        });
        
        // Agregar al registro local
        const newLog: BroadcastLog = {
          subject,
          body_html: bodyHtml,
          target_tags: selectedTargetTags,
          recipients_count: res.data.totalRecipients,
          sent_count: res.data.sentCount,
          failed_count: res.data.failedCount,
          status: res.data.failedCount === 0 ? "sent" : "partial",
          created_at: new Date().toISOString()
        };
        setBroadcasts(prev => [newLog, ...prev]);

        // Resetear formulario
        setSubject("");
        setBodyHtml("");
        setSelectedTargetTags(["ALL"]);
        setShowCreateModal(false);
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Ocurrió un error al enviar el broadcast."
        });
      }
    });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Mail size={24} style={{ color: "var(--primary)" }} /> Broadcasts & Envíos Masivos
          </h1>
          <p style={{ marginTop: "0.35rem", opacity: 0.75, fontSize: "0.9rem" }}>
            Envía comunicaciones dirigidas a tus contactos segmentados por etiquetas en tiempo real.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: "var(--text-color)",
            color: "var(--bg-color)",
            border: "none",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
          }}
        >
          <Plus size={18} /> Nuevo Broadcast
        </button>
      </div>

      {statusMessage && (
        <div style={{
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          backgroundColor: statusMessage.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${statusMessage.type === "success" ? "#22c55e" : "#ef4444"}`,
          color: statusMessage.type === "success" ? "#166534" : "#991b1b",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMessage.text}
        </div>
      )}

      {/* Historial de Broadcasts */}
      <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={18} /> Historial de Envíos Masivos ({broadcasts.length})
        </h2>

        {broadcasts.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", opacity: 0.6, fontSize: "0.9rem" }}>
            No has realizado envíos masivos aún. Haz clic en <strong>"Nuevo Broadcast"</strong> para comenzar.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {broadcasts.map((b, idx) => {
              const date = b.created_at ? new Date(b.created_at) : new Date();
              const formattedDate = date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={b.id || idx}
                  style={{
                    backgroundColor: "var(--bg-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-color)" }}>
                      {b.subject}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", opacity: 0.75 }}>
                      <span>🕒 {formattedDate}</span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Tag size={12} /> Tags: {Array.isArray(b.target_tags) ? b.target_tags.join(", ") : "Todos"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, display: "block" }}>
                        {b.sent_count} / {b.recipients_count} enviados
                      </span>
                      {b.failed_count > 0 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--danger, #ef4444)" }}>
                          ({b.failed_count} fallidos)
                        </span>
                      )}
                    </div>
                    <span style={{
                      backgroundColor: b.status === "sent" ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
                      color: b.status === "sent" ? "#15803d" : "#a16207",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase"
                    }}>
                      {b.status === "sent" ? "Exitoso" : "Parcial"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Composer para Nuevo Broadcast */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "2rem",
            width: "90%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Send size={20} style={{ color: "var(--primary)" }} /> Redactar Nuevo Broadcast
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Asunto */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Asunto del Correo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Oportunidad exclusiva en vehículos de inversión esta semana 🚀"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              {/* Segmentación por Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Destinatarios (Segmentados por Tags)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                  <button
                    type="button"
                    onClick={() => toggleTagSelection("ALL")}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: "16px",
                      border: "none",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      backgroundColor: selectedTargetTags.includes("ALL") ? "var(--primary)" : "rgba(128,128,128,0.15)",
                      color: selectedTargetTags.includes("ALL") ? "#ffffff" : "var(--text-color)"
                    }}
                  >
                    Todos los Contactos
                  </button>

                  {availableTags.map(tag => {
                    const isSelected = selectedTargetTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagSelection(tag)}
                        style={{
                          padding: "0.3rem 0.7rem",
                          borderRadius: "16px",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--primary)" : "rgba(128,128,128,0.15)",
                          color: isSelected ? "#ffffff" : "var(--text-color)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <Tag size={12} /> {tag}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Users size={14} /> 🎯 Se enviará a {matchingLeadsCount} contacto(s) que coinciden con las etiquetas seleccionadas.
                </div>
              </div>

              {/* Mensaje HTML */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Contenido del Mensaje (Soporta HTML)</label>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Usa <code>{"{{nombre}}"}</code> para personalizar</span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Hola {{nombre}},&#10;&#10;Queremos compartirte las novedades de este mes..."
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontFamily: "monospace", fontSize: "0.85rem" }}
                />
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", padding: "0.75rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "var(--text-color)", cursor: "pointer" }}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  disabled={isPending || matchingLeadsCount === 0}
                >
                  <Send size={16} /> {isPending ? "Enviando Broadcast..." : `Enviar a ${matchingLeadsCount} Contactos`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
