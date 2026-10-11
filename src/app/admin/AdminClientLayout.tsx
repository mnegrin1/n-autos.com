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
  PanelLeftClose,
  Zap,
  Headphones,
  Pin,
  ChevronLeft,
  ChevronRight,
  Globe,
  Calendar
} from "lucide-react";
import ComposeEmailModal from "@/components/ComposeEmailModal";
import QuickSearchModal from "@/components/QuickSearchModal";
import SupportModal from "@/components/SupportModal";
import SessionGuard from "@/components/SessionGuard";
import ServiceWorkerRegister from "@/components/PWA/ServiceWorkerRegister";
import MobileBottomNav from "@/components/PWA/MobileBottomNav";
import OnboardingTour from "@/components/admin/OnboardingTour";
import { notifySessionEvent, getCurrentClientSession } from "@/lib/sessionHelper";
import { isFeatureEnabledForUser, subscribeFeatureFlags } from "@/lib/featureFlagsStore";
import { getTenantSession, subscribeTenantSession, syncTenantSessionForUser, TenantSession, DEFAULT_STARTER_TENANT } from "@/lib/tenantStore";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { Sparkles, ShieldCheck, Building2, X } from "lucide-react";
import { isSuperAdmin } from "@/lib/iam/rbac";
import { getSuperAdminAgenciesAction, switchTenantSessionAction } from "@/actions/superadminActions";

