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
  CreditCard,
  Sliders,
  MessageSquare,
  LogOut, 
  Sun,
  Moon,
  MoonStar,
  Menu,
  PanelLeft,
  PanelLeftClose,
  BookOpen,
  ShieldAlert,
  MousePointerClick,
  CalendarClock
} from "lucide-react";
import { getBrandingRequests, subscribeBrandingRequestStore } from "@/lib/brandingRequestStore";
import { getLandingInquiries, subscribeInquiries } from "@/lib/inquiryStore";
import SessionGuard from "@/components/SessionGuard";
import { getCurrentClientSession, notifySessionEvent } from "@/lib/sessionHelper";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/superadmin/login";

  if (isAuthPage) {
    return <>{children}</>;
  }
  // Dropdown & Menu states
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sidebar pin & hover state (Cloudflare style)
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Theme states
  const [currentTheme, setCurrentTheme] = useState("light");
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const isExpanded = isPinned || isHovered || isMobileMenuOpen;

  useEffect(() => {
    const updateCount = async () => {
      if (document.hidden) return;

      const reqs = getBrandingRequests();
      const localInqs = getLandingInquiries();
      
      let apiInqs: any[] = [];
      try {
        const res = await fetch("/api/landing-inquiries", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.inquiries)) {
            apiInqs = data.inquiries;
          }
        }
      } catch (e) {}

      const pendingBrand = reqs.filter((r) => r.status === "pending").length;
      
      const map = new Map<string, any>();

      const addDeduplicated = (item: any) => {
        if (!item || !item.id) return;
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      };

      apiInqs.forEach(addDeduplicated);
      localInqs.forEach(addDeduplicated);

      const pendingInq = Array.from(map.values()).filter(i => i.status === "pending").length;
      
      setPendingRequestsCount(pendingBrand + pendingInq);
    };

    updateCount();
    const interval = setInterval(updateCount, 15000);

    const handleFocusOrVisibility = () => {
      if (!document.hidden) {
        updateCount();
      }
    };

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    const unsubBrand = subscribeBrandingRequestStore(updateCount);
    const unsubInq = subscribeInquiries(updateCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      unsubBrand();
      unsubInq();
    };
  }, []);

  // Load pinned preference & theme from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pinnedValue = localStorage.getItem("crm-sidebar-pinned");
      if (pinnedValue !== null) {
        setIsPinned(pinnedValue === "true");
      }
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

  // Close menus on outside click
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

  const [sessionUserEmail, setSessionUserEmail] = useState<string>("");

  useEffect(() => {
    const session = getCurrentClientSession();
    if (session && session.email) {
      setSessionUserEmail(session.email);
    }
  }, []);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowDropdown(false);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.removeItem("n_sistemas_tenant_session_v1");
        localStorage.removeItem("n_sistemas_session_event");
        localStorage.removeItem("n_sistemas_tab_user_id");
        localStorage.removeItem("n_sistemas_tab_user_email");
      }
      notifySessionEvent("LOGOUT");
      document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "admin-session=; path=/; max-age=0;";
      await logout();
    } catch (err) {
      console.error("Error cerrando sesión de Superadmin:", err);
    }
    window.location.href = "/superadmin/login";
  };

  return (
    <div className={styles.adminContainer}>
      <SessionGuard />
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
            backgroundColor: "var(--danger, #ef4444)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "1.1rem",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
          }}>
            N
          </div>
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", transition: "opacity 0.2s" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-color)", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                N<span style={{ color: "var(--primary)" }}>Autos</span>
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--danger, #ef4444)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Superadmin
              </span>
            </div>
          )}
        </div>
        
        <nav className={styles.nav} onClick={() => setIsMobileMenuOpen(false)}>
          <Link href="/superadmin" title="Dashboard Global" className={`${styles.navLink} ${pathname === "/superadmin" ? styles.activeNavLink : ""}`}>
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Dashboard Global</span>}
          </Link>
          <Link href="/superadmin/agencies" title="Organizaciones" className={`${styles.navLink} ${pathname.startsWith("/superadmin/agencies") ? styles.activeNavLink : ""}`}>
            <Building2 size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Organizaciones</span>}
          </Link>
          <Link href="/superadmin/clicks" title="Estadísticas Landing" className={`${styles.navLink} ${pathname.startsWith("/superadmin/clicks") ? styles.activeNavLink : ""}`}>
            <MousePointerClick size={18} style={{ flexShrink: 0, color: "#3b82f6" }} />
            {isExpanded && <span>Estadísticas Landing</span>}
          </Link>
          <Link href="/superadmin/requests" title="Solicitudes & Consultas" className={`${styles.navLink} ${pathname.startsWith("/superadmin/requests") ? styles.activeNavLink : ""}`}>
            <ShieldAlert size={18} style={{ flexShrink: 0, color: pendingRequestsCount > 0 ? "#ef4444" : "inherit" }} />
            {isExpanded && (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>Solicitudes & Consultas</span>
                {pendingRequestsCount > 0 && (
                  <span style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "2px 6px",
                    fontSize: "0.7rem",
                    fontWeight: 700
                  }}>
                    {pendingRequestsCount}
                  </span>
                )}
              </span>
            )}
          </Link>
          <Link href="/superadmin/calendar" title="Agenda & Google Meet" className={`${styles.navLink} ${pathname.startsWith("/superadmin/calendar") ? styles.activeNavLink : ""}`}>
            <CalendarClock size={18} style={{ flexShrink: 0, color: "#10b981" }} />
            {isExpanded && <span>Agenda & Google Meet</span>}
          </Link>
          <Link href="/superadmin/users" title="Usuarios Globales" className={`${styles.navLink} ${pathname.startsWith("/superadmin/users") ? styles.activeNavLink : ""}`}>
            <Users size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Usuarios Globales</span>}
          </Link>
          <Link href="/superadmin/features" title="Funcionalidades CRM" className={`${styles.navLink} ${pathname.startsWith("/superadmin/features") ? styles.activeNavLink : ""}`}>
            <Sliders size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Funcionalidades</span>}
          </Link>
          <Link href="/superadmin/support" title="Soporte & Mensajes" className={`${styles.navLink} ${pathname.startsWith("/superadmin/support") ? styles.activeNavLink : ""}`}>
            <MessageSquare size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Soporte & Mensajes</span>}
          </Link>
          <Link href="/doc" title="Documentación CRM" className={`${styles.navLink} ${pathname.startsWith("/doc") ? styles.activeNavLink : ""}`}>
            <BookOpen size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Documentación (/doc)</span>}
          </Link>
        </nav>

        {/* Footer del Sidebar: Tema y Usuario */}
        <div style={{ marginTop: "auto", padding: "0.6rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          
          <div 
            ref={dropdownRef}
            style={{ display: "flex", alignItems: "center", position: "relative", padding: "0.4rem", borderRadius: "8px", transition: "background-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0 }}
              onClick={() => setShowDropdown(!showDropdown)}
              title="Cuenta Superadmin"
            >
              <div className={styles.avatar} style={{ width: "30px", height: "30px", fontSize: "0.8rem", flexShrink: 0, backgroundColor: "var(--danger, #ef4444)" }}>SA</div>
              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Superadmin</span>
                </div>
              )}
            </div>

            {isExpanded && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", paddingLeft: "0.25rem" }}>
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
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sessionUserEmail || "mauricio.negrin@n-sistemas.com"}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--danger, #ef4444)", marginTop: "2px" }}>Control Total</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button 
                    onClick={(e) => handleLogout(e)}
                    onMouseDown={(e) => e.stopPropagation()}
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

          {/* Cloudflare-style Pin Toggle Button - Static on the left */}
          <div style={{ display: "flex", alignItems: "center", padding: "0.25rem 0.25rem 0 0.25rem" }}>
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
                flexShrink: 0,
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

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 99
          }}
        />
      )}

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
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--danger, #ef4444)" }}>
              N-Autos SuperAdmin
            </span>
          </div>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
