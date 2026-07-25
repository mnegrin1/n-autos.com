"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./settings.module.css";
import { updateAgencySettings } from "@/actions/agencyActions";
import { Save, CheckCircle, Palette, Users, Settings as SettingsIcon, Globe, Sparkles, Monitor, Smartphone, LayoutGrid, Check } from "lucide-react";
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

const COPY_PRESETS = [
  {
    id: "comercial",
    icon: "🔥",
    name: "Comercial & Oportunidades",
    eyebrow: "OPORTUNIDADES DE LA SEMANA",
    title: "Tu Próximo Vehículo con Entrega Inmediata",
    subtitle: "Explora nuestro inventario con certificación de origen, opciones de financiación inmediata y la mejor cotización por tu usado."
  },
  {
    id: "lujo",
    icon: "💎",
    name: "Premium & Alta Gama",
    eyebrow: "CONCESIONARIO EXCLUSIVO",
    title: "Experiencia Automotriz de Clase Mundial",
    subtitle: "Diseño, innovación y elegancia sin concesiones. Descubre una colección seleccionada de unidades de alta gama."
  },
  {
    id: "confianza",
    icon: "🛡️",
    name: "Garantía & Confianza",
    eyebrow: "100% TRANSPARENCIA GARANTIZADA",
    title: "Comprar Tu Auto Nunca Fue Tan Seguro",
    subtitle: "Unidades con verificación mecánica rigurosa, historial documentado y respaldo posventa para conducir con total tranquilidad."
  },
  {
    id: "deportivo",
    icon: "⚡",
    name: "Deportivo & Performance",
    eyebrow: "SIENTE LA POTENCIA",
    title: "Desempeño y Emoción en Cada Kilómetro",
    subtitle: "Modelos deportivos y de alto rendimiento preparados para llevar tus sensaciones al límite. Agenda tu prueba de manejo hoy."
  }
];

