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
  Settings, 
  LogOut, 
  Plus,
  ChevronDown,
  Sun,
  Moon,
  MoonStar,
  Share2,
  MessageSquare,
  Menu,
  Mail,
  DollarSign,
  Search,
  PanelLeft,
  PanelLeftClose
} from "lucide-react";
import ComposeEmailModal from "@/components/ComposeEmailModal";
import QuickSearchModal from "@/components/QuickSearchModal";

export default function AutoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sidebar pin & hover state (Cloudflare style)
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Quick search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  // Theme states
  const [currentTheme, setCurrentTheme] = useState("light");

  // Dropdown "+ Nuevo"
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [isComposeEmailOpen, setIsComposeEmailOpen] = useState(false);
  const newDropdownRef = useRef<HTMLDivElement>(null);

  const isExpanded = isPinned || isHovered || isMobileMenuOpen;

  // Load pinned preference & theme from localStorage & detect platform
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pinnedValue = localStorage.getItem("crm-sidebar-pinned");
      if (pinnedValue !== null) {
        setIsPinned(pinnedValue === "true");
      }
      setCurrentTheme(localStorage.getItem("crm-theme") || "light");
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
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

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
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

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const togglePin = () => {
    const nextState = !isPinned;
    setIsPinned(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm-sidebar-pinned", String(nextState));
    }
  };

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await logout();
      window.location.href = "/admin/login";
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

      <aside 
        className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ""} ${isMobileMenuOpen ? styles.open : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header Logo */}
        <div className={styles.logoContainer} style={{ padding: "1.25rem 0.85rem", gap: "0.75rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: "var(--primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "1.1rem",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            A
          </div>
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", transition: "opacity 0.2s" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-color)", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                Tu <span style={{ color: "var(--primary)" }}>Automotora</span>
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Administración
              </span>
            </div>
          )}
        </div>

        {/* Quick Search Trigger (Cloudflare style) */}
        <div style={{ padding: "0.6rem 0.6rem 0.25rem 0.6rem" }}>
          {isExpanded ? (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "rgba(128,128,128,0.06)",
                color: "var(--text-color)",
                fontSize: "0.825rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.7 }}>
                <Search size={14} />
                <span>Quick search...</span>
              </div>
              <kbd style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 5px",
                borderRadius: "4px",
                backgroundColor: "rgba(128,128,128,0.15)",
                color: "var(--text-color)",
                opacity: 0.8
              }}>
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              title={`Quick search (${isMac ? "⌘K" : "Ctrl+K"})`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: "0.65rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "rgba(128,128,128,0.06)",
                color: "var(--text-color)",
                cursor: "pointer"
              }}
            >
              <Search size={16} />
            </button>
          )}
        </div>
        
        <nav className={styles.nav}>
          {/* Dropdown "+ Nuevo" */}
          <div ref={newDropdownRef} style={{ position: "relative", marginBottom: "0.5rem" }}>
            <button 
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="btn-primary"
              title="+ Nuevo"
              style={{
                width: "100%",
                padding: isExpanded ? "0.65rem" : "0.65rem 0",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: isExpanded ? "center" : "center",
                gap: "0.4rem",
                cursor: "pointer",
                backgroundColor: "var(--text-color)",
                color: "var(--bg-color)",
                border: "none",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)"
              }}
              type="button"
            >
              <Plus size={16} /> 
              {isExpanded && (
                <>
                  Nuevo <ChevronDown size={14} style={{ transform: showNewDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </>
              )}
            </button>
            
            {showNewDropdown && (
              <div 
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "0.4rem",
                  width: isExpanded ? "100%" : "200px",
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  padding: "0.25rem 0",
                  zIndex: 200
                }}
              >
                <Link 
                  href="/admin/vehicles?action=new" 
                  onClick={() => setShowNewDropdown(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-color)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--border-color)",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
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
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-color)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--border-color)",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Users size={16} /> Nuevo Contacto
                </Link>

                <button 
                  type="button"
                  onClick={() => {
                    setShowNewDropdown(false);
                    setIsComposeEmailOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-color)",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--border-color)",
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Mail size={16} /> Enviar Email
                </button>

                <Link 
                  href="/admin/crm?action=sale" 
                  onClick={() => setShowNewDropdown(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-color)",
                    textDecoration: "none",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <DollarSign size={16} /> Registrar Venta
                </Link>
              </div>
            )}
          </div>

          <Link href="/admin" title="Dashboard" className={`${styles.navLink} ${pathname === "/admin" ? styles.activeNavLink : ""}`}>
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Dashboard</span>}
          </Link>
          <Link href="/admin/vehicles" title="Inventario Stock" className={`${styles.navLink} ${pathname.startsWith("/admin/vehicles") ? styles.activeNavLink : ""}`}>
            <Car size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Inventario Stock</span>}
          </Link>
          <Link href="/admin/inbox" title="Bandeja de Entrada" className={`${styles.navLink} ${pathname.startsWith("/admin/inbox") ? styles.activeNavLink : ""}`}>
            <MessageSquare size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Bandeja de Entrada</span>}
          </Link>
          <Link href="/admin/publications" title="Publicaciones Activas" className={`${styles.navLink} ${pathname.startsWith("/admin/publications") ? styles.activeNavLink : ""}`}>
            <Share2 size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Publicaciones</span>}
          </Link>
          <Link href="/admin/crm" title="Contactos" className={`${styles.navLink} ${pathname.startsWith("/admin/crm") ? styles.activeNavLink : ""}`}>
            <Users size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Contactos</span>}
          </Link>
          <Link href="/admin/email/broadcasts" title="Email Broadcasts" className={`${styles.navLink} ${pathname.startsWith("/admin/email") ? styles.activeNavLink : ""}`}>
            <Mail size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Email Broadcasts</span>}
          </Link>
        </nav>

        {/* Footer del Sidebar: Tema, Configuración, Usuario y Pin Toggle */}
        <div style={{ marginTop: "auto", padding: "0.6rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          
          <div 
            style={{ display: "flex", alignItems: "center", position: "relative", padding: "0.4rem", borderRadius: "8px", transition: "background-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0 }}
              onClick={() => setShowDropdown(!showDropdown)}
              ref={dropdownRef}
              title="Cuenta de Usuario"
            >
              <div className={styles.avatar} style={{ width: "30px", height: "30px", fontSize: "0.8rem", flexShrink: 0 }}>MN</div>
              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Mauricio Negrin</span>
                </div>
              )}
            </div>

            {isExpanded && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", paddingLeft: "0.25rem" }}>
                <Link 
                  href="/admin/settings"
                  title="Configuración"
                  style={{ cursor: "pointer", color: "var(--text-color)", display: "flex", padding: "0.3rem", borderRadius: "6px", textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Settings size={15} />
                </Link>
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
                  style={{ cursor: "pointer", background: "none", border: "none", color: "var(--text-color)", display: "flex", padding: "0.3rem", borderRadius: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {currentTheme === "light" && <Sun size={15} />}
                  {currentTheme === "dark-dim" && <MoonStar size={15} />}
                  {currentTheme === "dark-black" && <Moon size={15} />}
                </button>
              </div>
            )}

            {showDropdown && (
              <div 
                className={styles.dropdownMenu} 
                style={{ 
                  bottom: "100%", 
                  top: "auto", 
                  left: 0, 
                  marginBottom: "0.5rem", 
                  width: isExpanded ? "100%" : "210px",
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

          {/* Cloudflare-style Pin Toggle Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: isExpanded ? "space-between" : "center", padding: "0.25rem 0.25rem 0 0.25rem" }}>
            {isExpanded && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.6, fontWeight: 500 }}>
                {isPinned ? "Barra fija" : "Desplegar en hover"}
              </span>
            )}
            <button
              type="button"
              onClick={togglePin}
              title={isPinned ? "Desfijar barra lateral (colapsar a íconos)" : "Fijar barra lateral desplegada"}
              style={{
                background: "transparent",
                border: "none",
                color: isPinned ? "var(--primary)" : "var(--text-color)",
                opacity: isPinned ? 1 : 0.6,
                cursor: "pointer",
                padding: "0.35rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isPinned ? "1" : "0.6";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {isPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          </div>

        </div>
      </aside>

      <main className={`${styles.mainContent} ${isPinned ? styles.mainContentPinned : ""}`}>
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
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>

      <ComposeEmailModal 
        isOpen={isComposeEmailOpen}
        onClose={() => setIsComposeEmailOpen(false)}
      />

      <QuickSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenComposeEmail={() => setIsComposeEmailOpen(true)}
      />
    </div>
  );
}
