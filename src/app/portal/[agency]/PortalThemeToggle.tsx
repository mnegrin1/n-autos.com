"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function PortalThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("portal-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "light") {
        document.documentElement.classList.add("visitorLightMode");
        document.body.classList.add("visitorLightMode");
      } else {
        document.documentElement.classList.remove("visitorLightMode");
        document.body.classList.remove("visitorLightMode");
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("portal-theme", next);
    if (next === "light") {
      document.documentElement.classList.add("visitorLightMode");
      document.body.classList.add("visitorLightMode");
    } else {
      document.documentElement.classList.remove("visitorLightMode");
      document.body.classList.remove("visitorLightMode");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(15, 23, 42, 0.15)",
        backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.06)",
        color: theme === "dark" ? "#ffffff" : "#0f172a",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: theme === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      {theme === "dark" ? (
        <Sun size={18} style={{ color: "#f59e0b", transition: "transform 0.3s ease" }} />
      ) : (
        <Moon size={18} style={{ color: "#6366f1", transition: "transform 0.3s ease" }} />
      )}
    </button>
  );
}