export default function AdminClientLayout({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: any;
}) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mounted flag to eliminate SSR vs Client hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  // Tenant & Active Subscription Plan State (deterministic on initial render)
  const [tenantSession, setTenantSession] = useState<TenantSession>(() => {
    if (initialUser && initialUser.email) {
      return {
        ...DEFAULT_STARTER_TENANT,
        agencyId: initialUser.agency_id || DEFAULT_STARTER_TENANT.agencyId,
        agencyName: initialUser.agency_name || DEFAULT_STARTER_TENANT.agencyName,
        subdomain: initialUser.subdomain || DEFAULT_STARTER_TENANT.subdomain,
        adminName: initialUser.name || DEFAULT_STARTER_TENANT.adminName,
        adminEmail: initialUser.email || DEFAULT_STARTER_TENANT.adminEmail,
      };
    }
    return DEFAULT_STARTER_TENANT;
  });

  useEffect(() => {
    setIsMounted(true);

    // Si existe un usuario autenticado verificado desde la cookie de servidor,
    // sincronizar inmediatamente el almacenamiento local del cliente (tenant)
    if (initialUser && initialUser.email) {
      const currentTenant = getTenantSession();
      if (!currentTenant.adminEmail || currentTenant.adminEmail.toLowerCase() !== initialUser.email.toLowerCase()) {
        syncTenantSessionForUser(initialUser);
      }
    }
    setTenantSession(getTenantSession());
    const unsubscribe = subscribeTenantSession((updated) => {
      setTenantSession(updated);
    });
    return () => unsubscribe();
  }, [initialUser]);


  // Agency branding & dynamic favicon state
  const [agencyBranding, setAgencyBranding] = useState<{
    name: string;
    logoUrl: string;
    subdomain: string;
  }>({
    name: tenantSession.agencyName || "Automotora VIP",
    logoUrl: "",
    subdomain: tenantSession.subdomain || "demo"
  });

  useEffect(() => {
    let isMounted = true;
    
    function updateFaviconAndTitle(logoUrl?: string, agencyName?: string) {
      if (typeof window === "undefined") return;

      if (agencyName && agencyName.trim() !== "") {
        document.title = agencyName;
      }

      if (logoUrl && logoUrl.trim() !== "") {
        // Remove all default/existing icon links from head to force browser update
        const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel*='shortcut'], link[rel*='apple-touch-icon']");
        existingIcons.forEach(el => el.remove());

        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.type = "image/x-icon";
        newLink.href = logoUrl;
        document.head.appendChild(newLink);

        const shortcutLink = document.createElement("link");
        shortcutLink.rel = "shortcut icon";
        shortcutLink.href = logoUrl;
        document.head.appendChild(shortcutLink);
      }
    }

    async function fetchAgencyBranding() {
      try {
        const agency = await getPrimaryAgency(initialUser?.agency_id);
        if (agency && isMounted) {
          const name = agency.name || tenantSession.agencyName || "Automotora VIP";
          const logoUrl = agency.logo_url || "";
          const subdomain = agency.subdomain || tenantSession.subdomain || "demo";
          setAgencyBranding({ name, logoUrl, subdomain });
          updateFaviconAndTitle(logoUrl, name);
        }
      } catch (err) {
        console.error("Error cargando marca de automotora:", err);
      }
    }
    fetchAgencyBranding();

    function handleBrandingUpdate(e: any) {
      const detail = e.detail || {};
      setAgencyBranding(prev => {
        const nextName = detail.name !== undefined && detail.name !== "" ? detail.name : prev.name;
        const nextLogo = detail.logo_url !== undefined ? detail.logo_url : prev.logoUrl;
        const nextSubdomain = detail.subdomain !== undefined ? detail.subdomain : prev.subdomain;
        updateFaviconAndTitle(nextLogo, nextName);
        return { name: nextName, logoUrl: nextLogo, subdomain: nextSubdomain };
      });
    }

    window.addEventListener("agency-branding-updated", handleBrandingUpdate as any);
    return () => {
      isMounted = false;
      window.removeEventListener("agency-branding-updated", handleBrandingUpdate as any);
    };
  }, [tenantSession.agencyName]);

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

  // Support modal state & Session info
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [featuresVersion, setFeaturesVersion] = useState(0);
  const [clientSession, setClientSession] = useState<any>(null);

  useEffect(() => {
    setClientSession(getCurrentClientSession());
  }, []);

  const userEmail = initialUser?.email || clientSession?.email || tenantSession.adminEmail || "mauricio@automotora.com";
  const userId = initialUser?.id || clientSession?.id || tenantSession.agencyId;

  // Safe feature flag check: always matches server HTML during initial render/hydration
  const isFeatureEnabled = (featureId: string) => {
    if (!isMounted) return true;
    return isFeatureEnabledForUser(featureId, userEmail);
  };

  const rawUserName = initialUser?.name || clientSession?.name || tenantSession.adminName || "";
  
  const displayUserName = (() => {
    if (rawUserName && rawUserName.trim() !== "" && rawUserName !== "Mauricio Negrin") {
      if (!rawUserName.includes(" ") && rawUserName.toLowerCase() === userEmail.split("@")[0].toLowerCase()) {
        const handle = rawUserName.replace(/[._-]/g, " ");
        return handle.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
      return rawUserName;
    }
    if (initialUser?.name) return initialUser.name;
    if (clientSession?.name) return clientSession.name;
    if (tenantSession.adminName) return tenantSession.adminName;
    if (userEmail && userEmail.includes("@")) {
      const handle = userEmail.split("@")[0].replace(/[._-]/g, " ");
      return handle.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return "Mauricio Negrin";
  })();

  const isSuperAdminUser =
    isSuperAdmin(initialUser) ||
    initialUser?.role === "superadmin" ||
    initialUser?.role === "Superadmin" ||
    initialUser?.email?.toLowerCase() === "mauricio.negrin@n-sistemas.com" ||
    userEmail.toLowerCase() === "mauricio.negrin@n-sistemas.com";

  // Organization switcher modal state
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [availableAgencies, setAvailableAgencies] = useState<any[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [switchingToId, setSwitchingToId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdminUser && isOrgSwitcherOpen) {
      setIsLoadingAgencies(true);
      getSuperAdminAgenciesAction()
        .then((res) => {
          if (res.success && res.data) {
            setAvailableAgencies(res.data);
          }
        })
        .catch((err) => console.error("Error cargando organizaciones para switcher de superadmin:", err))
        .finally(() => setIsLoadingAgencies(false));
    }
  }, [isSuperAdminUser, isOrgSwitcherOpen]);

  const handleSwitchToAgency = async (targetAgency: any) => {
    setSwitchingToId(targetAgency.id);
    try {
      const res = await switchTenantSessionAction(
        targetAgency.id,
        targetAgency.subdomain,
        targetAgency.name
      );
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        alert(res.error || "No se pudo cambiar de organización.");
        setSwitchingToId(null);
      }
    } catch (err: any) {
      alert("Error al cambiar de organización: " + (err.message || "Error desconocido"));
      setSwitchingToId(null);
    }
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === "") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const unsubscribe = subscribeFeatureFlags(() => {
      setFeaturesVersion(v => v + 1);
    });
    return () => unsubscribe();
  }, []);

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
    const pattern = localStorage.getItem("crm-bg-pattern") || "topography";
    document.documentElement.classList.add("theme-" + theme);
    if (pattern === "topography" || !pattern) {
      document.documentElement.classList.add("bg-pattern-topography");
    } else if (pattern === "gradient" || pattern === "emerald") {
      document.documentElement.classList.add("bg-pattern-gradient");
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

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
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
      console.error("Error cerrando sesión:", err);
    }
    window.location.href = "/admin/login";
  };
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/accept-invite";

  if (isAuthPage) {
    return (
      <div style={{ minHeight: "100vh", width: "100vw", backgroundColor: "var(--bg-color)" }}>
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
          body, html, button, input, select, textarea, span, div, h1, h2, h3, h4, h5, h6, label {
            font-family: 'Inter', sans-serif !important;
          }
        `}} />
        {children}
      </div>
    );
  }

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
        {/* Header Logo con Logo e Imagen seleccionada por la Automotora */}
        <div className={styles.logoContainer} style={{ padding: "1.25rem 0.85rem", gap: "0.75rem", alignItems: "center" }}>
          {agencyBranding.logoUrl ? (
            <img 
              src={agencyBranding.logoUrl} 
              alt={agencyBranding.name}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid var(--border-color)",
                backgroundColor: "#ffffff"
              }}
            />
          ) : (
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
              {agencyBranding.name ? agencyBranding.name.charAt(0).toUpperCase() : "A"}
            </div>
          )}
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", transition: "opacity 0.2s" }}>
              <span 
                title={agencyBranding.name}
                style={{ 
                  fontSize: "1.05rem", 
                  fontWeight: 800, 
                  color: "var(--text-color)", 
                  letterSpacing: "-0.02em", 
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "165px"
                }}
              >
                {agencyBranding.name}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
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
                <span>Buscar en el CRM...</span>
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
                <Link 
                  href="/admin/agenda?action=new" 
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
                  <Calendar size={16} /> Agendar Turno / Cita
                </Link>
              </div>
            )}
          </div>

          <Link href="/admin" title="Dashboard" className={`${styles.navLink} ${pathname === "/admin" ? styles.activeNavLink : ""}`}>
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span>Dashboard</span>}
          </Link>
          {isFeatureEnabled("vehicles") && (
            <Link href="/admin/vehicles" data-tour="vehicles-nav" title="Inventario Stock" className={`${styles.navLink} ${pathname.startsWith("/admin/vehicles") ? styles.activeNavLink : ""}`}>
              <Car size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Inventario Stock</span>}
            </Link>
          )}
          {isFeatureEnabled("inbox") && (
            <Link href="/admin/inbox" title="Bandeja de Entrada" className={`${styles.navLink} ${pathname.startsWith("/admin/inbox") ? styles.activeNavLink : ""}`}>
              <MessageSquare size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Bandeja de Entrada</span>}
            </Link>
          )}
          {isFeatureEnabled("publications") && (
            <Link href="/admin/publications" title="Publicaciones Activas" className={`${styles.navLink} ${pathname.startsWith("/admin/publications") ? styles.activeNavLink : ""}`}>
              <Share2 size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Publicaciones</span>}
            </Link>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", width: "100%" }}>
            <Link href="/admin/website" data-tour="website-nav" title="Página Web" className={`${styles.navLink} ${pathname.startsWith("/admin/website") ? styles.activeNavLink : ""}`} style={{ flex: 1, minWidth: 0 }}>
              <Globe size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Página Web</span>}
            </Link>
            {isExpanded && (
              <a
                href={isMounted && typeof window !== "undefined" && window.location.hostname.endsWith(".localhost")
                  ? `http://${agencyBranding.subdomain || "demo"}.localhost:3000`
                  : `https://${agencyBranding.subdomain || "demo"}.n-autos.com`}

                target="_blank"
                rel="noopener noreferrer"
                title={`Abrir ${agencyBranding.subdomain || "demo"}.n-autos.com en vivo`}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  backgroundColor: "rgba(16, 185, 129, 0.14)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                ↗ Web
              </a>
            )}
          </div>
          {isFeatureEnabled("crm") && (
            <Link href="/admin/crm" data-tour="crm-nav" title="Contactos" className={`${styles.navLink} ${pathname.startsWith("/admin/crm") ? styles.activeNavLink : ""}`}>
              <Users size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Contactos</span>}
            </Link>
          )}
          {isFeatureEnabled("agenda") && (
            <Link 
              href="/admin/agenda" 
              data-tour="agenda-nav"
              title="Agenda / Turnos" 
              className={`${styles.navLink} ${pathname.startsWith("/admin/agenda") || pathname.startsWith("/admin/calendar") ? styles.activeNavLink : ""}`}
            >
              <Calendar size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Agenda / Turnos</span>}
            </Link>
          )}
          {isFeatureEnabled("email") && (
            <Link href="/admin/email/broadcasts" title="Email Broadcasts" className={`${styles.navLink} ${pathname.startsWith("/admin/email") ? styles.activeNavLink : ""}`}>
              <Mail size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Email Broadcasts</span>}
            </Link>
          )}
          {isFeatureEnabled("automations") && (
            <Link href="/admin/automations" title="Automatizaciones" className={`${styles.navLink} ${pathname.startsWith("/admin/automations") ? styles.activeNavLink : ""}`}>
              <Zap size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span>Automatizaciones</span>}
            </Link>
          )}

          {isSuperAdminUser && (
            <Link 
              href="/superadmin" 
              title="Panel Superadmin" 
              className={styles.navLink} 
              style={{ 
                color: "#ef4444", 
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px dashed rgba(239, 68, 68, 0.3)",
                marginTop: "0.5rem"
              }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span style={{ fontWeight: 700 }}>Panel Superadmin</span>}
            </Link>
          )}

          {/* Botón mínimo para accionar la guía rápida inicial */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-onboarding-tour"));
            }}
            title="Guía Rápida Inicial (Probar tour)"
            className={styles.navLink}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              color: "rgba(255, 255, 255, 0.85)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.25rem",
              borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
              paddingTop: "0.6rem"
            }}
          >
            <Sparkles size={18} style={{ flexShrink: 0, color: "#ffffff" }} />
            {isExpanded && <span style={{ fontWeight: 600 }}>Guía Rápida</span>}
          </button>
        </nav>

        {/* Footer del Sidebar: Tema, Configuración, Usuario y Pin Toggle */}
        <div style={{ marginTop: "auto", padding: "0.6rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          
          {/* Botones rápidos de pie de sidebar */}

          <div 
            ref={dropdownRef}
            style={{ display: "flex", alignItems: "center", position: "relative", padding: "0.4rem", borderRadius: "8px", transition: "background-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0 }}
              onClick={() => setShowDropdown(!showDropdown)}
              title={`Cuenta de ${displayUserName}`}
            >
              <div className={styles.avatar} style={{ width: "30px", height: "30px", fontSize: "0.8rem", flexShrink: 0 }}>
                {getInitials(displayUserName)}
              </div>
              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <span 
                    title={displayUserName}
                    style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {displayUserName}
                  </span>
                  <span 
                    title={agencyBranding.name || tenantSession.agencyName || "Automotora"}
                    style={{ fontSize: "0.7rem", color: "var(--text-color)", opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {agencyBranding.name || tenantSession.agencyName || "Automotora"}
                  </span>
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
                    const pattern = localStorage.getItem("crm-bg-pattern") || "topography";
                    document.documentElement.className = "";
                    document.documentElement.classList.add('theme-' + nextTheme);
                    if (pattern === "topography" || !pattern) {
                      document.documentElement.classList.add("bg-pattern-topography");
                    } else if (pattern === "gradient" || pattern === "emerald") {
                      document.documentElement.classList.add("bg-pattern-gradient");
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
                  <p style={{ margin: 0, fontSize: "0.825rem", fontWeight: 700, color: "var(--text-color)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayUserName}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.725rem", color: "var(--text-color)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userEmail}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)" }}>
                    Administrador de Automotora
                  </p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {isSuperAdminUser && (
                    <Link 
                      href="/superadmin" 
                      onClick={() => setShowDropdown(false)}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#ef4444", textDecoration: "none", padding: "0.5rem", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.08)", transition: "background-color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.16)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"}
                    >
                      <ShieldCheck size={14} /> Panel Superadmin
                    </Link>
                  )}
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
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      window.dispatchEvent(new CustomEvent("open-onboarding-tour"));
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", background: "none", border: "none", width: "100%", textAlign: "left", padding: "0.5rem", borderRadius: "6px", cursor: "pointer", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Sparkles size={14} color="currentColor" /> Ver Guía Inicial
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setIsSupportOpen(true);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", width: "100%", textAlign: "left", padding: "0.5rem", borderRadius: "6px", cursor: "pointer", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Headphones size={14} /> Hablar con soporte
                  </button>
                  <button 
                    type="button"
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

          {/* Cloudflare-style Pin Toggle Button & n-autos.com Branding Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0.25rem 0 0.25rem", width: "100%" }}>
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

            {isExpanded && (
              <a
                href="https://n-autos.com"
                target="_blank"
                rel="noopener noreferrer"
                title="n-autos.com"
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "0.05rem",
                  textDecoration: "none",
                  padding: "0.25rem 0.4rem",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                  userSelect: "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(128,128,128,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span 
                  style={{ 
                    fontFamily: '"Test Tiempos Headline Light", "Test Tiempos Headline Light Placeholder", serif', 
                    fontSize: "1rem", 
                    fontWeight: 700, 
                    color: "var(--text-color)", 
                    letterSpacing: "-0.01em", 
                    lineHeight: 1 
                  }}
                >
                  n-autos
                </span>
                <span 
                  style={{ 
                    fontFamily: '"Test Tiempos Headline Light", "Test Tiempos Headline Light Placeholder", serif', 
                    fontSize: "0.85rem", 
                    fontWeight: 400, 
                    color: currentTheme === "light" ? "#64748b" : "#94a3b8", 
                    letterSpacing: 0, 
                    lineHeight: 1 
                  }}
                >
                  .com
                </span>
              </a>
            )}
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

        {/* Banner de Superadmin: Modo Control Global & Switcher */}
        {isSuperAdminUser && (
          <div style={{
            margin: "0.5rem 1.5rem 0.5rem 1.5rem",
            padding: "0.6rem 1.15rem",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: "var(--danger, #ef4444)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)"
              }}>
                SA
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-color)" }}>
                    Modo Soporte / Control Superadmin
                  </span>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "20px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Global
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.75 }}>
                  Gestionando: <strong style={{ color: "var(--primary)" }}>{agencyBranding.name || tenantSession.agencyName || "Esta Organización"}</strong> ({tenantSession.subdomain || agencyBranding.subdomain}.n-autos.com)
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsOrgSwitcherOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-color)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
              >
                <Building2 size={14} /> Cambiar Organización
              </button>
              <Link
                href="/superadmin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  backgroundColor: "var(--danger, #ef4444)",
                  color: "#ffffff",
                  textDecoration: "none",
                  transition: "opacity 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <ShieldCheck size={14} /> Volver a Superadmin
              </Link>
            </div>
          </div>
        )}

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

      <SupportModal 
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userEmail={userEmail}
        userName={displayUserName}
        agencyName={agencyBranding.name || tenantSession.agencyName || "Test-Automotora"}
      />

      <SessionGuard 
        currentUserId={userId} 
        currentUserEmail={userEmail} 
      />

      <OnboardingTour
        agencyName={agencyBranding.name || tenantSession.agencyName || "Tu Automotora"}
        subdomain={agencyBranding.subdomain || tenantSession.subdomain || "demo"}
        userName={displayUserName}
        userRole={initialUser?.role || "admin"}
        adminPrefix="/admin"
      />

      {/* Modal de Selector de Organización para Superadmin */}
      {isOrgSwitcherOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color, #18181b)",
            borderRadius: "16px",
            border: "1px solid var(--border-color, #27272a)",
            width: "100%",
            maxWidth: "520px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color, #27272a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={18} style={{ color: "var(--primary, #3b82f6)" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-color, #fff)" }}>
                  Acceder a otra Organización
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgSwitcherOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-color)",
                  opacity: 0.7,
                  cursor: "pointer",
                  padding: "0.25rem"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.25rem 1.5rem", maxHeight: "380px", overflowY: "auto" }}>
              {isLoadingAgencies ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-color)", opacity: 0.7 }}>
                  Cargando organizaciones...
                </div>
              ) : availableAgencies.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-color)", opacity: 0.7 }}>
                  No se encontraron organizaciones disponibles.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {availableAgencies.map((agency: any) => {
                    const isCurrent = agency.id === tenantSession.agencyId || agency.subdomain === agencyBranding.subdomain || agency.subdomain === tenantSession.subdomain;
                    return (
                      <div
                        key={agency.id || agency.subdomain}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "10px",
                          border: `1px solid ${isCurrent ? "var(--primary, #3b82f6)" : "var(--border-color, #27272a)"}`,
                          backgroundColor: isCurrent ? "rgba(59, 130, 246, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-color, #fff)", fontSize: "0.95rem" }}>
                            {agency.name || "Automotora"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-color)", opacity: 0.65 }}>
                            {agency.subdomain}.n-autos.com
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent || switchingToId === agency.id}
                          onClick={() => handleSwitchToAgency(agency)}
                          style={{
                            padding: "0.4rem 0.85rem",
                            borderRadius: "8px",
                            backgroundColor: isCurrent ? "rgba(255, 255, 255, 0.08)" : "#10b981",
                            color: isCurrent ? "var(--text-color)" : "#ffffff",
                            border: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: isCurrent ? "default" : "pointer",
                            opacity: isCurrent ? 0.6 : 1
                          }}
                        >
                          {switchingToId === agency.id ? "Ingresando..." : isCurrent ? "Actual" : "Ingresar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ServiceWorkerRegister />
      <MobileBottomNav />
    </div>
  );
}
