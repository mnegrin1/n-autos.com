"use client";

import { useState, useTransition } from "react";
import styles from "./settings.module.css";
import { updateAgencySettings } from "@/actions/agencyActions";
import { Save, CheckCircle, Palette, HelpCircle } from "lucide-react";

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
}

export default function SettingsForm({ initialAgency }: SettingsFormProps) {
  const [agency, setAgency] = useState<Agency>(initialAgency);
  const [name, setName] = useState(agency.name);
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp || "");
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10b981");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("crm-theme") || "light";
    }
    return "light";
  });

  const [zoom, setZoom] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("crm-zoom") || "100%";
    }
    return "100%";
  });

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

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginTop: "1rem" }}>
        
        {/* Dealership Details Form */}
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

        {/* User Preferences Card */}
        <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Palette size={16} /> Preferencias del Panel
          </h3>

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
        </div>
      </div>
    </div>
  );
}
