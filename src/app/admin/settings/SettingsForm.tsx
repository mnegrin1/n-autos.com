"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./settings.module.css";
import { updateAgencySettings } from "@/actions/agencyActions";
import { Save, CheckCircle, Palette, Users, Settings as SettingsIcon, Globe, Sparkles, Lock, ShieldAlert, BookOpen } from "lucide-react";
import BrandingRequestModal from "@/components/BrandingRequestModal";
import { getPendingBrandingRequest, subscribeBrandingRequestStore, BrandingChangeRequest } from "@/lib/brandingRequestStore";
import IntegrationsClient from "../integrations/IntegrationsClient";
import UsersList from "./UsersList";
import EmailDomainSettings from "./EmailDomainSettings";
import WebDomainSettings from "./WebDomainSettings";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  cover_url?: string;
  web_template?: string;
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
}

interface SettingsFormProps {
  initialAgency: Agency;
  initialVehicles?: any[];
  initialIntegrations?: any[];
  initialPublications?: any[];
  initialUsers?: any[];
  appId?: string;
  appUrl?: string;
  errorMsg?: string;
  successMsg?: string;
}

type SettingsTab = "integrations" | "profile" | "domains" | "appearance" | "users" | "security";

const TABS: { id: SettingsTab; label: string; icon: any; title: string; description: string }[] = [
  {
    id: "integrations",
    label: "Integraciones",
    icon: Globe,
    title: "Integraciones y Portales",
    description: "Sincroniza tus publicaciones automáticamente con MercadoLibre y otros portales."
  },
  {
    id: "profile",
    label: "Perfil Comercial",
    icon: SettingsIcon,
    title: "Información Comercial y Marca",
    description: "Administra el nombre de la automotora, contacto directo de WhatsApp y color de marca."
  },
  {
    id: "domains",
    label: "Dominio & Email",
    icon: Sparkles,
    title: "Dominio Web y Correo Electrónico",
    description: "Conecta tu propio dominio web y configura el envío corporativo de emails."
  },
  {
    id: "appearance",
    label: "Apariencia CRM",
    icon: Palette,
    title: "Preferencias del Panel de Control",
    description: "Personaliza el tema visual, patrón de fondo y nivel de zoom para tu comodidad."
  },
  {
    id: "users",
    label: "Organización",
    icon: Users,
    title: "Control de Organización y Usuarios",
    description: "Administra a tu equipo de trabajo, asigna roles e invita a nuevos integrantes."
  },
  {
    id: "security",
    label: "Seguridad",
    icon: Lock,
    title: "Seguridad y Accesos",
    description: "Protege tu cuenta y actualiza tu contraseña de acceso en cualquier momento."
  }
];

