"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  loginSuperAdmin, 
  requestPasswordReset, 
  verifyOTPAndResetPassword
} from "@/actions/authActions";
import { notifySessionEvent } from "@/lib/sessionHelper";
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowRight, 
  KeyRound, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Building2,
  Sparkles
} from "lucide-react";
import styles from "./superadminLogin.module.css";

type ViewMode = "login" | "forgot-email" | "forgot-otp";

export default function SuperAdminLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnauthorizedRole, setIsUnauthorizedRole] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Estado para el flujo de recuperación
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ msg?: string; demoCode?: string; demoLink?: string }>({});

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = "N-Autos | Acceso Superadmin";
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "superadmin_required") {
        setError("Acceso Restringido: Se requieren credenciales de Superadministrador para ingresar al panel global.");
      }
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setIsUnauthorizedRole(false);
    setSuccessMsg("");

    try {
      const res = await loginSuperAdmin(email, password);
      if (res.success && res.user) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("n_sistemas_tab_user_id", res.user.id);
          sessionStorage.setItem("n_sistemas_tab_user_email", res.user.email);
        }

        notifySessionEvent("SESSION_SWITCH", res.user.id, res.user.email);
        window.location.href = "/superadmin";
      } else {
        setError(res.error || "Error al iniciar sesión.");
        if (res.isUnauthorizedRole) {
          setIsUnauthorizedRole(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error de red o comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setResetLoading(true);

    try {
      const target = resetEmail || email || "mauricio.negrin@n-sistemas.com";
      const res = await requestPasswordReset(target);
      if (res.success) {
        setResetInfo({ msg: res.message, demoCode: res.demoCode });
        if (res.demoCode) {
          setOtpCode(res.demoCode);
        }
        setSuccessMsg(res.message || "Hemos enviado un código de recuperación a tu correo.");
        setViewMode("forgot-otp");
      } else {
        setError(res.error || "No se pudo enviar el correo de recuperación.");
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al solicitar el correo.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await verifyOTPAndResetPassword(resetEmail || email, otpCode, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || "¡Contraseña de Superadmin actualizada exitosamente!");
        setEmail(resetEmail || email);
        setPassword(newPassword);
        setViewMode("login");
      } else {
        setError(res.error || "Error al verificar el código o cambiar la contraseña.");
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al actualizar la contraseña.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardTopAccent} />

        <div className={styles.header}>
          <div className={styles.shieldIconContainer}>
            <ShieldAlert size={28} />
          </div>
          <span className={styles.badge}>SUPERADMIN ACCESS CONTROL</span>
          <h1 className={styles.title}>Panel de Superadmin</h1>
          <p className={styles.subtitle}>
            {viewMode === "login" 
              ? "Ingresa con tus credenciales globales de administración" 
              : viewMode === "forgot-email" 
              ? "Recupera tu acceso de Superadmin por correo" 
              : "Ingresa el código enviado para definir tu contraseña"}
          </p>
        </div>

        {error && (
          <div className={styles.alertError} style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            {isUnauthorizedRole && (
              <div className={styles.unauthorizedBox}>
                <Link href="/admin/login" className={styles.tenantRedirectBtn}>
                  <Building2 size={14} /> Ir al Inicio de Sesión de Automotoras (/admin/login)
                </Link>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className={styles.alertSuccess} style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VISTA 1: INICIO DE SESIÓN SUPERADMIN */}
        {viewMode === "login" && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Correo Electrónico de Superadmin</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mauricio.negrin@n-sistemas.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  type="password"
                  required
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setResetEmail(email || "mauricio.negrin@n-sistemas.com");
                setViewMode("forgot-email");
              }}
            >
              ¿Olvidaste tu contraseña o necesitas el correo de acceso?
            </button>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Verificando Credenciales..." : "Ingresar al Panel de Superadmin"} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* VISTA 2: SOLICITAR RECUPERACIÓN / REENVÍO DE EMAIL */}
        {viewMode === "forgot-email" && (
          <form className={styles.form} onSubmit={handleRequestOTP}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Correo Electrónico Autorizado</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="mauricio.negrin@n-sistemas.com"
                  disabled={resetLoading}
                />
              </div>
            </div>

            <button type="submit" disabled={resetLoading} className={styles.submitBtn}>
              {resetLoading ? "Enviando Correo..." : "Enviar Enlace / Código de Acceso"} <Mail size={18} />
            </button>

            <button
              type="button"
              className={styles.forgotLink}
              style={{ textAlign: "center", width: "100%", marginTop: "0.5rem" }}
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setViewMode("login");
              }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* VISTA 3: INGRESAR CÓDIGO OTP Y NUEVA CONTRASEÑA */}
        {viewMode === "forgot-otp" && (
          <form className={styles.form} onSubmit={handleVerifyAndReset}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Código de Verificación (6 dígitos)</label>
              <div className={styles.inputWrapper}>
                <KeyRound className={styles.inputIcon} size={18} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  className={styles.input}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  disabled={resetLoading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Nueva Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  type="password"
                  required
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={resetLoading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirmar Nueva Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  type="password"
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={resetLoading}
                />
              </div>
            </div>

            <button type="submit" disabled={resetLoading} className={styles.submitBtn}>
              {resetLoading ? "Guardando..." : "Establecer Contraseña e Iniciar Sesión"} <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className={styles.forgotLink}
              style={{ textAlign: "center", width: "100%", marginTop: "0.5rem" }}
              onClick={() => setViewMode("login")}
            >
              Cancelar y volver
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <div>&copy; {new Date().getFullYear()} N-Sistemas / Plataforma Global SuperAdmin</div>
        </div>
      </div>
    </div>
  );
}
