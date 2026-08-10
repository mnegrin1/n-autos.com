"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, LogOut, ShieldAlert } from "lucide-react";
import { logout } from "@/actions/authActions";
import { notifySessionEvent, getCurrentClientSession } from "@/lib/sessionHelper";

interface SessionGuardProps {
  currentUserId?: string;
  currentUserEmail?: string;
}

export default function SessionGuard({
  currentUserId,
  currentUserEmail,
}: SessionGuardProps) {
  const [conflictType, setConflictType] = useState<"switched" | "logged_out" | null>(null);
  const [newUserEmail, setNewUserEmail] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const TAB_KEY_USER_ID = "n_sistemas_tab_user_id";
    const TAB_KEY_USER_EMAIL = "n_sistemas_tab_user_email";

    const initialSession = getCurrentClientSession();
    const activeUserId = currentUserId || initialSession?.id;
    const activeUserEmail = currentUserEmail || initialSession?.email;

    // Si el servidor o la cookie traen un usuario activo verificado, actualizar sessionStorage de la pestaña
    if (activeUserId) {
      sessionStorage.setItem(TAB_KEY_USER_ID, activeUserId);
      if (activeUserEmail) {
        sessionStorage.setItem(TAB_KEY_USER_EMAIL, activeUserEmail);
      }
    }

    // Función para validar si la sesión global sigue coincidiendo con esta pestaña
    function checkSessionIntegrity(incomingUserEmail?: string, incomingUserId?: string) {
      const currentCookieSession = getCurrentClientSession();
      const storedTabUserId = sessionStorage.getItem(TAB_KEY_USER_ID);
      const targetUserId = storedTabUserId || activeUserId;

      if (!currentCookieSession) {
        if (targetUserId) {
          setConflictType("logged_out");
        } else {
          setConflictType(null);
        }
        return;
      }

      // Si la cookie existe y la pestaña aún no tenía ID guardado, vincularla a la sesión activa
      if (!storedTabUserId && currentCookieSession.id) {
        sessionStorage.setItem(TAB_KEY_USER_ID, currentCookieSession.id);
        if (currentCookieSession.email) {
          sessionStorage.setItem(TAB_KEY_USER_EMAIL, currentCookieSession.email);
        }
      }

      const activeGlobalId = incomingUserId || currentCookieSession.id;
      const activeGlobalEmail = incomingUserEmail || currentCookieSession.email;

      const effectiveTargetId = sessionStorage.getItem(TAB_KEY_USER_ID) || targetUserId;

      if (activeGlobalId && effectiveTargetId && activeGlobalId !== effectiveTargetId) {
        setConflictType("switched");
        setNewUserEmail(activeGlobalEmail || "otra cuenta");
      } else {
        setConflictType(null);
      }
    }


    // 1. Canal de comunicación inter-pestañas mediante BroadcastChannel
    let broadcastChannel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        broadcastChannel = new BroadcastChannel("n_sistemas_session_sync");
        broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          const targetUserId = sessionStorage.getItem(TAB_KEY_USER_ID) || activeUserId;

          if (data.type === "LOGIN" || data.type === "SESSION_SWITCH") {
            if (data.userId && targetUserId && data.userId !== targetUserId) {
              setConflictType("switched");
              setNewUserEmail(data.userEmail || "otra cuenta");
            } else if (data.userId && data.userId === targetUserId) {
              setConflictType(null);
            }
          } else if (data.type === "LOGOUT") {
            if (targetUserId) {
              setConflictType("logged_out");
            }
          }
        };
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }
    }

    // 2. Escuchador de cambios en localStorage (storage event)
    function handleStorageChange(e: StorageEvent) {
      const targetUserId = sessionStorage.getItem(TAB_KEY_USER_ID) || activeUserId;
      if (e.key === "n_sistemas_session_event" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.type === "LOGIN" || payload.type === "SESSION_SWITCH") {
            if (payload.userId && targetUserId && payload.userId !== targetUserId) {
              setConflictType("switched");
              setNewUserEmail(payload.userEmail || "otra cuenta");
            } else if (payload.userId && payload.userId === targetUserId) {
              setConflictType(null);
            }
          } else if (payload.type === "LOGOUT") {
            if (targetUserId) {
              setConflictType("logged_out");
            }
          }
        } catch {}
      } else if (e.key === "n_sistemas_tenant_session_v1") {
        checkSessionIntegrity();
      }
    }
    window.addEventListener("storage", handleStorageChange);

    // 3. Verificación al enfocar la ventana / cambiar visibilidad
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkSessionIntegrity();
      }
    }
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // Verificación inicial limpia
    checkSessionIntegrity();

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [currentUserId, currentUserEmail]);

  if (!conflictType) return null;

  const handleReload = () => {
    // Adoptar la nueva sesión activa en la pestaña y recargar recursos
    const currentCookieSession = getCurrentClientSession();
    if (currentCookieSession) {
      sessionStorage.setItem("n_sistemas_tab_user_id", currentCookieSession.id);
      sessionStorage.setItem("n_sistemas_tab_user_email", currentCookieSession.email);
    } else {
      sessionStorage.removeItem("n_sistemas_tab_user_id");
      sessionStorage.removeItem("n_sistemas_tab_user_email");
    }
    window.location.reload();
  };

  const handleGoToLogin = async () => {
    try {
      sessionStorage.clear();
      notifySessionEvent("LOGOUT");
      document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      await logout();
    } catch {}
    window.location.href = "/admin/login";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        animation: "fadeIn 0.25s ease-out forwards",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--surface-color, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "18px",
          padding: "2rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
          color: "var(--text-color, #0f172a)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: conflictType === "switched" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: conflictType === "switched" ? "#f59e0b" : "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
          }}
        >
          {conflictType === "switched" ? (
            <ShieldAlert size={34} />
          ) : (
            <AlertTriangle size={34} />
          )}
        </div>

        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
          {conflictType === "switched"
            ? "Sesión cambiada en otra pestaña"
            : "Sesión cerrada"}
        </h2>

        <p style={{ fontSize: "0.925rem", opacity: 0.85, lineHeight: 1.5, marginBottom: "1.75rem" }}>
          {conflictType === "switched" ? (
            <>
              Se ha detectado un nuevo inicio de sesión con la cuenta{" "}
              <strong style={{ color: "var(--primary, #2563eb)" }}>{newUserEmail}</strong> en otra pestaña de este navegador.
              <br />
              Para mantener tus datos seguros y evitar sobrescribir recursos, esta pestaña ha sido pausada.
            </>
          ) : (
            <>
              La sesión activa en este navegador se ha cerrado desde otra pestaña.
              <br />
              Por favor, inicia sesión nuevamente para continuar trabajando.
            </>
          )}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {conflictType === "switched" && (
            <button
              onClick={handleReload}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                backgroundColor: "var(--primary, #2563eb)",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              }}
            >
              <RefreshCw size={18} /> Cargar la nueva sesión
            </button>
          )}

          <button
            onClick={handleGoToLogin}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "var(--text-color, #0f172a)",
              border: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <LogOut size={16} /> Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
