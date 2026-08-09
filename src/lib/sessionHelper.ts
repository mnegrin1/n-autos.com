"use client";

export function notifySessionEvent(
  type: "LOGIN" | "LOGOUT" | "SESSION_SWITCH",
  userId?: string,
  userEmail?: string
) {
  if (typeof window === "undefined") return;

  const payload = {
    type,
    userId,
    userEmail,
    timestamp: Date.now(),
  };

  // 1. Enviar evento mediante BroadcastChannel
  if ("BroadcastChannel" in window) {
    try {
      const bc = new BroadcastChannel("n_sistemas_session_sync");
      bc.postMessage(payload);
      bc.close();
    } catch (e) {
      console.error("Error postMessage BroadcastChannel:", e);
    }
  }

  // 2. Disparar evento de localStorage para que la pestaña reaccione mediante listener 'storage'
  try {
    localStorage.setItem("n_sistemas_session_event", JSON.stringify(payload));
  } catch (e) {
    console.error("Error setting session event in localStorage:", e);
  }
}

export function getCurrentClientSession() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )admin-session=([^;]*)/);
  if (!match || !match[1]) return null;
  try {
    const token = decodeURIComponent(match[1]);
    const binString = atob(token);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
