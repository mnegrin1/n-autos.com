"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Monitor, Smartphone, Check, Upload, Image as ImageIcon, Sparkles, CheckCircle2, Search, Fuel, Shield, Zap, Award, Car, Phone, Clock, MapPin, Palette, Type } from "lucide-react";

interface AgencyData {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  primary_color?: string;
  font_family?: string;
  web_template?: string;
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  footer_text?: string;
  location_address?: string;
  business_hours?: string;
  contact_description?: string;
  about_text?: string;
  show_trust_section?: boolean;
  trust_pillar1_title?: string;
  trust_pillar1_desc?: string;
  trust_pillar2_title?: string;
  trust_pillar2_desc?: string;
  trust_pillar3_title?: string;
  trust_pillar3_desc?: string;
  trust_pillar4_title?: string;
  trust_pillar4_desc?: string;
}

interface VisualWebBuilderProps {
  agency: AgencyData;
  onSave: (updated: Partial<AgencyData>) => Promise<void>;
  autoSavingStatus: "idle" | "saving" | "saved" | "error";
}

const FONT_OPTIONS = [
  { id: "Inter", name: "Inter (Moderna & Equilibrada)", family: "'Inter', sans-serif" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Tech)", family: "'Plus Jakarta Sans', sans-serif" },
  { id: "Manrope", name: "Manrope (Ejecutiva)", family: "'Manrope', sans-serif" },
  { id: "Outfit", name: "Outfit (Geométrica)", family: "'Outfit', sans-serif" },
  { id: "Playfair Display", name: "Playfair Display (Editorial)", family: "'Playfair Display', serif" },
  { id: "Roboto", name: "Roboto (Limpia & Funcional)", family: "'Roboto', sans-serif" },
];

const COLOR_SWATCHES = [
  { name: "Verde Esmeralda", color: "#10B981" },
  { name: "Azul Ejecutivo", color: "#1E40AF" },
  { name: "Rojo Deportivo", color: "#DC2626" },
  { name: "Cobalto Tech", color: "#2563EB" },
  { name: "Ámbar Premium", color: "#D97706" },
  { name: "Violeta Modern", color: "#7C3AED" },
  { name: "Negro Profundo", color: "#111827" },
];

const COPY_SUGGESTIONS: Record<string, string[]> = {
  heroTitle: [
    "Encuentra tu próximo vehículo con garantía total",
    "Tu próximo auto te está esperando hoy",
    "Vehículos seleccionados con certificación de origen",
    "Conduce la excelencia: Calidad y confianza total"
  ],
  heroSubtitle: [
    "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.",
    "Transparencia absoluta, financiación flexible y asesoramiento especializado para tu compra.",
    "La mejor selección de seminuevos revisados en más de 100 puntos mecánicos."
  ],
  aboutText: [
    "Somos una automotora comprometida con la excelencia, la transparencia y la calidad. Ofrecemos vehículos seleccionados con certificación total, garantía y atención personalizada.",
    "Con años de trayectoria en el sector automotor, nos dedicamos a ofrecer vehículos minuciosamente inspeccionados y facilidades de pago a tu medida.",
    "En nuestro showroom encontrarás unidades exclusivas con historial transparente y la tranquilidad de un respaldo posventa integral."
  ]
};

const DEMO_VEHICLES = [
  {
    id: "demo-1",
    brand: "BMW",
    model: "M4 Competition Package",
    year: 2024,
    kms: 12000,
    price: "USD 128,500",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tag: "SELECCIONADO"
  },
  {
    id: "demo-2",
    brand: "Audi",
    model: "RS6 Avant Performance",
    year: 2023,
    kms: 18500,
    price: "USD 115,000",
    image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tag: "CERTIFICADO"
  },
  {
    id: "demo-3",
    brand: "Porsche",
    model: "911 Carrera S GTS",
    year: 2022,
    kms: 24000,
    price: "USD 145,000",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tag: "RESERVADO"
  }
];

