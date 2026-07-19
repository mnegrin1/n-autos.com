"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "../admin/admin.module.css";
import { logout } from "@/actions/authActions";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Bell,
  Sun,
  Moon,
  MoonStar,
  Menu
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme states
  const [currentTheme, setCurrentTheme] = useState("light");

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Escuchar eventos de nuevas notificaciones y cargar el tema actual
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentTheme(localStorage.getItem("crm-theme") || "light");
    }

    const theme = localStorage.getItem("crm-theme") || "light";
    setCurrentTheme(theme);
    const pattern = localStorage.getItem("crm-bg-pattern") || "solid";
    document.documentElement.className = "";
    document.documentElement.classList.add("theme-" + theme);
    if (pattern === "topography") {
      document.documentElement.classList.add("bg-pattern-topography");
    }

    const zoom = localStorage.getItem("crm-zoom") || "100%";
    const mapping: Record<string, string> = {
      "75%": "75%",
      "100%": "100%",
      "125%": "125%",
      "150%": "150%",
      "175%": "175%",
    };
    const appliedZoom = mapping[zoom] || "100%";
    document.documentElement.style.zoom = appliedZoom;
    const scaleVal = parseFloat(appliedZoom) / 100;
    document.documentElement.style.setProperty("--zoom-scale", scaleVal.toString());

  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await logout();
      window.location.href = "/admin/login"; // Redirect to admin login
    }
  };

  return (
    <div className={styles.adminContainer}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background-color: var(--bg-color) !important;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        body, html, button, input, select, textarea, span, div, h1, h2, h3, h4, h5, h6, aside, main, label, table, td, tr, th {
          font-family: 'Inter', sans-serif !important;
        }
      `}} />
      
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}>
        <div className={styles.logoContainer} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.5rem 1rem", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-color)", letterSpacing: "-0.02em" }}>
            N<span style={{ color: "var(--primary)" }}>Sistemas</span>
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--danger, #ef4444)", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center" }}>
            Superadmin
          </span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/superadmin" className={`${styles.navLink} ${pathname === "/superadmin" ? styles.activeNavLink : ""}`}>
            <LayoutDashboard size={16} />
            Dashboard Global
          </Link>
          <Link href="/superadmin/agencies" className={`${styles.navLink} ${pathname.startsWith("/superadmin/agencies") ? styles.activeNavLink : ""}`}>
            <Building2 size={16} />
            Organizaciones
          </Link>
          <Link href="/superadmin/users" className={`${styles.navLink} ${pathname.startsWith("/superadmin/users") ? styles.activeNavLink : ""}`}>
            <Users size={16} />
            Usuarios Globales
          </Link>
        </nav>

        {/* Footer del Sidebar: Tema y Usuario */}
        <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column" }}>
          
          <div 
            style={{ display: "flex", alignItems: "center", position: "relative", padding: "0.5rem", borderRadius: "8px", transition: "background-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0 }}
              onClick={() => setShowDropdown(!showDropdown)}
              ref={dropdownRef}
            >
              <div className={styles.avatar} style={{ width: "32px", height: "32px", fontSize: "0.85rem", flexShrink: 0, backgroundColor: "var(--danger, #ef4444)" }}>SA</div>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Superadmin</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", paddingLeft: "0.5rem" }}>
              <button 
                className={styles.themeBtn}
                onClick={() => {
                  const themes = ['light', 'dark-dim', 'dark-black'];
                  const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
                  const nextTheme = themes[nextIndex];
                  localStorage.setItem('crm-theme', nextTheme);
                  const pattern = localStorage.getItem("crm-bg-pattern") || "solid";
                  document.documentElement.className = "";
                  document.documentElement.classList.add('theme-' + nextTheme);
                  if (pattern === "topography") {
                    document.documentElement.classList.add("bg-pattern-topography");
                  }
                  setCurrentTheme(nextTheme);
                }}
                title="Cambiar Tema"
                style={{ cursor: "pointer", background: "none", border: "none", color: "var(--text-color)", display: "flex", padding: "0.35rem", borderRadius: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {currentTheme === "light" && <Sun size={15} />}
                {currentTheme === "dark-dim" && <MoonStar size={15} />}
                {currentTheme === "dark-black" && <Moon size={15} />}
              </button>
              <button 
                onClick={handleLogout}
                title="Cerrar Sesión"
                style={{ cursor: "pointer", background: "none", border: "none", color: "var(--danger, #ef4444)", display: "flex", padding: "0.35rem", borderRadius: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <LogOut size={15} />
              </button>
            </div>

            {showDropdown && (
              <div 
                className={styles.dropdownMenu} 
                style={{ 
                  bottom: "100%", 
                  top: "auto", 
                  left: 0, 
                  marginBottom: "0.5rem", 
                  width: "100%",
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                  padding: "0.5rem",
                  position: "absolute",
                  zIndex: 1000
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>admin@n-sistemas.com</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--danger)", marginTop: "2px" }}>Control Total</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--error, #ef4444)", background: "none", border: "none", width: "100%", textAlign: "left", padding: "0.5rem", borderRadius: "6px", cursor: "pointer", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <LogOut size={14} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.mobileMenuContainer}>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
          <div className={styles.topbarActions}>
            {/* Topbar contents moved to sidebar */}
          </div>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
