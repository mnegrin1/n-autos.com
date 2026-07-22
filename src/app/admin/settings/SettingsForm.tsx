"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./settings.module.css";
import { updateAgencySettings } from "@/actions/agencyActions";
import { Save, CheckCircle, Palette, HelpCircle, Users } from "lucide-react";
import IntegrationsClient from "../integrations/IntegrationsClient";
import UsersList from "./UsersList";
import EmailDomainSettings from "./EmailDomainSettings";

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  cover_url?: string;
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
  const [agency, setAgency] = useState<Agency>(initialAgency);
  const [name, setName] = useState(agency.name);
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp || "");
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10b981");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [theme, setTheme] = useState("light");
  const [zoom, setZoom] = useState("100%");
  const [bgPattern, setBgPattern] = useState("solid");
  const [bgPatternColor, setBgPatternColor] = useState(agency.primary_color || "#10b981");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem("crm-theme") || "light");
    setZoom(localStorage.getItem("crm-zoom") || "100%");
    let savedPattern = localStorage.getItem("crm-bg-pattern") || "solid";
    if (savedPattern === "emerald") savedPattern = "gradient";
    setBgPattern(savedPattern);
    const savedColor = localStorage.getItem("crm-bg-pattern-color") || agency.primary_color || "#10b981";
    setBgPatternColor(savedColor);
    document.documentElement.style.setProperty("--bg-pattern-color", savedColor);
    setMounted(true);
  }, []);

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    startTransition(async () => {
      const res = await updateAgencySettings(agency.id, {
        name,
        whatsapp,
        primary_color: primaryColor,
      });

      if (res.success && res.data) {
        setAgency(res.data as Agency);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Error al actualizar la configuración.");
      }
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
    
    const mapping: Record<string, string> = {
      "75%": "75%",
      "100%": "100%",
      "125%": "125%",
      "150%": "150%",
      "175%": "175%",
    };
    
    const appliedZoom = mapping[selectedZoom] || "100%";
    if (typeof document !== "undefined") {
      document.documentElement.style.zoom = appliedZoom;
      const scaleVal = parseFloat(appliedZoom) / 100;
      document.documentElement.style.setProperty("--zoom-scale", scaleVal.toString());
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>Configuración General</h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem" }}>Ajustes del concesionario y personalización del panel de administración.</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem", marginTop: "2rem", paddingBottom: "4rem" }}>
        
        {/* Integraciones Placeholder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <IntegrationsClient 
              initialVehicles={initialVehicles} 
              initialIntegrations={initialIntegrations} 
              initialPublications={initialPublications} 
              appId={appId}
              appUrl={appUrl}
              errorMsg={errorMsg}
              successMsg={successMsg}
            />
          </div>
        </div>

        <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "0 1rem" }} />

        {/* Dealership Details Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <form onSubmit={handleSaveAgency} style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0 }}>
            Información Comercial
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre de la Automotora *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Número de WhatsApp (Contacto de Clientes) *</label>
            <input
              type="text"
              required
              placeholder="Ej: +598 99 123 456"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem" }}
            />
            <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>Número telefónico al cual llegarán los leads desde el portal de clientes.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Color Principal en Showroom</label>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            {success ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontSize: "0.9rem", fontWeight: "600" }}>
                <CheckCircle size={16} /> ¡Configuración guardada!
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
        </div>

        <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "0 1rem" }} />

        {/* Email Domain Customization */}
        <EmailDomainSettings agencyId={agency.id} />

        <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "0 1rem" }} />

        {/* User Preferences Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Palette size={16} /> Preferencias del Panel
          </h3>

          {!mounted ? (
            <div style={{ opacity: 0.5, fontSize: "0.9rem", padding: "1rem 0" }}>Cargando preferencias...</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Tema de Color</label>
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
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Fondo de Pantalla</label>
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
                  <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Elegí el color base para el patrón animado. El mapa topográfico se mostrará por encima.</span>
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
        </div>

        <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "0 1rem" }} />

        {/* Organization Control */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={20} style={{ color: "var(--primary)" }} />
              Control de Organización
            </h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "-0.5rem" }}>
              Administra a las personas dentro de tu organización. Invita nuevos vendedores, gerentes o administradores, y asigna sus roles.
            </p>
            <UsersList agencyId={agency.id} initialUsers={initialUsers} />
          </div>
        </div>

        <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "0 1rem" }} />

        {/* Notificaciones Placeholder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Alertas y Comunicaciones
            </h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Configura qué eventos disparan correos electrónicos o mensajes de WhatsApp (ej. nuevos leads, vehículos vendidos).</p>
            <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "8px", opacity: 0.5 }}>
              Módulo en construcción
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