export default function VisualWebBuilder({
  agency,
  onSave,
  autoSavingStatus
}: VisualWebBuilderProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [dragOverTarget, setDragOverTarget] = useState<"logo" | "cover" | null>(null);
  const [activeFocusField, setActiveFocusField] = useState<string | null>(null);

  // Local state for instant in-place editing
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10B981");
  const [fontFamily, setFontFamily] = useState(agency.font_family || "Inter");

  const [name, setName] = useState(agency.name || "");
  const [heroEyebrow, setHeroEyebrow] = useState(agency.hero_eyebrow || "AUTOMOTORA OFICIAL");
  const [heroTitle, setHeroTitle] = useState(agency.hero_title || "Encuentra tu próximo vehículo");
  const [heroSubtitle, setHeroSubtitle] = useState(agency.hero_subtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.");
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || "");
  const [coverUrl, setCoverUrl] = useState(agency.cover_url || "");
  const [aboutText, setAboutText] = useState(agency.about_text || "Somos una automotora comprometida con la excelencia, la transparencia y la calidad. Ofrecemos vehículos seleccionados con certificación total, garantía y atención personalizada.");
  const [footerText, setFooterText] = useState(agency.footer_text || "Tu concesionario de confianza. Vehículos seleccionados con certificación de origen, garantía y la mejor atención personalizada.");
  const [locationAddress, setLocationAddress] = useState(agency.location_address || "Av. Principal 1234, Montevideo, Uruguay");
  const [businessHours, setBusinessHours] = useState(agency.business_hours || "Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs");
  const [contactDescription, setContactDescription] = useState(agency.contact_description || "¿Tienes alguna duda sobre una unidad o deseas agendar una prueba de manejo? Escríbenos directamente o visita nuestro showroom.");
  const [showTrustSection, setShowTrustSection] = useState(agency.show_trust_section !== undefined ? agency.show_trust_section : true);

  // Trust pillars state
  const [p1Title, setP1Title] = useState(agency.trust_pillar1_title || "Garantía Certificada");
  const [p1Desc, setP1Desc] = useState(agency.trust_pillar1_desc || "Revisión mecánica rigurosa de 100 puntos.");
  const [p2Title, setP2Title] = useState(agency.trust_pillar2_title || "Financiación a Medida");
  const [p2Desc, setP2Desc] = useState(agency.trust_pillar2_desc || "Planes flexibles adaptados a tu presupuesto.");
  const [p3Title, setP3Title] = useState(agency.trust_pillar3_title || "Tomamos Tu Usado");
  const [p3Desc, setP3Desc] = useState(agency.trust_pillar3_desc || "Cotización justa e inmediata de tu unidad.");
  const [p4Title, setP4Title] = useState(agency.trust_pillar4_title || "Posventa Exclusiva");
  const [p4Desc, setP4Desc] = useState(agency.trust_pillar4_desc || "Atención y respaldo posterior a la entrega.");

  // Ref para debounce del color picker
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Diccionario de timers para guardar cambios con debounce sin pasar refs durante el render
  const debouncedTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleLiveInput = useCallback((key: keyof AgencyData, val: string, ms = 800) => {
    if (debouncedTimerRef.current[key]) {
      clearTimeout(debouncedTimerRef.current[key]);
    }
    debouncedTimerRef.current[key] = setTimeout(() => {
      onSave({ [key]: val.trim() } as Partial<AgencyData>);
    }, ms);
  }, [onSave]);

  // Refs para sincronizar innerText de contentEditable cuando el valor cambia externamente
  const heroEyebrowRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const aboutTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (heroEyebrowRef.current && document.activeElement !== heroEyebrowRef.current) {
      heroEyebrowRef.current.innerText = heroEyebrow;
    }
  }, [heroEyebrow]);

  useEffect(() => {
    if (heroTitleRef.current && document.activeElement !== heroTitleRef.current) {
      heroTitleRef.current.innerText = heroTitle;
    }
  }, [heroTitle]);

  useEffect(() => {
    if (heroSubtitleRef.current && document.activeElement !== heroSubtitleRef.current) {
      heroSubtitleRef.current.innerText = heroSubtitle;
    }
  }, [heroSubtitle]);

  useEffect(() => {
    if (aboutTextRef.current && document.activeElement !== aboutTextRef.current) {
      aboutTextRef.current.innerText = aboutText;
    }
  }, [aboutText]);

  const [prevAgency, setPrevAgency] = useState(agency);
  if (agency !== prevAgency) {
    setPrevAgency(agency);
    if (agency.primary_color) setPrimaryColor(agency.primary_color);
    if (agency.font_family) setFontFamily(agency.font_family);
    if (agency.name !== undefined) setName(agency.name);
    if (agency.logo_url !== undefined) setLogoUrl(agency.logo_url);
    if (agency.cover_url !== undefined) setCoverUrl(agency.cover_url);
    if (agency.footer_text !== undefined) setFooterText(agency.footer_text);
    if (agency.location_address !== undefined) setLocationAddress(agency.location_address);
    if (agency.business_hours !== undefined) setBusinessHours(agency.business_hours);
    if (agency.contact_description !== undefined) setContactDescription(agency.contact_description);
    if (agency.show_trust_section !== undefined) setShowTrustSection(agency.show_trust_section);
    if (agency.trust_pillar1_title) setP1Title(agency.trust_pillar1_title);
    if (agency.trust_pillar1_desc) setP1Desc(agency.trust_pillar1_desc);
    if (agency.trust_pillar2_title) setP2Title(agency.trust_pillar2_title);
    if (agency.trust_pillar2_desc) setP2Desc(agency.trust_pillar2_desc);
    if (agency.trust_pillar3_title) setP3Title(agency.trust_pillar3_title);
    if (agency.trust_pillar3_desc) setP3Desc(agency.trust_pillar3_desc);
    if (agency.trust_pillar4_title) setP4Title(agency.trust_pillar4_title);
    if (agency.trust_pillar4_desc) setP4Desc(agency.trust_pillar4_desc);
  }

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback((file: File, type: "logo" | "cover") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const val = e.target.result as string;
        if (type === "logo") {
          setLogoUrl(val);
          onSave({ logo_url: val });
        } else {
          setCoverUrl(val);
          onSave({ cover_url: val });
        }
      }
    };
    reader.readAsDataURL(file);
  }, [onSave]);

  const handleDrop = (e: React.DragEvent, type: "logo" | "cover") => {
    e.preventDefault();
    setDragOverTarget(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file, type);
    }
  };

  const applyCopySuggestion = (field: string, text: string) => {
    if (field === "heroTitle") {
      setHeroTitle(text);
      if (heroTitleRef.current) heroTitleRef.current.innerText = text;
      onSave({ hero_title: text });
    } else if (field === "heroSubtitle") {
      setHeroSubtitle(text);
      if (heroSubtitleRef.current) heroSubtitleRef.current.innerText = text;
      onSave({ hero_subtitle: text });
    } else if (field === "aboutText") {
      setAboutText(text);
      if (aboutTextRef.current) aboutTextRef.current.innerText = text;
      onSave({ about_text: text });
    }
    setActiveFocusField(null);
  };

  const handleExplicitSaveAll = () => {
    onSave({
      primary_color: primaryColor,
      font_family: fontFamily,
      hero_eyebrow: heroEyebrow,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      about_text: aboutText,
      footer_text: footerText,
      location_address: locationAddress,
      business_hours: businessHours,
      contact_description: contactDescription,
      show_trust_section: showTrustSection,
      trust_pillar1_title: p1Title,
      trust_pillar1_desc: p1Desc,
      trust_pillar2_title: p2Title,
      trust_pillar2_desc: p2Desc,
      trust_pillar3_title: p3Title,
      trust_pillar3_desc: p3Desc,
      trust_pillar4_title: p4Title,
      trust_pillar4_desc: p4Desc,
      logo_url: logoUrl,
      cover_url: coverUrl,
    });
  };

  const currentCover = coverUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  const activeAccent = primaryColor;
  const activeFontObj = FONT_OPTIONS.find(f => f.id === fontFamily) || FONT_OPTIONS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Roboto:wght@400;500;700&display=swap');
      `}} />

      {/* TOP CONTROL BAR: Device Preview & AutoSave Indicator */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "0.85rem 1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            ✨ Editor Visual del Portal
          </span>
          <span style={{
            fontSize: "0.75rem",
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
            fontWeight: 700,
            backgroundColor: autoSavingStatus === "saving" ? "#3b82f6" : autoSavingStatus === "saved" ? "#10b98122" : "var(--surface-hover)",
            color: autoSavingStatus === "saving" ? "#ffffff" : autoSavingStatus === "saved" ? "#10b981" : "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem"
          }}>
            {autoSavingStatus === "saving" && "💾 Guardando..."}
            {autoSavingStatus === "saved" && <><CheckCircle2 size={12} /> Guardado en vivo</>}
            {autoSavingStatus === "idle" && "Edición directa lista"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleExplicitSaveAll}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              backgroundColor: activeAccent,
              color: "#ffffff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Guardar Cambios
          </button>

          {/* Viewport Switcher */}
          <div style={{
            display: "flex",
            backgroundColor: "var(--bg-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "3px"
          }}>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: deviceMode === "desktop" ? 700 : 500,
                backgroundColor: deviceMode === "desktop" ? activeAccent : "transparent",
                color: deviceMode === "desktop" ? "white" : "var(--text-color)",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Monitor size={13} /> Escritorio
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: deviceMode === "mobile" ? 700 : 500,
                backgroundColor: deviceMode === "mobile" ? activeAccent : "transparent",
                color: deviceMode === "mobile" ? "white" : "var(--text-color)",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Smartphone size={13} /> Móvil
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Visual Style Customizer (Color & Typography) */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {/* Color Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-color)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Palette size={15} style={{ color: activeAccent }} /> Color Principal de Acento:
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                title={swatch.name}
                onClick={() => {
                  setPrimaryColor(swatch.color);
                  onSave({ primary_color: swatch.color });
                }}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: swatch.color,
                  border: primaryColor === swatch.color ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                  boxShadow: primaryColor === swatch.color ? `0 0 10px ${swatch.color}` : "none",
                  cursor: "pointer",
                  padding: 0
                }}
              />
            ))}

            {/* Custom Color Input */}
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryColor(val);
                if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                colorDebounceRef.current = setTimeout(() => {
                  onSave({ primary_color: val });
                }, 400);
              }}
              onBlur={(e) => {
                if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                onSave({ primary_color: e.target.value });
              }}
              title="Elegir color personalizado"
              style={{
                width: "28px",
                height: "28px",
                padding: 0,
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                backgroundColor: "transparent"
              }}
            />
          </div>
        </div>

        {/* Font Typography Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.85rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-color)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Type size={15} style={{ color: activeAccent }} /> Fuente Tipográfica del Sitio:
          </span>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {FONT_OPTIONS.map((font) => {
              const isSelected = fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    setFontFamily(font.id);
                    onSave({ font_family: font.id });
                  }}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontFamily: font.family,
                    fontWeight: isSelected ? 800 : 500,
                    border: isSelected ? `2px solid ${activeAccent}` : "1px solid var(--border-color)",
                    backgroundColor: isSelected ? "var(--surface-hover)" : "var(--surface-color)",
                    color: "var(--text-color)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  {isSelected && <Check size={13} style={{ color: activeAccent }} />}
                  {font.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageFile(f, "cover");
        }}
      />
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageFile(f, "logo");
        }}
      />

      {/* FULL PORTAL REPLICA CANVAS FRAME */}
      <div 
        style={{
          borderRadius: "16px",
          border: "2px solid var(--border-color)",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          backgroundColor: "#0b0f17",
          color: "#ffffff",
          fontFamily: activeFontObj.family,
          width: deviceMode === "mobile" ? "390px" : "100%",
          margin: "0 auto",
          transition: "width 0.3s ease"
        }}
      >
        {/* Browser Chrome Header */}
        <div style={{
          backgroundColor: "#161b22",
          padding: "0.5rem 0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ff5f56" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#27c93f" }} />
          </div>
          <div style={{ flex: 1, backgroundColor: "#0d1117", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", color: "#8b949e", fontFamily: "monospace" }}>
            🔒 https://{agency.subdomain || "mi-automotora"}.n-autos.com/
          </div>
        </div>

        {/* Live Portal Canvas Body */}
        <div style={{ maxHeight: "720px", overflowY: "auto", position: "relative" }}>
          
          {/* SECTION 1: HEADER NAVBAR */}
          <header style={{
            backgroundColor: "rgba(11, 15, 23, 0.95)",
            color: "#ffffff",
            padding: deviceMode === "mobile" ? "0.6rem 0.85rem" : "0.85rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
            position: "sticky",
            top: 0,
            zIndex: 30,
            backdropFilter: "blur(12px)"
          }}>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOverTarget("logo"); }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleDrop(e, "logo")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                position: "relative",
                padding: "0.2rem 0.5rem",
                borderRadius: "8px",
                border: dragOverTarget === "logo" ? `2px dashed ${activeAccent}` : "1px solid transparent"
              }}
            >
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ height: "36px", maxWidth: "140px", objectFit: "contain", borderRadius: "4px" }} />
                ) : !name.trim() ? (
                  <span style={{ fontSize: "1.2rem" }}>🚗</span>
                ) : null}

                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  title="Cambiar Logo (GIF, PNG, SVG, JPG)"
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-10px",
                    backgroundColor: activeAccent,
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
                  }}
                >
                  <Upload size={10} />
                </button>
              </div>

              {(name.trim() || !logoUrl) && (
                <span 
                  style={{
                    fontWeight: 800,
                    fontSize: deviceMode === "mobile" ? "0.95rem" : "1.1rem",
                    padding: "2px 4px",
                    color: "#ffffff"
                  }}
                >
                  {name.trim() || "Automotora VIP"}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: deviceMode === "mobile" ? "0.4rem" : "1rem", alignItems: "center", fontSize: "0.8rem", opacity: 0.85, fontWeight: 600 }}>
              {deviceMode !== "mobile" && (
                <>
                  <span>Inicio</span>
                  <span>Catálogo</span>
                  <span>Nosotros</span>
                  <span>Contacto</span>
                </>
              )}
              <span style={{ backgroundColor: "#25d366", color: "white", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 700, fontSize: "0.75rem" }}>WhatsApp</span>
            </div>
          </header>

          {/* SECTION 2: HERO BANNER */}
          <section style={{
            position: "relative",
            minHeight: deviceMode === "mobile" ? "280px" : "340px",
            backgroundImage: `linear-gradient(180deg, rgba(11, 15, 23, 0.75) 0%, rgba(11, 15, 23, 0.92) 100%), url('${currentCover}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: deviceMode === "mobile" ? "2.5rem 1rem" : "4rem 1.5rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.85rem",
            border: dragOverTarget === "cover" ? `3px dashed ${activeAccent}` : "none"
          }}>
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                color: activeAccent,
                border: `1px solid ${activeAccent}`,
                borderRadius: "8px",
                padding: "0.35rem 0.75rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                zIndex: 10
              }}
            >
              <ImageIcon size={13} /> 📸 Cambiar Fondo (GIF/PNG/SVG/JPG)
            </button>

            <div 
              ref={heroEyebrowRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleLiveInput("hero_eyebrow", e.currentTarget.innerText)}
              onBlur={(e) => {
                if (debouncedTimerRef.current["hero_eyebrow"]) clearTimeout(debouncedTimerRef.current["hero_eyebrow"]);
                const val = e.currentTarget.innerText.trim();
                setHeroEyebrow(val);
                onSave({ hero_eyebrow: val });
              }}
              style={{
                backgroundColor: `${activeAccent}22`,
                border: `1px solid ${activeAccent}`,
                color: activeAccent,
                padding: "0.3rem 0.85rem",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                cursor: "text",
                outline: "none"
              }}
              dangerouslySetInnerHTML={{ __html: heroEyebrow }}
            />

            {/* HERO TITLE WITH EDIT HIGHLIGHT & AI SUGGESTIONS */}
            <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h1 
                ref={heroTitleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveFocusField("heroTitle")}
                onInput={(e) => handleLiveInput("hero_title", e.currentTarget.innerText)}
                onBlur={(e) => {
                  if (debouncedTimerRef.current["hero_title"]) clearTimeout(debouncedTimerRef.current["hero_title"]);
                  const val = e.currentTarget.innerText.trim();
                  setHeroTitle(val);
                  onSave({ hero_title: val });
                }}
                style={{
                  fontSize: deviceMode === "mobile" ? "1.6rem" : "2.5rem",
                  fontFamily: activeFontObj.family,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: 0,
                  color: "#ffffff",
                  cursor: "text",
                  outline: activeFocusField === "heroTitle" ? `3px solid ${activeAccent}` : "none",
                  boxShadow: activeFocusField === "heroTitle" ? `0 0 18px ${activeAccent}` : "none",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  borderBottom: "2px dashed rgba(255,255,255,0.3)",
                  transition: "all 0.2s ease"
                }}
                dangerouslySetInnerHTML={{ __html: heroTitle }}
              />

              {activeFocusField === "heroTitle" && COPY_SUGGESTIONS.heroTitle && (
                <div style={{
                  position: "absolute",
                  top: "105%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: `2px solid ${activeAccent}`,
                  borderRadius: "14px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  zIndex: 40,
                  width: "90%",
                  maxWidth: "500px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  backdropFilter: "blur(10px)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontWeight: 800, color: activeAccent }}>
                    <span><Sparkles size={12} /> Sugerencias de Título Impactante (IA):</span>
                    <button type="button" onClick={() => setActiveFocusField(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {COPY_SUGGESTIONS.heroTitle.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyCopySuggestion("heroTitle", sug)}
                        style={{
                          textAlign: "left",
                          padding: "0.4rem 0.65rem",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        &quot;{sug}&quot;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* HERO SUBTITLE */}
            <div style={{ position: "relative", width: "100%", maxWidth: "700px" }}>
              <p 
                ref={heroSubtitleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveFocusField("heroSubtitle")}
                onInput={(e) => handleLiveInput("hero_subtitle", e.currentTarget.innerText)}
                onBlur={(e) => {
                  if (debouncedTimerRef.current["hero_subtitle"]) clearTimeout(debouncedTimerRef.current["hero_subtitle"]);
                  const val = e.currentTarget.innerText.trim();
                  setHeroSubtitle(val);
                  onSave({ hero_subtitle: val });
                }}
                style={{
                  fontSize: deviceMode === "mobile" ? "0.85rem" : "1.05rem",
                  color: "#cbd5e1",
                  margin: 0,
                  cursor: "text",
                  outline: activeFocusField === "heroSubtitle" ? `3px solid ${activeAccent}` : "none",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  borderBottom: "2px dashed rgba(255,255,255,0.3)"
                }}
                dangerouslySetInnerHTML={{ __html: heroSubtitle }}
              />
            </div>

            {/* Simulated Search Box */}
            <div style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              borderRadius: "12px",
              padding: "0.85rem",
              marginTop: "0.5rem",
              width: "100%",
              maxWidth: "680px",
              display: "flex",
              flexDirection: deviceMode === "mobile" ? "column" : "row",
              gap: "0.5rem"
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
                <Search size={14} style={{ opacity: 0.6 }} />
                <span>Buscar marca o modelo...</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
                  <Fuel size={14} style={{ opacity: 0.6 }} /> Combustible
                </div>
                <button type="button" style={{ backgroundColor: activeAccent, color: "white", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                  Buscar
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 3: FEATURED VEHICLES GRID */}
          <section style={{ backgroundColor: "#0b0f17", padding: "2.5rem 1.5rem", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em" }}>
                  CATÁLOGO EN VIVO
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>Vehículos Destacados</h2>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>3 unidades de prueba</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem"
            }}>
              {DEMO_VEHICLES.map((v) => (
                <div 
                  key={v.id}
                  style={{
                    backgroundColor: "#151d2a",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden" }}>
                    <img src={v.image} alt={v.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      backgroundColor: "rgba(0,0,0,0.75)",
                      color: "white",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px"
                    }}>
                      {v.tag}
                    </span>
                  </div>
                  <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>{v.brand} {v.model}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Año: {v.year} | {v.kms.toLocaleString()} km</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: activeAccent, marginTop: "0.3rem" }}>{v.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: SOBRE NOSOTROS */}
          <section style={{ backgroundColor: "#0f172a", padding: "2.5rem 1.5rem", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em" }}>
                TRANSPARENCIA & RESPALDO
              </span>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>Sobre {name || "la Automotora"}</h2>
              
              <div style={{ position: "relative" }}>
                <p
                  ref={aboutTextRef}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setActiveFocusField("aboutText")}
                  onInput={(e) => handleLiveInput("about_text", e.currentTarget.innerText)}
                  onBlur={(e) => {
                    if (debouncedTimerRef.current["about_text"]) clearTimeout(debouncedTimerRef.current["about_text"]);
                    const val = e.currentTarget.innerText.trim();
                    setAboutText(val);
                    onSave({ about_text: val });
                  }}
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "#cbd5e1",
                    margin: 0,
                    cursor: "text",
                    outline: activeFocusField === "aboutText" ? `3px solid ${activeAccent}` : "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    borderBottom: "2px dashed rgba(255,255,255,0.3)"
                  }}
                  dangerouslySetInnerHTML={{ __html: aboutText }}
                />
              </div>

              {/* TRUST PILLARS CARDS */}
              {showTrustSection && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "repeat(4, 1fr)",
                  gap: "0.85rem",
                  marginTop: "1.5rem",
                  textAlign: "left"
                }}>
                  <div style={{ backgroundColor: "#151d2a", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "10px", padding: "0.85rem" }}>
                    <Shield size={22} style={{ color: activeAccent, marginBottom: "0.4rem" }} />
                    <h4 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar1_title", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar1_title"]) clearTimeout(debouncedTimerRef.current["trust_pillar1_title"]);
                        const v = e.currentTarget.innerText.trim(); setP1Title(v); onSave({ trust_pillar1_title: v });
                      }}
                      style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#ffffff", outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p1Title }}
                    />
                    <p 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar1_desc", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar1_desc"]) clearTimeout(debouncedTimerRef.current["trust_pillar1_desc"]);
                        const v = e.currentTarget.innerText.trim(); setP1Desc(v); onSave({ trust_pillar1_desc: v });
                      }}
                      style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0, outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p1Desc }}
                    />
                  </div>

                  <div style={{ backgroundColor: "#151d2a", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "10px", padding: "0.85rem" }}>
                    <Zap size={22} style={{ color: activeAccent, marginBottom: "0.4rem" }} />
                    <h4 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar2_title", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar2_title"]) clearTimeout(debouncedTimerRef.current["trust_pillar2_title"]);
                        const v = e.currentTarget.innerText.trim(); setP2Title(v); onSave({ trust_pillar2_title: v });
                      }}
                      style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#ffffff", outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p2Title }}
                    />
                    <p 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar2_desc", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar2_desc"]) clearTimeout(debouncedTimerRef.current["trust_pillar2_desc"]);
                        const v = e.currentTarget.innerText.trim(); setP2Desc(v); onSave({ trust_pillar2_desc: v });
                      }}
                      style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0, outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p2Desc }}
                    />
                  </div>

                  <div style={{ backgroundColor: "#151d2a", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "10px", padding: "0.85rem" }}>
                    <Car size={22} style={{ color: activeAccent, marginBottom: "0.4rem" }} />
                    <h4 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar3_title", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar3_title"]) clearTimeout(debouncedTimerRef.current["trust_pillar3_title"]);
                        const v = e.currentTarget.innerText.trim(); setP3Title(v); onSave({ trust_pillar3_title: v });
                      }}
                      style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#ffffff", outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p3Title }}
                    />
                    <p 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar3_desc", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar3_desc"]) clearTimeout(debouncedTimerRef.current["trust_pillar3_desc"]);
                        const v = e.currentTarget.innerText.trim(); setP3Desc(v); onSave({ trust_pillar3_desc: v });
                      }}
                      style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0, outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p3Desc }}
                    />
                  </div>

                  <div style={{ backgroundColor: "#151d2a", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "10px", padding: "0.85rem" }}>
                    <Award size={22} style={{ color: activeAccent, marginBottom: "0.4rem" }} />
                    <h4 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar4_title", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar4_title"]) clearTimeout(debouncedTimerRef.current["trust_pillar4_title"]);
                        const v = e.currentTarget.innerText.trim(); setP4Title(v); onSave({ trust_pillar4_title: v });
                      }}
                      style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#ffffff", outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p4Title }}
                    />
                    <p 
                      contentEditable 
                      suppressContentEditableWarning
                      onInput={(e) => handleLiveInput("trust_pillar4_desc", e.currentTarget.innerText)}
                      onBlur={(e) => {
                        if (debouncedTimerRef.current["trust_pillar4_desc"]) clearTimeout(debouncedTimerRef.current["trust_pillar4_desc"]);
                        const v = e.currentTarget.innerText.trim(); setP4Desc(v); onSave({ trust_pillar4_desc: v });
                      }}
                      style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0, outline: "none" }}
                      dangerouslySetInnerHTML={{ __html: p4Desc }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: CONTACT & FOOTER */}
          <footer style={{ backgroundColor: "#0b0f17", padding: "2rem 1.5rem", borderTop: `1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ display: "flex", flexDirection: deviceMode === "mobile" ? "column" : "row", justifyContent: "space-between", gap: "1.5rem" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>{name || "Automotora VIP"}</div>
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleLiveInput("footer_text", e.currentTarget.innerText)}
                  onBlur={(e) => {
                    if (debouncedTimerRef.current["footer_text"]) clearTimeout(debouncedTimerRef.current["footer_text"]);
                    const v = e.currentTarget.innerText.trim(); setFooterText(v); onSave({ footer_text: v });
                  }}
                  style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0, outline: "none" }}
                  dangerouslySetInnerHTML={{ __html: footerText }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem", color: "#cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <MapPin size={13} style={{ color: activeAccent }} />
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleLiveInput("location_address", e.currentTarget.innerText)}
                    onBlur={(e) => {
                      if (debouncedTimerRef.current["location_address"]) clearTimeout(debouncedTimerRef.current["location_address"]);
                      const v = e.currentTarget.innerText.trim(); setLocationAddress(v); onSave({ location_address: v });
                    }}
                    style={{ outline: "none" }}
                    dangerouslySetInnerHTML={{ __html: locationAddress }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Clock size={13} style={{ color: activeAccent }} />
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleLiveInput("business_hours", e.currentTarget.innerText)}
                    onBlur={(e) => {
                      if (debouncedTimerRef.current["business_hours"]) clearTimeout(debouncedTimerRef.current["business_hours"]);
                      const v = e.currentTarget.innerText.trim(); setBusinessHours(v); onSave({ business_hours: v });
                    }}
                    style={{ outline: "none" }}
                    dangerouslySetInnerHTML={{ __html: businessHours }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "1.5rem", paddingTop: "1rem", fontSize: "0.72rem", color: "#64748b", textAlign: "center" }}>
              © {new Date().getFullYear()} {name || "Automotora"}. Todos los derechos reservados.
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
