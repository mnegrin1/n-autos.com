"use client";

import { useState } from "react";
import { changePassword } from "@/actions/authActions";
import { X, Lock, CheckCircle, ShieldCheck, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Por favor ingresa tu contraseña actual.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess(res.message || "¡Contraseña actualizada con éxito!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSuccess("");
          onClose();
        }, 1800);
      } else {
        setError(res.error || "No se pudo actualizar la contraseña.");
      }
    } catch (err: any) {
      setError(err?.message || "Error de red o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--surface-color, #ffffff)",
          color: "var(--text-color, #0f172a)",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--border-color, #e2e8f0)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            color: "var(--text-color)",
            opacity: 0.6,
            cursor: "pointer",
            padding: "0.25rem",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Cambiar Contraseña</h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.15rem 0 0" }}>
              Actualiza la clave de acceso de tu cuenta de usuario
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 500,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              color: "#10b981",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              htmlFor="currentPassword"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}
            >
              Contraseña Actual
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  backgroundColor: "var(--bg-color, #f8fafc)",
                  color: "var(--text-color, #0f172a)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modalNewPassword"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}
            >
              Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                id="modalNewPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  backgroundColor: "var(--bg-color, #f8fafc)",
                  color: "var(--text-color, #0f172a)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modalConfirmPassword"
              style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}
            >
              Confirmar Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                id="modalConfirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la nueva contraseña"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  backgroundColor: "var(--bg-color, #f8fafc)",
                  color: "var(--text-color, #0f172a)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                backgroundColor: "transparent",
                color: "var(--text-color, #475569)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#10b981",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? "Guardando..." : "Guardar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
