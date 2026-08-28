"use client";

import { useState } from "react";
import { X, ShieldAlert, Building, Globe, Send, CheckCircle2 } from "lucide-react";
import { createBrandingRequest } from "@/lib/brandingRequestStore";

interface BrandingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  currentName: string;
  currentSubdomain: string;
  userEmail?: string;
  userName?: string;
  onRequestSubmitted?: () => void;
}

export default function BrandingRequestModal({
  isOpen,
  onClose,
  agencyId,
  currentName,
  currentSubdomain,
  userEmail = "admin@automotora.com",
  userName = "Admin Automotora",
  onRequestSubmitted
}: BrandingRequestModalProps) {
  const [requestedName, setRequestedName] = useState(currentName);
  const [requestedSubdomain, setRequestedSubdomain] = useState(currentSubdomain);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!requestedName.trim()) {
      setError("Por favor ingresa el nuevo nombre solicitado.");
      return;
    }
    if (!requestedSubdomain.trim()) {
      setError("Por favor ingresa el nuevo subdominio solicitado.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Por favor proporciona una justificación o motivo detallado (mínimo 10 caracteres).");
      return;
    }

    createBrandingRequest({
      agencyId,
      currentName,
      requestedName: requestedName.trim(),
      currentSubdomain,
      requestedSubdomain: requestedSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      reason: reason.trim(),
      userEmail,
      userName
    });

    setIsSuccess(true);
    if (onRequestSubmitted) {
      onRequestSubmitted();
    }

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--card-bg, #1e293b)",
        color: "var(--text-color, #f8fafc)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "540px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.1))"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Solicitar Cambio de Nombre / Subdominio
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
                Medida de protección antifraude y auditoría de la plataforma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              opacity: 0.6,
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "1.5rem" }}>
          {isSuccess ? (
            <div style={{
              textAlign: "center",
              padding: "2rem 1rem"
            }}>
              <CheckCircle2 size={56} style={{ color: "#10b981", marginBottom: "1rem" }} />
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 700 }}>
                ¡Solicitud Enviada con Éxito!
              </h4>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
                La solicitud ha sido enviada al Super Admin para su revisión y aprobación. Te notificaremos en cuanto sea aprobada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderLeft: "4px solid #f59e0b",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                lineHeight: "1.4",
                color: "#fbbf24"
              }}>
                ℹ️ Por razones de seguridad y prevención de suplantación de identidad o fraude, cualquier cambio de razón social o subdominio requiere justificación escrita y aprobación del Super Admin.
              </div>

              {error && (
                <div style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem"
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Nombre de la Automotora */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  <Building size={16} /> Nuevo Nombre Solicitado
                </label>
                <input
                  type="text"
                  value={requestedName}
                  onChange={(e) => setRequestedName(e.target.value)}
                  placeholder="Ej: Automotora Uruguay VIP"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    color: "inherit",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem", display: "block" }}>
                  Nombre actual: <strong>{currentName}</strong>
                </span>
              </div>

              {/* Subdominio Solicitado */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  <Globe size={16} /> Nuevo Subdominio Solicitado
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    padding: "0.75rem 0.65rem",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRight: "none",
                    borderRadius: "8px 0 0 8px",
                    fontSize: "0.85rem",
                    opacity: 0.7
                  }}>
                    https://
                  </span>
                  <input
                    type="text"
                    value={requestedSubdomain}
                    onChange={(e) => setRequestedSubdomain(e.target.value)}
                    placeholder="tu-automotora"
                    style={{
                      flex: 1,
                      padding: "0.75rem 0.75rem",
                      borderRadius: "0",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                      color: "inherit",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                  <span style={{
                    padding: "0.75rem 0.65rem",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderLeft: "none",
                    borderRadius: "0 8px 8px 0",
                    fontSize: "0.85rem",
                    color: "var(--primary)",
                    fontWeight: 700
                  }}>
                    .n-autos.com
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem", display: "block" }}>
                  Subdominio actual: <strong>{currentSubdomain}</strong>
                </span>
              </div>

              {/* Justificación del Cambio */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  Motivo / Justificación del Cambio <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detalla el motivo del cambio (ej: Cambio de razón social legal, adquisición de nuevo dominio comercial, corrección de marca, etc.)..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    color: "inherit",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Footer Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                  }}
                >
                  <Send size={16} />
                  Enviar Solicitud al Super Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