const WEB_TEMPLATES = [
  {
    id: "standard",
    name: "1. Estándar Funcional",
    badge: "BÁSICO",
    badgeColor: "#64748b",
    desc: "Diseño clásico, sobrio y directo sin artificios. Ideal si buscas un catálogo simple, enfocado en mostrar las unidades con claridad.",
    accent: "#475569"
  },
  {
    id: "glassmorphism",
    name: "2. Glassmorphism Showcase",
    badge: "PREMIUM ⭐",
    badgeColor: "#10b981",
    desc: "Efectos de cristal translúcido (frosted glass), resplandores de neón ambient y badges flotantes. Estética futurista e impactante.",
    accent: "#10b981"
  },
  {
    id: "luxury",
    name: "3. Luxury Executive Dark",
    badge: "PREMIUM ⭐",
    badgeColor: "#f59e0b",
    desc: "Fondo oscuro obsidian con destellos metálicos y dorados. Transmite máxima distinción, elegancia y exclusividad de alta gama.",
    accent: "#f59e0b"
  },
  {
    id: "sport",
    name: "4. Sport Racing & Dynamic",
    badge: "PREMIUM ⭐",
    badgeColor: "#ef4444",
    desc: "Inspirado en marcas súper deportivas. Tipografías audaces, tarjetas con acentos rojos/neón y badges de alto dinamismo.",
    accent: "#ef4444"
  },
  {
    id: "tech",
    name: "5. Minimal Tech (Apple/Tesla Vibe)",
    badge: "PREMIUM ⭐",
    badgeColor: "#06b6d4",
    desc: "Estética Tesla/Apple hiperlimpia. Enfoque directo en la fotografía, bordes refinados, tipografía geométrica y gran elegancia.",
    accent: "#06b6d4"
  },
  {
    id: "editorial",
    name: "6. Editorial Motors Magazine",
    badge: "PREMIUM ⭐",
    badgeColor: "#8b5cf6",
    desc: "Layout estilo revista automotriz de lujo. Encabezados asimétricos con personalidad, badges editoriales y presencia visual.",
    accent: "#8b5cf6"
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
  const [agency, setAgency] = useState<Agency>(initialAgency);
  const [name, setName] = useState(agency.name);
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp || "");
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10b981");

  // Web Template & Copy state
  const [webTemplate, setWebTemplate] = useState(agency.web_template || "standard");
  const [heroEyebrow, setHeroEyebrow] = useState(agency.hero_eyebrow || "AUTOMOTORA OFICIAL");
  const [heroTitle, setHeroTitle] = useState(agency.hero_title || "Encuentra tu próximo vehículo");
  const [heroSubtitle, setHeroSubtitle] = useState(agency.hero_subtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.");

  // Preview Mode State
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

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
  }, [agency.primary_color]);

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    startTransition(async () => {
      const res = await updateAgencySettings(agency.id, {
        name,
        whatsapp,
        primary_color: primaryColor,
        web_template: webTemplate,
        hero_eyebrow: heroEyebrow,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
      });

      if (res && res.data) {
        setAgency(res.data as Agency);
      } else {
        setAgency(prev => ({ 
          ...prev, 
          name, 
          whatsapp, 
          primary_color: primaryColor,
          web_template: webTemplate,
          hero_eyebrow: heroEyebrow,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle
        }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  const applyCopyPreset = (preset: typeof COPY_PRESETS[0]) => {
    setHeroEyebrow(preset.eyebrow);
    setHeroTitle(preset.title);
    setHeroSubtitle(preset.subtitle);
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
    if (typeof document !== "undefined") {
      const mapping: Record<string, string> = {
        "75%": "75%",
        "100%": "100%",
        "125%": "125%",
        "150%": "150%",
        "175%": "175%",
      };
      const appliedZoom = mapping[selectedZoom] || "100%";
      document.documentElement.style.zoom = appliedZoom;
      const scaleVal = parseFloat(appliedZoom) / 100;
      document.documentElement.style.setProperty("--zoom-scale", scaleVal.toString());
    }
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Banner Superior Unificado sin esquinas redondeadas */}
      <div className={styles.topBanner}>
        <div>
          <h1 className={styles.bannerTitle}>Configuración del Sistema</h1>
          <p className={styles.bannerSub}>Ajustes del concesionario, diseño del sitio web y personalización del panel.</p>
        </div>
      </div>

      {/* Contenido centrado en un bloque sólido desplazable */}
      <div className={styles.centeredWrapper}>
        <div className={styles.singleSolidBlock}>
          
          {/* 1. Integraciones */}
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

          <div className={styles.sectionDivider} />

          {/* Formulario Principal de Configuración Comercial y Web */}
          <form onSubmit={handleSaveAgency} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* 2. Información Comercial */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <SettingsIcon size={18} style={{ color: "var(--primary)" }} /> Información Comercial
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
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Color Principal de Marca (Showroom)</label>
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
            </div>

            <div className={styles.sectionDivider} style={{ margin: 0 }} />

            {/* 3. Selección del Estilo de Página Web */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Globe size={18} style={{ color: "var(--primary)" }} /> Tipo de Página Web & Plantilla de Showroom
                </h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem", marginBottom: 0 }}>
                  Selecciona el estilo visual que mejor defina a tu automotora. Tienes 1 diseño estándar sin artificios y 5 diseños premium de alta gama.
                </p>
              </div>

              {/* Grid de 6 Plantillas (1 estándar + 5 premium) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                {WEB_TEMPLATES.map((tmpl) => {
                  const isSelected = webTemplate === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setWebTemplate(tmpl.id)}
                      style={{
                        position: "relative",
                        border: isSelected ? `2px solid ${tmpl.accent}` : "1px solid var(--border-color)",
                        backgroundColor: isSelected ? "var(--surface-hover)" : "var(--bg-color)",
                        borderRadius: "12px",
                        padding: "1.25rem",
                        cursor: "pointer",
                        transition: "all 0.25 ease",
                        boxShadow: isSelected ? `0 0 16px ${tmpl.accent}33` : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: tmpl.badgeColor, color: "white" }}>
                          {tmpl.badge}
                        </span>
                        {isSelected && (
                          <span style={{ backgroundColor: tmpl.accent, color: "white", borderRadius: "50%", padding: "2px", display: "inline-flex" }}>
                            <Check size={14} />
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "0.98rem", fontWeight: 700 }}>{tmpl.name}</h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7, lineHeight: 1.4 }}>{tmpl.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.sectionDivider} style={{ margin: 0 }} />

            {/* 4. Textos y Copywriting Comercial */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={18} style={{ color: "var(--primary)" }} /> Copywriting de la Página Principal (Ventas & Banner)
                </h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem", marginBottom: 0 }}>
                  Personaliza los textos persuasivos de tu portal de ventas. Puedes redactar tus propios textos o aplicar una plantilla rápida de 1 clic.
                </p>
              </div>

              {/* Botonera de Presets de Copy */}
              <div style={{ backgroundColor: "var(--surface-hover)", padding: "1rem", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)" }}>
                  🪄 Plantillas de Copywriting Comercial Rápidas (1 Clic):
                </span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {COPY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyCopyPreset(preset)}
                      style={{
                        backgroundColor: "var(--surface-color)",
                        border: "1px solid var(--border-color)",
                        padding: "0.5rem 0.85rem",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "var(--text-color)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span>{preset.icon}</span> {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input: Eyebrow Copy */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  Título Superior / Badge Eyebrow <span style={{ opacity: 0.5, fontWeight: 400 }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: OPORTUNIDADES SELECCIONADAS DE LA SEMANA"
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem" }}
                />
              </div>

              {/* Input: Título Principal */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Título Principal del Hero (Encabezado *)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Encuentra tu próximo vehículo"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem" }}
                />
              </div>

              {/* Input: Copy de Ventas */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Descripción Comercial / Copy de Ventas *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escribe la propuesta de valor de tu automotora..."
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontSize: "0.9rem", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Previsualizador en Tiempo Real (Desktop & Mobile) */}
              <div style={{ marginTop: "1rem", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", backgroundColor: "#0f172a", color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", backgroundColor: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <LayoutGrid size={15} /> Vista Previa en Tiempo Real ({webTemplate.toUpperCase()})
                  </span>
                  
                  <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("desktop")}
                      style={{
                        backgroundColor: previewMode === "desktop" ? primaryColor : "transparent",
                        color: "white",
                        border: "none",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("mobile")}
                      style={{
                        backgroundColor: previewMode === "mobile" ? primaryColor : "transparent",
                        color: "white",
                        border: "none",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <Smartphone size={14} /> Móvil
                    </button>
                  </div>
                </div>

                {/* Simulated Canvas */}
                <div style={{ padding: "1rem", display: "flex", justifyContent: "center", background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)" }}>
                  <div 
                    style={{ 
                      width: previewMode === "mobile" ? "340px" : "100%", 
                      maxWidth: "100%",
                      transition: "all 0.3s ease",
                      border: previewMode === "mobile" ? "6px solid #334155" : "none",
                      borderRadius: previewMode === "mobile" ? "24px" : "8px",
                      overflow: "hidden",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                      backgroundColor: webTemplate === "luxury" ? "#0a0a0c" : webTemplate === "sport" ? "#0d1117" : "#1e293b",
                      padding: previewMode === "mobile" ? "1.5rem 1rem" : "2.5rem 2rem",
                      textAlign: webTemplate === "editorial" ? "left" : "center",
                      color: "white"
                    }}
                  >
                    {heroEyebrow && (
                      <span 
                        style={{ 
                          display: "inline-block", 
                          fontSize: "0.68rem", 
                          fontWeight: 800, 
                          textTransform: "uppercase", 
                          letterSpacing: "0.1em", 
                          padding: "0.25rem 0.75rem", 
                          borderRadius: "999px",
                          marginBottom: "0.75rem",
                          backgroundColor: webTemplate === "glassmorphism" ? "rgba(255,255,255,0.15)" : primaryColor,
                          color: "white",
                          backdropFilter: "blur(6px)"
                        }}
                      >
                        {heroEyebrow}
                      </span>
                    )}

                    <h2 
                      style={{ 
                        fontSize: previewMode === "mobile" ? "1.4rem" : "2rem", 
                        fontWeight: 800, 
                        lineHeight: 1.15, 
                        margin: "0 0 0.75rem 0",
                        color: webTemplate === "luxury" ? "#fef08a" : "white"
                      }}
                    >
                      {heroTitle || "Encuentra tu próximo vehículo"}
                    </h2>

                    <p 
                      style={{ 
                        fontSize: previewMode === "mobile" ? "0.82rem" : "0.95rem", 
                        opacity: 0.8, 
                        lineHeight: 1.5, 
                        margin: "0 auto 1.5rem auto",
                        maxWidth: "600px"
                      }}
                    >
                      {heroSubtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro."}
                    </p>

                    {/* Simulación rápida de buscador */}
                    <div style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", padding: "0.5rem", borderRadius: "10px", display: "flex", gap: "0.5rem", flexDirection: previewMode === "mobile" ? "column" : "row" }}>
                      <input 
                        type="text" 
                        readOnly 
                        placeholder="Buscar marca o modelo..." 
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "0.4rem 0.75rem", color: "white", fontSize: "0.75rem" }} 
                      />
                      <button 
                        type="button" 
                        style={{ backgroundColor: primaryColor, color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}
                      >
                        Buscar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Botón de Guardado del Formulario Comercial & Web */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              {success ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontSize: "0.9rem", fontWeight: "600" }}>
                  <CheckCircle size={16} /> ¡Configuración y diseño guardados!
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

          <div className={styles.sectionDivider} />

          {/* 5. Personalización de Dominio Email */}
          <EmailDomainSettings agencyId={agency.id} />

          <div className={styles.sectionDivider} />

          {/* 6. Preferencias del Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Palette size={18} style={{ color: "var(--primary)" }} /> Preferencias del Panel de Control
            </h3>

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

          <div className={styles.sectionDivider} />

          {/* 7. Control de Organización */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--primary)" }} /> Control de Organización
            </h3>
            <p style={{ opacity: 0.7, fontSize: "0.88rem", marginTop: "-0.5rem" }}>
              Administra a las personas dentro de tu organización. Invita nuevos vendedores, gerentes o administradores.
            </p>
            <UsersList agencyId={agency.id} initialUsers={initialUsers} />
          </div>

        </div>
      </div>
    </div>
  );
}
