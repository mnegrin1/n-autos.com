"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/authActions";
import styles from "./login.module.css";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      if (res.success) {
        // Forzar recarga del middleware y redirigir
        router.push("/admin");
        router.refresh();
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

  return (
    <div className={styles.loginContainer}>
      {/* Script inline para aplicar zoom y tema de forma inmediata antes del render */}
      <script dangerouslySetInnerHTML={{ __html: `
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
      ` }} />

      <div className={styles.loginCard}>
        <div className={styles.brand} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-color)", marginTop: "0.5rem", letterSpacing: "-0.02em" }}>
              Tu <span style={{ color: "#10b981" }}>Automotora</span>
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>Plataforma de Gestión Automotriz</p>
          </div>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

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
            <label htmlFor="password">Contraseña</label>
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

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "0.5rem", backgroundColor: "#10b981", border: "none" }}>
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
      </div>
    </div>
  );
}
