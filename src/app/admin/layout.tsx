"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";
import { logout } from "@/actions/authActions";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell, 
  Plus,
  Palette,
  ChevronDown,
  Sun,
  Moon,
  MoonStar,
  Share2,
  MessageSquare,
  Menu
} from "lucide-react";

export default function AutoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme states
  const [currentTheme, setCurrentTheme] = useState("light");

  // Dropdown "+ Nuevo"
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const newDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (newDropdownRef.current && !newDropdownRef.current.contains(event.target as Node)) {
        setShowNewDropdown(false);
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

    // Force application of theme and zoom in case Next.js hydration or client navigation wiped it
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
      window.location.href = "/realstate/admin/login"; // Redirect to shared login
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Import Google Fonts for Inter & Force global overrides */}
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

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          try {
            var theme = localStorage.getItem('crm-theme');
            if (theme && theme !== 'system') {
              document.documentElement.className = '';
              document.documentElement.classList.add('theme-' + theme);
            }
            var patternColor = localStorage.getItem('crm-bg-pattern-color');
            if (patternColor) document.documentElement.style.setProperty('--bg-pattern-color', patternColor);
            var pattern = localStorage.getItem('crm-bg-pattern');
            if (pattern === 'topography') {
              document.documentElement.classList.add('bg-pattern-topography');
            } else if (pattern === 'emerald' || pattern === 'gradient') {
              document.documentElement.classList.add('bg-pattern-gradient');
            }
            var zoom = localStorage.getItem('crm-zoom') || '100%';
            var mapping = {
              '75%': '75%',
              '100%': '100%',
              '125%': '125%',
              '150%': '150%',
              '175%': '175%'
            };
            var appliedZoom = mapping[zoom] || '100%';
            document.documentElement.style.zoom = appliedZoom;
            var scaleVal = parseFloat(appliedZoom) / 100;
            document.documentElement.style.setProperty('--zoom-scale', scaleVal);
          } catch (e) {}
        })();
      ` }} />
      
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}>
        <div className={styles.logoContainer} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.5rem 1rem", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-color)", letterSpacing: "-0.02em" }}>
            Tu <span style={{ color: "var(--primary)" }}>Automotora</span>
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center" }}>
            Administración
          </span>
        </div>
        
        <nav className={styles.nav}>
          {/* Dropdown "+ Nuevo" */}
          <div ref={newDropdownRef} style={{ position: "relative", padding: "0.5rem 1rem 1rem 1rem" }}>
            <button 
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                backgroundColor: "var(--primary)",
                color: "white",
                border: "none",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)"
              }}
              type="button"
            >
              <Plus size={16} /> Nuevo
            </button>
            
            {showNewDropdown && (
              <>
                {/* Fixed full-screen backdrop to dim the screen slightly */}
                <div 
                  onClick={() => setShowNewDropdown(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "calc(100vw / var(--zoom-scale, 1))",
                    height: "calc(100vh / var(--zoom-scale, 1))",
                    backgroundColor: "rgba(0, 0, 0, 0.22)",
                    backdropFilter: "blur(0.5px)",
                    zIndex: 190,
                    cursor: "default"
                  }}
                />

                <div 
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "calc(100% - 10px)",
                    width: "230px",
                    backgroundColor: "var(--surface-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
                    zIndex: 200,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.25rem 0"
                  }}
                >
                  <Link 
                    href="/admin/vehicles?action=new" 
                    onClick={() => setShowNewDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.85rem 1.15rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--text-color)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border-color)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Car size={16} /> Nueva Publicación
                  </Link>
                  <Link 
                    href="/admin/crm?action=new" 
                    onClick={() => setShowNewDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.85rem 1.15rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--text-color)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border-color)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Users size={16} /> Nuevo Contacto
                  </Link>

                  <Link 
                    href="/admin/crm?action=sale" 
                    onClick={() => setShowNewDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.85rem 1.15rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--text-color)",
                      textDecoration: "none",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border-color)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <LogOut size={16} style={{ transform: "rotate(90deg)" }} /> Registrar Venta
                  </Link>
                </div>
              </>
            )}
          </div>

          <Link href="/admin" className={`${styles.navLink} ${pathname === "/admin" ? styles.activeNavLink : ""}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link href="/admin/vehicles" className={`${styles.navLink} ${pathname.startsWith("/admin/vehicles") ? styles.activeNavLink : ""}`}>
            <Car size={16} />
            Inventario Stock
          </Link>
          <Link href="/admin/inbox" className={`${styles.navLink} ${pathname.startsWith("/admin/inbox") ? styles.activeNavLink : ""}`}>
            <MessageSquare size={16} />
            Bandeja de Entrada
          </Link>
          <Link href="/admin/crm" className={`${styles.navLink} ${pathname.startsWith("/admin/crm") ? styles.activeNavLink : ""}`}>
            <Users size={16} />
            Contactos
          </Link>
          <Link href="/admin/integrations" className={`${styles.navLink} ${pathname.startsWith("/admin/integrations") ? styles.activeNavLink : ""}`}>
            <Share2 size={16} />
            Publicaciones / Canales
          </Link>
          <Link href="/admin/settings" className={`${styles.navLink} ${pathname.startsWith("/admin/settings") ? styles.activeNavLink : ""}`}>
            <Settings size={16} />
            Configuración
          </Link>
        </nav>

        {/* Footer del Sidebar: Tema, Configuración y Usuario */}
        <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.25rem" }}>
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
              style={{ cursor: "pointer", background: "none", border: "none", color: "var(--text-color)", display: "flex", padding: 0 }}
            >
              {currentTheme === "light" && <Sun size={18} />}
              {currentTheme === "dark-dim" && <MoonStar size={18} />}
              {currentTheme === "dark-black" && <Moon size={18} />}
            </button>

            <Link href="/admin/settings" style={{ color: "var(--text-color)", display: "flex" }} title="Configuración">
              <Settings size={18} />
            </Link>
          </div>

          <div 
            ref={dropdownRef}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", position: "relative", padding: "0.5rem", borderRadius: "8px", transition: "background-color 0.2s" }}
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div className={styles.avatar} style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>MN</div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Mauricio Negrin</span>
            </div>
            <ChevronDown size={14} style={{ marginLeft: "auto", color: "var(--text-color)", opacity: 0.7 }} />

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
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>mauricio@automotora.com</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", marginTop: "2px" }}>Administrador</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Link 
                    href="/admin/settings" 
                    onClick={() => setShowDropdown(false)}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", textDecoration: "none", padding: "0.5rem", borderRadius: "6px", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Settings size={14} /> Configuración
                  </Link>
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
            {/* User profile, theme and notifications removed from here and moved to sidebar bottom */}
          </div>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
