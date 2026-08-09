"use client";

import React, { useState } from "react";
import { PaymentPlan } from "@/lib/plansStore";
import { simulateTenantRegistration } from "@/lib/tenantStore";
import { registerUserSession } from "@/actions/authActions";
import { useRouter } from "next/navigation";
import { 
  X, 
  CheckCircle, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Lock,
  AlertCircle,
  Check
} from "lucide-react";

interface CheckoutModalProps {
  plan: PaymentPlan;
  isYearly: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ plan, isYearly, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "db_processing" | "success">("form");

  // Registration Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Processing & Logs
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [insertedPayload, setInsertedPayload] = useState<any>(null);
  const [formError, setFormError] = useState("");

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!adminEmail) {
      setFormError("El correo electrónico es requerido.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setStep("db_processing");

    const userPrefix = adminEmail.split("@")[0];
    const derivedAgencyName = `Automotora ${userPrefix.charAt(0).toUpperCase() + userPrefix.slice(1)}`;
    const derivedSubdomain = userPrefix.toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Simulate registration & SuperAdmin sync
    const result = simulateTenantRegistration({
      agencyName: derivedAgencyName,
      subdomain: derivedSubdomain,
      adminName: userPrefix,
      adminEmail: adminEmail,
      planId: plan.id,
      billingCycle: isYearly ? "yearly" : "monthly"
    });

    setInsertedPayload(result.session);

    // 2. Set server-side session cookie for immediate entry to /admin
    try {
      await registerUserSession({
        id: result.session.agencyId,
        email: result.session.adminEmail,
        name: result.session.adminName,
        role: "admin",
        agency_id: result.session.agencyId,
      });
    } catch (e) {
      console.error("Error setting session cookie:", e);
    }

    // 3. Simulate progressive DB setup logs animation
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < result.dbLogs.length) {
        const nextLog = result.dbLogs[currentLogIndex];
        setDbLogs((prev) => [...prev, nextLog]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStep("success");
        }, 600);
      }
    }, 400);
  };

  const handleGoToAdmin = () => {
    router.push("/admin");
    router.refresh();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          position: "relative"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Sparkles size={18} style={{ color: "#38bdf8" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#38bdf8" }}>
                REGISTRO DE CUENTA
              </span>
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
              Plan {plan.name} {isYearly ? "(Anual)" : "(Mensual)"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Step */}
        {step === "form" && (
          <form onSubmit={handleStartSimulation} style={{ padding: "1.75rem 2rem" }}>
            {/* Selected Plan Summary Banner (Sin Precio) */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem"
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>
                PLAN SELECCIONADO DESDE LANDING
              </span>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
                Plan {plan.name} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb" }}>({plan.maxVehicles} Vehículos / {plan.maxUsers} Usuarios)</span>
              </div>
            </div>

            {/* Error Message if any */}
            {formError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* Botón de Google */}
            <div style={{ marginBottom: "1.25rem" }}>
              <a
                href="/api/auth/google-login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  color: "#3c4043",
                  border: "1.5px solid #dadce0",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  textDecoration: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Ingresar con Google
              </a>
            </div>

            {/* Divisor "O regístrate fácil" */}
            <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0 1.5rem", color: "#64748b" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
              <span style={{ padding: "0 0.85rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                O regístrate fácil
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
            </div>

            {/* Campos de Registro Simple: Correo, Contraseña, Confirmar Contraseña */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                  <Mail size={16} style={{ color: "#2563eb" }} /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="ejemplo@automotora.com"
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                    <Lock size={16} style={{ color: "#2563eb" }} /> Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                    <Lock size={16} style={{ color: "#2563eb" }} /> Verificar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "10px",
                      border: password && confirmPassword ? (password === confirmPassword ? "1px solid #16a34a" : "1px solid #ef4444") : "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {password && confirmPassword && (
                <div style={{ fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", color: password === confirmPassword ? "#16a34a" : "#ef4444" }}>
                  {password === confirmPassword ? (
                    <>
                      <Check size={15} /> Las contraseñas coinciden.
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} /> Las contraseñas no coinciden.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.05rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
                transition: "transform 0.2s, background 0.2s"
              }}
            >
              Crear Cuenta e Iniciar Sesión <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Database Processing Step */}
        {step === "db_processing" && (
          <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            <Database size={48} style={{ color: "#2563eb", marginBottom: "1rem", animation: "bounce 1s infinite" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
              Ejecutando Registro y Asignación de Plan {plan.name}...
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Registrando usuario <strong style={{ color: "#0f172a" }}>{adminEmail}</strong> y sincronizando datos con el panel de Super Admin.
            </p>

            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                padding: "1.25rem",
                textAlign: "left",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                color: "#38bdf8",
                maxHeight: "200px",
                overflowY: "auto",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
              }}
            >
              {dbLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: "0.35rem", lineHeight: "1.4" }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && insertedPayload && (
          <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
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

            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
              ¡Alta Completada en Modo {plan.name}!
            </h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Tu cuenta <strong>{insertedPayload.adminEmail}</strong> se ha registrado con éxito y ya figura como usuario en el panel de Super Admin.
            </p>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "1.25rem",
                textAlign: "left",
                marginBottom: "1.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.75rem" }}>
                <ShieldCheck size={18} style={{ color: "#16a34a" }} />
                <span>DATOS DE REGISTRO DE LA SESIÓN:</span>
              </div>
              
              <div style={{ fontSize: "0.84rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div>👤 <strong>Usuario Registrado:</strong> {insertedPayload.adminEmail}</div>
                <div>🏢 <strong>Automotora:</strong> {insertedPayload.agencyName}</div>
                <div>⚡ <strong>Plan Asignado:</strong> Plan {insertedPayload.planName} ({plan.maxVehiclesCount} vehículos max / {plan.maxUsersCount} usuarios max)</div>
              </div>
            </div>

            <button
              onClick={handleGoToAdmin}
              style={{
                width: "100%",
                padding: "1.1rem",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.05rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 10px 20px -5px rgba(22, 163, 74, 0.4)"
              }}
            >
              Entrar al Panel de Admin (Modo {plan.name} Activo) <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
