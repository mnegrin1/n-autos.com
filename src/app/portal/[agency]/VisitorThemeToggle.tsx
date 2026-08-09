"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function VisitorThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("portal-visitor-theme") as "dark" | "light") || "dark";
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("portal-visitor-theme", next);
    window.dispatchEvent(new Event("portal-theme-changed"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Cambiar tema de la página"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.15)",
        color: theme === "dark" ? "#f59e0b" : "#6366f1",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backdropFilter: "blur(8px)",
        padding: 0
      }}
    >
      {theme === "dark" ? <Moon size={18} style={{ color: "#818cf8" }} /> : <Sun size={18} style={{ color: "#f59e0b" }} />}
    </button>
  );
}