export default function SettingsForm({ 
  initialAgency,
  initialVehicles = [],
  initialIntegrations = [],
  initialPublications = [],
  initialUsers = [],
  appId = "",
  appUrl = "http://localhost:3000",
  errorMsg,
  successMsg
}: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("integrations");

  const [agency, setAgency] = useState<Agency>(initialAgency);
  const [name, setName] = useState(agency.name);
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp || "");
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10b981");

  // Anti-fraud Branding Request State
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<BrandingChangeRequest | null>(null);

  useEffect(() => {
    const updatePending = () => {
      setPendingRequest(getPendingBrandingRequest(agency.id));
    };
    updatePending();
    const unsub = subscribeBrandingRequestStore(updatePending);
    return () => unsub();
  }, [agency.id]);

  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("crm-theme") || "light";
    return "light";
  });
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("crm-zoom") || "100%";
    return "100%";
  });
  const [bgPattern, setBgPattern] = useState(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem("crm-bg-pattern") || "solid";
      return p === "emerald" ? "gradient" : p;
    }
    return "solid";
  });
  const [bgPatternColor, setBgPatternColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("crm-bg-pattern-color") || agency.primary_color || "#10b981";
    }
    return agency.primary_color || "#10b981";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--bg-pattern-color", bgPatternColor);
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [bgPatternColor]);

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    startTransition(async () => {
      const res = await updateAgencySettings(agency.id, {
        name,
        whatsapp,
        primary_color: primaryColor,
      });

      if (res && res.data) {
        setAgency(res.data as Agency);
      } else {
        setAgency(prev => ({ 
          ...prev, 
          name, 
          whatsapp, 
          primary_color: primaryColor,
        }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };


  const handleApplyTheme = (selectedTheme: string) => {
    setTheme(selectedTheme);
    localStorage.setItem("crm-theme", selectedTheme);
    document.documentElement.className = "";
    document.documentElement.classList.add("theme-" + selectedTheme);
    if (bgPattern === "topography") {
      document.documentElement.classList.add("bg-pattern-topography");
    } else if (bgPattern === "emerald" || bgPattern === "gradient") {
      document.documentElement.classList.add("bg-pattern-gradient");
    }
  };

  const handleApplyPattern = (selectedPattern: string) => {
    setBgPattern(selectedPattern);
    localStorage.setItem("crm-bg-pattern", selectedPattern);
    
    document.documentElement.classList.remove("bg-pattern-topography");
    document.documentElement.classList.remove("bg-pattern-emerald");
    document.documentElement.classList.remove("bg-pattern-gradient");
    
    if (selectedPattern === "topography") {
      document.documentElement.classList.add("bg-pattern-topography");
    } else if (selectedPattern === "emerald" || selectedPattern === "gradient") {
      document.documentElement.classList.add("bg-pattern-gradient");
    }
  };

  const handleApplyPatternColor = (color: string) => {
    setBgPatternColor(color);
    localStorage.setItem("crm-bg-pattern-color", color);
    document.documentElement.style.setProperty("--bg-pattern-color", color);
  };

  const handleApplyZoom = (selectedZoom: string) => {
    setZoom(selectedZoom);
    localStorage.setItem("crm-zoom", selectedZoom);
    document.documentElement.style.zoom = selectedZoom;
  };

  const currentTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0];
  const CurrentIcon = currentTabInfo.icon;

  return (
    <div className={styles.settingsContainer}>
      {/* Banner Superior Unificado */}
      <div className={styles.topBanner}>
        <div>
          <h1 className={styles.bannerTitle}>Configuración del Sistema</h1>
          <p className={styles.bannerSub}>Ajustes del concesionario, diseño del sitio web y personalización del panel.</p>
        </div>

        <a
          href="/doc"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "var(--surface-hover)",
            border: "1px solid var(--border-color)",
            color: "var(--text-color)",
            padding: "0.65rem 1.15rem",
            borderRadius: "10px",
            fontSize: "0.88rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <BookOpen size={16} style={{ color: "var(--primary)" }} />
          Ver Documentación ↗
        </a>
      </div>

      {/* Layout de 2 columnas: Barra Lateral + Tarjeta de Contenido */}
      <div className={styles.layoutWrapper}>
        {/* Barra Lateral Izquierda de Navegación */}
        <nav className={styles.sidebar}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabButton} ${isActive ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>
                  <Icon size={18} />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tarjeta Central de Contenido */}
        <div className={styles.contentCard}>
          {/* Encabezado de la Sección */}
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <CurrentIcon size={22} style={{ color: "var(--primary)" }} />
              {currentTabInfo.title}
            </h2>
            <p className={styles.cardDescription}>{currentTabInfo.description}</p>
          </div>

          {/* 1. Integraciones */}
          {activeTab === "integrations" && (
            <div>
              <IntegrationsClient 
                initialVehicles={initialVehicles} 
                initialIntegrations={initialIntegrations as any} 
                initialPublications={initialPublications} 
                appId={appId}
                appUrl={appUrl}
                errorMsg={errorMsg}
                successMsg={successMsg}
              />
            </div>
          )}

          {/* 2. Perfil Comercial */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveAgency} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Banner de Solicitud Pendiente */}
              {pendingRequest && (
                <div style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  color: "#f59e0b",
                  fontSize: "0.88rem",
                  lineHeight: "1.4"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.95rem" }}>
                    <ShieldAlert size={18} /> Solicitud de Cambio Pendiente de Aprobación por el Super Admin
                  </div>
                  <div>
                    Solicitaste actualizar el nombre a <strong>&ldquo;{pendingRequest.requestedName}&rdquo;</strong> y el subdominio a <strong>&ldquo;{pendingRequest.requestedSubdomain}&rdquo;</strong>.
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.85, marginTop: "0.35rem", fontStyle: "italic" }}>
                    Justificación enviada: &ldquo;{pendingRequest.reason}&rdquo;
                  </div>
                </div>
              )}

              {/* Banner de Seguridad Antifraude */}
              <div style={{
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.25)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(37, 99, 235, 0.15)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Protección Antifraude</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                      La modificación del nombre o subdominio requiere autorización al Super Admin.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrandingModalOpen(true)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <ShieldAlert size={16} /> Solicitar Cambio
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre de la Automotora *</label>
                  <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 600 }}>🔒 Exclusivo Superadmin</span>
                </div>
                <input
                  type="text"
                  required
                  disabled
                  value={name}
                  style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem", opacity: 0.7, cursor: "not-allowed" }}
                />
                <span style={{ fontSize: "0.76rem", opacity: 0.75 }}>
                  El nombre de la automotora solo se puede modificar con autorización previa o directamente desde la página de Superadmin.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Número de WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: +598 99 123 456"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Color Principal de Marca</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: "42px", height: "42px", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", padding: 0 }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem", flex: 1 }}
                  />
                </div>
              </div>

              {/* Botón de Guardado */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                {success ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontSize: "0.9rem", fontWeight: "600" }}>
                    <CheckCircle size={16} /> ¡Información guardada!
                  </span>
                ) : <span />}
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  disabled={isPending}
                >
                  <Save size={16} /> {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}



          {/* 4. Dominio & Email */}
          {activeTab === "domains" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <WebDomainSettings agencyId={agency.id} subdomain={agency.subdomain} />
              <div className={styles.sectionDivider} />
              <EmailDomainSettings agencyId={agency.id} />
            </div>
          )}

          {/* 5. Apariencia CRM */}
          {activeTab === "appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {!mounted ? (
                <div style={{ opacity: 0.5, fontSize: "0.9rem", padding: "1rem 0" }}>Cargando preferencias...</div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tema de Color del Panel</label>
                    <select
                      value={theme}
                      onChange={(e) => handleApplyTheme(e.target.value)}
                      style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      <option value="light">Tema Claro (Azul)</option>
                      <option value="dark-dim">Tema Dim (Azul Twitter)</option>
                      <option value="dark-black">Tema Black (Negro Total)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Fondo de Pantalla del Panel</label>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div 
                        onClick={() => handleApplyPattern("solid")}
                        style={{ 
                          flex: 1, 
                          border: bgPattern === "solid" ? "2px solid var(--primary)" : "2px solid var(--border-color)", 
                          borderRadius: "8px", 
                          padding: "0.5rem", 
                          cursor: "pointer", 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "0.5rem",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ width: "100%", height: "60px", backgroundColor: "var(--bg-color)", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: bgPattern === "solid" ? "600" : "400", textAlign: "center" }}>Sólido</span>
                      </div>
                      
                      <div 
                        onClick={() => handleApplyPattern("topography")}
                        style={{ 
                          flex: 1, 
                          border: bgPattern === "topography" ? "2px solid var(--primary)" : "2px solid var(--border-color)", 
                          borderRadius: "8px", 
                          padding: "0.5rem", 
                          cursor: "pointer", 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "0.5rem",
                          alignItems: "center"
                        }}
                      >
                        <div className={bgPattern === "topography" ? "" : "bg-pattern-topography"} style={{ width: "100%", height: "60px", backgroundColor: "var(--bg-color)", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: bgPattern === "topography" ? "600" : "400", textAlign: "center" }}>Topográfico Clásico</span>
                      </div>

                      <div 
                        onClick={() => handleApplyPattern("gradient")}
                        style={{ 
                          flex: 1, 
                          border: bgPattern === "gradient" ? "2px solid var(--primary)" : "2px solid var(--border-color)", 
                          borderRadius: "8px", 
                          padding: "0.5rem", 
                          cursor: "pointer", 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "0.5rem",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ width: "100%", height: "60px", background: `radial-gradient(circle at 15% 50%, color-mix(in srgb, ${bgPatternColor} 40%, transparent) 0%, transparent 45%), radial-gradient(circle at 85% 30%, color-mix(in srgb, ${bgPatternColor} 50%, transparent) 0%, transparent 45%), radial-gradient(circle at 50% 80%, color-mix(in srgb, ${bgPatternColor} 35%, transparent) 0%, transparent 50%), color-mix(in srgb, ${bgPatternColor} 15%, #000)`, borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: bgPattern === "gradient" ? "600" : "400", textAlign: "center" }}>Gradiente Fluido</span>
                      </div>
                    </div>
                  </div>

                  {bgPattern === "gradient" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Color del Gradiente</label>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          type="color"
                          value={bgPatternColor}
                          onChange={(e) => handleApplyPatternColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", padding: 0 }}
                        />
                        <input
                          type="text"
                          value={bgPatternColor}
                          onChange={(e) => handleApplyPatternColor(e.target.value)}
                          style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)", fontSize: "0.9rem", flex: 1 }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nivel de Zoom Visual</label>
                    <select
                      value={zoom}
                      onChange={(e) => handleApplyZoom(e.target.value)}
                      style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      <option value="75%">Pequeño (75%)</option>
                      <option value="100%">Normal (100%)</option>
                      <option value="125%">Grande (125%)</option>
                      <option value="150%">Extra Grande (150%)</option>
                      <option value="175%">Máximo (175%)</option>
                    </select>
                    <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>Ajusta el tamaño del panel para mayor comodidad de lectura.</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 6. Organización */}
          {activeTab === "users" && (
            <div>
              <UsersList agencyId={agency.id} initialUsers={initialUsers} />
            </div>
          )}

          {/* 7. Seguridad */}
          {activeTab === "security" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--bg-color)", padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Contraseña de la Cuenta</h4>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.83rem", opacity: 0.7 }}>Cambia tu clave de acceso al panel de control en cualquier momento.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                style={{
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-color)",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <Lock size={16} style={{ color: "#10b981" }} /> Cambiar Contraseña
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Solicitud de Cambio de Branding (Antifraude) */}
      <BrandingRequestModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        agencyId={agency.id}
        currentName={name}
        currentSubdomain={agency.subdomain || "hola"}
        onRequestSubmitted={() => {
          setPendingRequest(getPendingBrandingRequest(agency.id));
        }}
      />

      {/* Modal de Cambio de Contraseña */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
