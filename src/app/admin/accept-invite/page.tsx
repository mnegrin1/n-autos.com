"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { activateUserAccount } from "@/actions/authActions";
import { 
  KeyRound, 
  Lock, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  User, 
  Mail, 
  CheckCircle,
  Sparkles
} from "lucide-react";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyId, setAgencyId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email") || "empleado@automotora.com";
    const nameParam = searchParams.get("name") || "Nuevo Empleado";
    const agencyParam = searchParams.get("agency") || "Tu Automotora";
    const agencyIdParam = searchParams.get("agencyId") || "agency-starter";

    setEmail(emailParam);
    setName(nameParam);
    setAgencyName(agencyParam);
    setAgencyId(agencyIdParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe contener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const codeParam = searchParams.get("code") || "";
      const res = await activateUserAccount({
        email: email,
        code: codeParam,
        password: password,
        agencyId: agencyId,
        name: name,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || "Error al activar la cuenta.");
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Error al procesar la invitación.");
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminRole = searchParams.get("role") === "superadmin" || email.toLowerCase() === "mauricio.negrin@n-sistemas.com";

  const handleGoToDashboard = () => {
    if (isSuperAdminRole) {
      router.push("/superadmin");
    } else {
      router.push("/admin");
    }
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "480px",
          padding: "2.5rem 2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(226, 232, 240, 0.8)"
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
              boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)"
            }}
          >
            <KeyRound size={24} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            INVITACIÓN A EQUIPO DE TRABAJO
          </span>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: "0.25rem 0 0.5rem 0" }}>
            Activar Cuenta de Empleado
          </h1>
          <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
            Establece tu contraseña para ingresar a <strong>{agencyName}</strong>.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {errorMsg && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Read-Only Details */}
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem" }}>
              <div style={{ fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <User size={14} style={{ color: "#2563eb" }} /> <strong>Nombre:</strong> {name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={14} style={{ color: "#2563eb" }} /> <strong>Email:</strong> {email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Building2 size={14} style={{ color: "#2563eb" }} /> <strong>Automotora:</strong> {agencyName}
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                Crea tu Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: password && confirmPassword ? (password === confirmPassword ? "1px solid #16a34a" : "1px solid #ef4444") : "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
            </div>

            {password && confirmPassword && (
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: password === confirmPassword ? "#16a34a" : "#ef4444", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {password === confirmPassword ? <Check size={14} /> : <AlertCircle size={14} />}
                {password === confirmPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)"
              }}
            >
              {loading ? "Estableciendo Contraseña..." : "Guardar Contraseña y Entrar al CRM"} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto"
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
              ¡Cuenta Activada Exitosamente!
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "1.5rem" }}>
              Tu contraseña ha sido guardada. Ya eres parte del equipo de <strong>{agencyName}</strong>.
            </p>
            <button
              onClick={handleGoToDashboard}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: isSuperAdminRole ? "#ef4444" : "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: isSuperAdminRole ? "0 10px 20px -5px rgba(239, 68, 68, 0.4)" : "0 10px 20px -5px rgba(22, 163, 74, 0.4)"
              }}
            >
              {isSuperAdminRole ? "Ir al Panel de Superadmin" : "Ir al Panel de Ventas"} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }} />}>
      <AcceptInviteContent />
    </Suspense>
  );
}

