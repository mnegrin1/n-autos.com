"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Smartphone } from "lucide-react";

export default function ServiceWorkerRegister() {
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detectar si ya está corriendo en modo PWA instalada
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Error al registrar Service Worker:', err);
        });
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        // Mostrar sugerencia de notificaciones sutil tras 3 segundos
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      setShowPrompt(false);
      
      if (res === 'granted' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        console.log('[PWA] Permiso de notificaciones concedido.', reg);
      }
    } catch (err) {
      console.error('Error pidiendo permiso de notificaciones:', err);
    }
  };

  return (
    <>
      {showPrompt && permission === 'default' && (
        <div style={{
          position: "fixed",
          bottom: isStandalone ? "80px" : "20px",
          right: "20px",
          left: "20px",
          maxWidth: "420px",
          margin: "0 auto",
          backgroundColor: "var(--surface-color, #1e293b)",
          border: "1px solid var(--border-color, #334155)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          animation: "fadeInUp 0.3s ease-out"
        }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "rgba(37, 99, 235, 0.15)",
            color: "var(--primary, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Bell size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-color, #f8fafc)" }}>
              Activar Alertas al Celular
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", opacity: 0.8, color: "var(--text-color, #94a3b8)" }}>
              Recibe notificaciones push al instante cuando ingresen consultas de clientes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <button
              onClick={requestNotificationPermission}
              style={{
                backgroundColor: "var(--primary, #2563eb)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Activar
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              style={{
                backgroundColor: "transparent",
                color: "var(--text-color, #94a3b8)",
                border: "none",
                fontSize: "0.72rem",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Luego
            </button>
          </div>
        </div>
      )}
    </>
  );
}
