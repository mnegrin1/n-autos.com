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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme states
  const [currentTheme, setCurrentTheme] = useState("light");

  // Estados de Notificaciones
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "1",
      type: "status",
      title: "Nueva Agencia Registrada",
      desc: "La agencia 'Automotores del Sur' se ha registrado exitosamente.",
      time: "Hoy 09:15",
      unread: true,
      link: "/superadmin/agencies"
    }
  ]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowBellDropdown(false);
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
      window.location.href = "/realstate/admin/login"; // Redirect to shared login
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    setShowBellDropdown(false);
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
            <div className={styles.bellWrapper} ref={bellRef}>
              <button 
                className={styles.bellBtn} 
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                title="Centro de Alertas"
                type="button"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
              </button>

              {showBellDropdown && (
                <div className={styles.bellDropdown}>
                  <div className={styles.bellHeader}>
                    <span>Alertas Recientes</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className={styles.clearAllBtn}>
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotifications}>Sin alertas nuevas</div>
                    ) : (
                      notifications.map((n) => (
                        <Link 
                          key={n.id} 
                          href={n.link} 
                          className={`${styles.notificationItem} ${n.unread ? styles.unread : ""}`}
                          onClick={() => handleNotificationClick(n.id)}
                        >
                          <div className={styles.notificationContent}>
                            <div className={styles.notificationTitle}>{n.title}</div>
                            <div className={styles.notificationDesc}>{n.desc}</div>
                            <div className={styles.notificationTime}>{n.time}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.themeSelectorTopbar}>
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
                style={{ cursor: "pointer" }}
              >
                {currentTheme === "light" && <Sun size={20} />}
                {currentTheme === "dark-dim" && <MoonStar size={20} />}
                {currentTheme === "dark-black" && <Moon size={20} />}
              </button>
            </div>

            <div className={styles.userMenuWrapper} ref={dropdownRef}>
              <div 
                className={styles.avatar} 
                onClick={() => setShowDropdown(!showDropdown)}
                title="Perfil y Configuración"
                style={{ 
                  cursor: "pointer", 
                  userSelect: "none", 
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  backgroundColor: "var(--danger, #ef4444)"
                }}
              >
                SA
              </div>

              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.menuHeader}>
                    <h4>Superadmin</h4>
                    <p>admin@n-sistemas.com</p>
                    <p style={{ fontWeight: 600, color: "var(--danger)", marginTop: "2px" }}>Control Total</p>
                  </div>
                  
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className={styles.logoutBtn}
                    >
                      <LogOut size={14} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
