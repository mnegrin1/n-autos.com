"use client";

import { useState, useTransition } from "react";
import { Mail, X, Send, Loader2 } from "lucide-react";
import { sendEmailAction } from "@/actions/emailActions";

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

export default function ComposeEmailModal({
  isOpen,
  onClose,
  defaultTo = "",
  defaultSubject = "",
  defaultMessage = ""
}: ComposeEmailModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !message.trim()) {
      alert("Por favor completa todos los campos.");
      return;
    }

    startTransition(async () => {
      const res = await sendEmailAction(to, subject, message);
      if (res.success) {
        alert("¡Correo enviado exitosamente!");
        onClose();
        setTo("");
        setSubject("");
        setMessage("");
      } else {
        alert(`Error al enviar el correo: ${res.error || "Ocurrió un error inesperado."}`);
      }
    });
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: "var(--surface-color)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "550px",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-color)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", padding: "0.4rem", borderRadius: "8px", display: "flex" }}>
              <Mail size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-color)" }}>
              Redactar Correo Electrónico
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.7, cursor: "pointer", display: "flex" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}>
              Para (Correo del destinatario) *
            </label>
            <input 
              type="email" 
              required
              placeholder="ejemplo@cliente.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}>
              Asunto *
            </label>
            <input 
              type="text" 
              required
              placeholder="Consulta sobre vehículo / Presupuesto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}>
              Mensaje *
            </label>
            <textarea 
              required
              rows={6}
              placeholder="Escribe aquí el contenido del mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
                fontSize: "0.9rem",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isPending}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "transparent",
                color: "var(--text-color)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              style={{
                padding: "0.65rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isPending ? "Enviando..." : "Enviar Correo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
