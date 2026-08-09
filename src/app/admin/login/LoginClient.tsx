"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, requestPasswordReset, verifyOTPAndResetPassword } from "@/actions/authActions";
import { notifySessionEvent } from "@/lib/sessionHelper";
import { syncTenantSessionForUser } from "@/lib/tenantStore";
import styles from "./login.module.css";

type ViewMode = "login" | "forgot-email" | "forgot-otp";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estado para el flujo de recuperación
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ msg?: string; demoCode?: string }>({});

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "google_not_configured") {
        setError(
          "Autenticación con Google aún no configurada. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en tu archivo .env.local"
        );
      } else if (err === "auth_failed" || err === "token_error") {
        setError("Error al autenticar con Google. Por favor intenta nuevamente.");
      } else if (err) {
        setError(`Error al iniciar sesión con Google (${err}).`);
      }
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("n_sistemas_tab_user_id", res.user.id);
          sessionStorage.setItem("n_sistemas_tab_user_email", res.user.email);
        }

        syncTenantSessionForUser(res.user);
        notifySessionEvent("SESSION_SWITCH", res.user.id, res.user.email);

        window.location.href = "/admin";
      } else {
        setError(res.error || "Error al iniciar sesión.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de red inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // Paso 1 de recuperación: Solicitar código OTP por correo
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setResetLoading(true);

    try {
      const res = await requestPasswordReset(resetEmail);
      if (res.success) {
        setResetInfo({ msg: res.message, demoCode: res.demoCode });
        if (res.demoCode) {
          setOtpCode(res.demoCode); // Rellenar automáticamente en modo pruebas si aplica
        }
        setViewMode("forgot-otp");
      } else {
        setError(res.error || "No se pudo solicitar el código de recuperación.");
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al solicitar el código.");
    } finally {
      setResetLoading(false);
    }
  }

  // Paso 2 de recuperación: Verificar OTP y cambiar contraseña
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
      const res = await verifyOTPAndResetPassword(resetEmail, otpCode, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || "¡Contraseña actualizada correctamente!");
        setEmail(resetEmail);
        setPassword(newPassword);
        setViewMode("login");
      } else {
        setError(res.error || "Error al verificar el código o cambiar la contraseña.");
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al cambiar la contraseña.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className={styles.loginContainer}>
      {/* Script inline para aplicar zoom y tema de forma inmediata antes del render */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
        (function() {
          try {
            var theme = localStorage.getItem('crm-theme');
            if (theme && theme !== 'system') {
              document.documentElement.classList.add('theme-' + theme);
            }
            var zoom = localStorage.getItem('crm-zoom') || '100%';
            var mapping = {
              '75%': '75%',
              '100%': '100%',
              '125%': '125%',
              '150%': '150%',
              '175%': '175%'
            };
            var appliedZoom = mapping[zoom] || '100%';
            document.documentElement.style.zoom = appliedZoom;
            var scaleVal = parseFloat(appliedZoom) / 100;
            document.documentElement.style.setProperty('--zoom-scale', scaleVal);
          } catch (e) {}
        })();
      `,
        }}
      />

      <div className={styles.loginCard}>
        <div
          className={styles.brand}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-color)",
                marginTop: "0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Tu <span style={{ color: "#10b981" }}>Automotora</span>
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
              Plataforma de Gestión Automotriz
            </p>
          </div>
        </div>

        {/* Notificaciones globales */}
        {error && <div className={styles.errorBox}>{error}</div>}
        {successMsg && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              color: "#10b981",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* VISTA 1: INICIO DE SESIÓN */}
        {viewMode === "login" && (
          <>
            {/* Botón de Iniciar Sesión con Google */}
            <a
              href="/api/auth/google-login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#3c4043",
                border: "1px solid #dadce0",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
                marginBottom: "0.5rem",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continuar con Google
            </a>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "0.75rem 0 1rem",
                color: "var(--text-color)",
                opacity: 0.5,
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "currentColor" }} />
              <span
                style={{
                  padding: "0 0.75rem",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                o con correo
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "currentColor" }} />
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="ejemplo@automotora.com"
                />
              </div>

              <div className={styles.formGroup}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label htmlFor="password">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccessMsg("");
                      setResetEmail(email || "mauricio@automotora.com");
                      setViewMode("forgot-email");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#10b981",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  marginTop: "0.5rem",
                  backgroundColor: "#10b981",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {loading ? "Iniciando Sesión..." : "Ingresar al Panel"}
              </button>
            </form>

            <div className={styles.demoHelp}>
              <strong>Acceso de Demostración:</strong>
              <br />
              Email: <code>mauricio@automotora.com</code>
              <br />
              Contraseña: <code>admin</code>
            </div>
          </>
        )}

        {/* VISTA 2: RECUPERACIÓN - PASO 1 (INGRESAR CORREO) */}
        {viewMode === "forgot-email" && (
          <form onSubmit={handleRequestOTP} className={styles.form}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-color)" }}>
                Recuperación de Contraseña
              </h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
                Ingresa tu correo para recibir un código de verificación de 6 dígitos.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="resetEmail">Correo Electrónico registrado</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="ejemplo@automotora.com"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#10b981",
                border: "none",
                padding: "0.75rem",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {resetLoading ? "Enviando Código..." : "Enviar Código de Recuperación"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setViewMode("login");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-color)",
                opacity: 0.7,
                fontSize: "0.85rem",
                cursor: "pointer",
                marginTop: "0.5rem",
                textDecoration: "underline",
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* VISTA 3: RECUPERACIÓN - PASO 2 (INGRESAR CÓDIGO OTP Y NUEVA CONTRASEÑA) */}
        {viewMode === "forgot-otp" && (
          <form onSubmit={handleVerifyAndReset} className={styles.form}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-color)" }}>
                Ingresa tu Código de Verificación
              </h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
                Enviamos un código temporal de 6 dígitos a <strong>{resetEmail}</strong>
              </p>
            </div>

            {resetInfo.msg && (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px dashed #10b981",
                  color: "var(--text-color)",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  textAlign: "center",
                }}
              >
                {resetInfo.msg}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="otpCode">Código de 6 Dígitos</label>
              <input
                type="text"
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                className={styles.input}
                placeholder="123456"
                style={{
                  letterSpacing: "6px",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Repite la contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#10b981",
                border: "none",
                padding: "0.75rem",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {resetLoading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setViewMode("forgot-email");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#10b981",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Reenviar código
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setViewMode("login");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-color)",
                  opacity: 0.7,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
