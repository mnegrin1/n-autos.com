"use client";

import { useEffect } from "react";

export default function ZoomScript() {
  useEffect(() => {
    try {
      const zoom = localStorage.getItem("crm-zoom") || "100__"; // Fallback to 100%
      const mapping: Record<string, string> = {
        "75%": "100%",
        "100%": "133.3%",
        "125%": "166.7%",
        "150%": "200%",
        "175%": "233.3%"
      };
      const appliedZoom = mapping[zoom === "100__" ? "100%" : (zoom || "100%")] || "133.3__";
      document.documentElement.style.zoom = appliedZoom === "133.3__" ? "133.3%" : appliedZoom;
    } catch (e) {
      // ignorar errores de localStorage
    }
  }, []);

  return null;
}
