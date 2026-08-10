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
    const rawToken = decodeURIComponent(match[1]).trim();
    if (!rawToken) return null;

    // Si el token tiene formato payload.signature, extraer la parte del payload
    let payloadPart = rawToken;
    if (rawToken.includes(".")) {
      payloadPart = rawToken.split(".")[0];
    }

    // Convertir sustitución Base64Url a Base64 estándar con padding
    let base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const decodedStr = atob(base64);
    const parsed = JSON.parse(decodedStr);
    if (parsed && typeof parsed === "object" && (parsed.id || parsed.email)) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}

