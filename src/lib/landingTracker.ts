"use client";

/**
 * Utilidad cliente para rastrear clics en la landing page n-autos.com.
 * Envía el evento a /api/landing-clicks sin bloquear la acción del usuario.
 */
export function trackButtonClick(
  buttonId: string,
  buttonText: string,
  section: string = "General",
  meta: Record<string, any> = {}
) {
  if (typeof window === "undefined") return;

  try {
    const userAgent = navigator.userAgent || "";
    let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

    if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) {
      deviceType = "tablet";
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(userAgent)) {
      deviceType = "mobile";
    }

    const payload = {
      buttonId,
      buttonText,
      section,
      pageUrl: window.location.pathname + window.location.search,
      referrer: document.referrer || "",
      deviceType,
      userAgent,
      ...meta
    };

    // Usar fetch con keepalive para asegurar la entrega incluso al navegar
    fetch("/api/landing-clicks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((err) => {
      console.warn("No se pudo registrar el clic de landing:", err);
    });
  } catch (e) {
    // Falla en silencio para nunca romper la interacción del usuario
  }
}
