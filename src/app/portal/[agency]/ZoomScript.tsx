"use client";

import { useEffect } from "react";

export default function ZoomScript() {
  useEffect(() => {
    try {
      const zoom = localStorage.getItem("crm-zoom") || "100__"; // Fallback to 100%
      const mapping: Record<string, string> = {
        "75%": "75%",
        "100%": "100%",
        "125%": "125%",
        "150%": "150%",
        "175%": "175%"
      };
      const appliedZoom = mapping[zoom === "100__" ? "100%" : (zoom || "100%")] || "100__";
      document.documentElement.style.zoom = appliedZoom === "100__" ? "100%" : appliedZoom;
      const scaleVal = parseFloat(appliedZoom === "100__" ? "100%" : appliedZoom) / 100;
      document.documentElement.style.setProperty("--zoom-scale", scaleVal.toString());
    } catch (e) {
      // ignorar errores de localStorage
    }
  }, []);

  return null;
}
