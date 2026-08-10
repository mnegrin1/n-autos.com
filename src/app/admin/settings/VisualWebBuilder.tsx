"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Monitor, Smartphone, Check, Upload, Image as ImageIcon, Sparkles, CheckCircle2, XCircle, Search, Fuel, Shield, Zap, Award, Car, Phone, Clock, MapPin, Info, Eye, EyeOff, Palette, Sun, Moon, Lightbulb } from "lucide-react";

interface AgencyData {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  primary_color?: string;
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

const TEMPLATES = [
  { id: "executive", name: "Executive Motors", defaultAccent: "#17212F", fontClass: "tmpl-executive", bg: "#ffffff", desc: "Corporativo sobrio (Manrope + Inter)" },
  { id: "performance", name: "Black Performance", defaultAccent: "#FF3B30", fontClass: "tmpl-performance", bg: "#0B0C0E", desc: "Deportivo & potente (Sora + Inter)" },
  { id: "scandinavian", name: "Scandinavian Auto", defaultAccent: "#33443C", fontClass: "tmpl-scandinavian", bg: "#FAFAF8", desc: "Minimalista luminoso (DM Sans)" },
  { id: "heritage", name: "Heritage Automotive", defaultAccent: "#8A3024", fontClass: "tmpl-heritage", bg: "#F4F0E8", desc: "Tradición & editorial (Libre Baskerville)" },
  { id: "urban", name: "Urban Drive", defaultAccent: "#5B4FFF", fontClass: "tmpl-urban", bg: "#F7F8FA", desc: "Digital & joven (Plus Jakarta Sans)" },
  { id: "local-trust", name: "Local Trust", defaultAccent: "#164E63", fontClass: "tmpl-local-trust", bg: "#ffffff", desc: "Cercanía & WhatsApp (Nunito Sans)" },
];

const COLOR_SWATCHES = [
  { name: "Azul Ejecutivo", color: "#17212F" },
  { name: "Rojo Performance", color: "#FF3B30" },
  { name: "Verde Escandinavo", color: "#33443C" },
  { name: "Vino Heritage", color: "#8A3024" },
  { name: "Violeta Urban", color: "#5B4FFF" },
  { name: "Azul Petróleo Trust", color: "#164E63" },
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
  const [previewModeTheme, setPreviewModeTheme] = useState<"dark" | "light">("dark");
  const [dragOverTarget, setDragOverTarget] = useState<"logo" | "cover" | null>(null);
  const [activeFocusField, setActiveFocusField] = useState<string | null>(null);

  // Local state for instant in-place editing
  const [webTemplate, setWebTemplate] = useState(agency.web_template || "standard");
  const activeTmpl = TEMPLATES.find(t => t.id === webTemplate) || TEMPLATES[0];

  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || activeTmpl.defaultAccent);
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

  // BUG2 FIX: Ref para debounce del color picker
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs de debounce individuales por campo contentEditable (para onInput live save)
  const eyebrowDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aboutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BUG1 FIX: Refs para sincronizar innerText de contentEditable cuando el valor cambia externamente
  const heroEyebrowRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const aboutTextRef = useRef<HTMLParagraphElement>(null);

  // Helper: crea un handler onInput con debounce de 800ms que guarda en el servidor
  // El onBlur (flush inmediato) se agrega por separado en cada elemento
  const makeDebouncedSave = useCallback(
    (debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>, setter: (val: string) => void, key: keyof AgencyData, ms = 800) =>
      (e: React.FormEvent<HTMLElement>) => {
        const val = e.currentTarget.innerText;
        setter(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onSave({ [key]: val.trim() } as Partial<AgencyData>);
        }, ms);
      },
    [onSave]
  );

  // BUG1 FIX: Sincronizar innerText de contentEditable cuando el valor cambia desde afuera (Copy AI, prop updates)
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

  // Sincronizar SOLO campos que no son contentEditable (template, color, logo, cover, trust pillars):
  // Estos no tienen el problema de sobreescribir el DOM del usuario porque el usuario los cambia
  // a través de botones/pickers, no escribiendo directamente.
  useEffect(() => { setWebTemplate(agency.web_template || "standard"); }, [agency.web_template]);
  useEffect(() => { setPrimaryColor(agency.primary_color || activeTmpl.defaultAccent); }, [agency.primary_color]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setName(agency.name || ""); }, [agency.name]);
  useEffect(() => { setLogoUrl(agency.logo_url || ""); }, [agency.logo_url]);
  useEffect(() => { setCoverUrl(agency.cover_url || ""); }, [agency.cover_url]);
  useEffect(() => { setFooterText(agency.footer_text || "Tu concesionario de confianza. Vehículos seleccionados con certificación de origen, garantía y la mejor atención personalizada."); }, [agency.footer_text]);
  useEffect(() => { setLocationAddress(agency.location_address || "Av. Principal 1234, Montevideo, Uruguay"); }, [agency.location_address]);
  useEffect(() => { setBusinessHours(agency.business_hours || "Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs"); }, [agency.business_hours]);
  useEffect(() => { setContactDescription(agency.contact_description || "¿Tienes alguna duda sobre una unidad o deseas agendar una prueba de manejo? Escríbenos directamente o visita nuestro showroom."); }, [agency.contact_description]);
  useEffect(() => { if (agency.show_trust_section !== undefined) setShowTrustSection(agency.show_trust_section); }, [agency.show_trust_section]);
  useEffect(() => { if (agency.trust_pillar1_title) setP1Title(agency.trust_pillar1_title); }, [agency.trust_pillar1_title]);
  useEffect(() => { if (agency.trust_pillar1_desc) setP1Desc(agency.trust_pillar1_desc); }, [agency.trust_pillar1_desc]);
  useEffect(() => { if (agency.trust_pillar2_title) setP2Title(agency.trust_pillar2_title); }, [agency.trust_pillar2_title]);
  useEffect(() => { if (agency.trust_pillar2_desc) setP2Desc(agency.trust_pillar2_desc); }, [agency.trust_pillar2_desc]);
  useEffect(() => { if (agency.trust_pillar3_title) setP3Title(agency.trust_pillar3_title); }, [agency.trust_pillar3_title]);
  useEffect(() => { if (agency.trust_pillar3_desc) setP3Desc(agency.trust_pillar3_desc); }, [agency.trust_pillar3_desc]);
  useEffect(() => { if (agency.trust_pillar4_title) setP4Title(agency.trust_pillar4_title); }, [agency.trust_pillar4_title]);
  useEffect(() => { if (agency.trust_pillar4_desc) setP4Desc(agency.trust_pillar4_desc); }, [agency.trust_pillar4_desc]);

  // Para los campos contentEditable (heroEyebrow, heroTitle, heroSubtitle, aboutText),
  // la sincronización con el DOM se hace EXCLUSIVAMENTE a través de los useEffects individuales
  // de BUG1 (arriba). El estado local se actualiza via onInput. NO usamos un useEffect masivo
  // que los sobreescriba, para no pisar ediciones del usuario en curso.

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
      onSave({ hero_title: text });
    } else if (field === "heroSubtitle") {
      setHeroSubtitle(text);
      onSave({ hero_subtitle: text });
    } else if (field === "aboutText") {
      setAboutText(text);
      onSave({ about_text: text });
    }
    setActiveFocusField(null);
  };

  const handleExplicitSaveAll = () => {
    onSave({
      web_template: webTemplate,
      primary_color: primaryColor,
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
  const activeAccent = primaryColor || activeTmpl.defaultAccent;

  // Helper for Hero Title Template Styles
  const getHeroTitleStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontSize: deviceMode === "mobile" ? "1.6rem" : (webTemplate === "heritage" ? "3.1rem" : "2.5rem"),
      lineHeight: 1.1,
      margin: 0,
      cursor: "text",
      outline: activeFocusField === "heroTitle" ? `3px solid ${activeAccent}` : "none",
      boxShadow: activeFocusField === "heroTitle" ? `0 0 18px ${activeAccent}` : "none",
      borderRadius: "6px",
      padding: "2px 6px",
      borderBottom: "2px dashed rgba(255,255,255,0.3)",
      transition: "all 0.2s ease"
    };

    if (webTemplate === "performance" || webTemplate === "sport") {
      return {
        ...base,
        fontFamily: "'Sora', sans-serif",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "-0.045em",
        color: "#ffffff",
        textShadow: `0 4px 15px rgba(255, 59, 48, 0.4)`
      };
    }

    if (webTemplate === "heritage" || webTemplate === "editorial") {
      return {
        ...base,
        fontFamily: "'Libre Baskerville', Georgia, serif",
        fontWeight: 700,
        color: "#24211D"
      };
    }

    if (webTemplate === "scandinavian" || webTemplate === "tech") {
      return {
        ...base,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.045em",
        color: "#20221F"
      };
    }

    if (webTemplate === "urban" || webTemplate === "glassmorphism") {
      return {
        ...base,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.045em",
        color: "#111827"
      };
    }

    if (webTemplate === "local-trust" || webTemplate === "luxury" || webTemplate === "local") {
      return {
        ...base,
        fontFamily: "'Nunito Sans', sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "#164E63"
      };
    }

    return {
      ...base,
      fontFamily: "'Manrope', sans-serif",
      fontWeight: 600,
      letterSpacing: "-0.035em",
      color: "#111318"
    };
  };

  const THEME_CANVAS_STYLES: Record<string, { bg: string; text: string; cardBg: string; border: string }> = {
    executive: { bg: "#FFFFFF", text: "#111318", cardBg: "#FFFFFF", border: "#E4E7EB" },
    performance: { bg: "#0B0C0E", text: "#F5F5F5", cardBg: "#151619", border: "#24262B" },
    scandinavian: { bg: "#FAFAF8", text: "#20221F", cardBg: "transparent", border: "transparent" },
    heritage: { bg: "#F4F0E8", text: "#24211D", cardBg: "#FCFAF5", border: "#D8D1C5" },
    urban: { bg: "#F7F8FA", text: "#111827", cardBg: "#FFFFFF", border: "#EAECF0" },
    "local-trust": { bg: "#FFFFFF", text: "#1E293B", cardBg: "#FFFFFF", border: "#E2E8F0" },
  };

  const activeCanvas = THEME_CANVAS_STYLES[webTemplate] || THEME_CANVAS_STYLES.executive;
  const canvasBg = previewModeTheme === "light" ? (webTemplate === "performance" ? "#0B0C0E" : activeCanvas.bg) : activeCanvas.bg;
  const canvasTextColor = activeCanvas.text;
  const cardBg = activeCanvas.cardBg;
  const cardBorder = activeCanvas.border;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", position: "relative" }}>
      {/* High-Specificity CSS rules for 100% Template Font Enforcement */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700;800;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600;700;800&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Sora:wght@400;600;700;800&display=swap');
        
        .tmpl-executive, .tmpl-executive h1, .tmpl-executive h2, .tmpl-executive h3, .tmpl-executive h4 {
          font-family: 'Manrope', sans-serif !important;
        }
        .tmpl-performance, .tmpl-performance h1, .tmpl-performance h2, .tmpl-performance h3, .tmpl-performance h4 {
          font-family: 'Sora', sans-serif !important;
          text-transform: uppercase;
        }
        .tmpl-scandinavian, .tmpl-scandinavian h1, .tmpl-scandinavian h2, .tmpl-scandinavian h3, .tmpl-scandinavian h4 {
          font-family: 'DM Sans', sans-serif !important;
        }
        .tmpl-heritage, .tmpl-heritage h1, .tmpl-heritage h2, .tmpl-heritage h3, .tmpl-heritage h4 {
          font-family: 'Libre Baskerville', Georgia, serif !important;
        }
        .tmpl-urban, .tmpl-urban h1, .tmpl-urban h2, .tmpl-urban h3, .tmpl-urban h4 {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .tmpl-local-trust, .tmpl-local-trust h1, .tmpl-local-trust h2, .tmpl-local-trust h3, .tmpl-local-trust h4 {
          font-family: 'Nunito Sans', sans-serif !important;
        }
      `}} />

      {/* Visual Editor Controls Bar */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1rem 1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            backgroundColor: `${activeAccent}20`,
            color: activeAccent,
            padding: "0.55rem",
            borderRadius: "10px",
            display: "flex"
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Editor Visual Live 1:1</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.7 }}>Haz clic sobre cualquier texto para editar y ver sugerencias de Copy AI 💡.</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Explicit Save Button */}
          <button
            type="button"
            onClick={handleExplicitSaveAll}
            style={{
              padding: "0.45rem 0.95rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              border: "none",
              backgroundColor: "var(--primary)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 3px 10px rgba(16, 185, 129, 0.3)"
            }}
          >
            <CheckCircle2 size={15} /> Guardar Cambios Web
          </button>

          {/* Toggle Section "Nuestro Compromiso" */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !showTrustSection;
              setShowTrustSection(nextVal);
              onSave({ show_trust_section: nextVal });
            }}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "1px solid var(--border-color)",
              backgroundColor: showTrustSection ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: showTrustSection ? "#10b981" : "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            {showTrustSection ? <Eye size={14} /> : <EyeOff size={14} />}
            {showTrustSection ? "Sección Compromiso: Visible" : "Sección Compromiso: Oculta"}
          </button>

          {/* Light / Dark Mode Preview Toggle */}
          <div style={{ display: "flex", gap: "2px", backgroundColor: "var(--bg-color)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => setPreviewModeTheme("dark")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: previewModeTheme === "dark" ? 700 : 500,
                backgroundColor: previewModeTheme === "dark" ? activeAccent : "transparent",
                color: previewModeTheme === "dark" ? "white" : "var(--text-color)",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Moon size={13} /> Oscuro
            </button>
            <button
              type="button"
              onClick={() => setPreviewModeTheme("light")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: previewModeTheme === "light" ? 700 : 500,
                backgroundColor: previewModeTheme === "light" ? activeAccent : "transparent",
                color: previewModeTheme === "light" ? "white" : "var(--text-color)",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Sun size={13} /> Claro
            </button>
          </div>

          {/* Device Switcher */}
          <div style={{ display: "flex", gap: "2px", backgroundColor: "var(--bg-color)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
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
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
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

      {/* Row 2: Template Selector Pills & Theme Color Picker */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "0.85rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          {/* Explicit Label: 🎨 Temas Visuales del Portal */}
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-color)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🎨 Temas Visuales del Portal:
          </span>

          {/* Color Palette Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Palette size={14} style={{ color: activeAccent }} /> Color del Tema:
            </span>

            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
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
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: swatch.color,
                    border: primaryColor === swatch.color ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                    boxShadow: primaryColor === swatch.color ? `0 0 8px ${swatch.color}` : "none",
                    cursor: "pointer",
                    padding: 0
                  }}
                />
              ))}

              {/* Custom Color Input — BUG2 FIX: debounce 400ms para evitar llamadas masivas a onSave */}
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrimaryColor(val);
                  // Cancelar el guardado anterior y agendar uno nuevo con debounce
                  if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                  colorDebounceRef.current = setTimeout(() => {
                    onSave({ primary_color: val });
                  }, 400);
                }}
                onBlur={(e) => {
                  // Guardar inmediatamente al soltar el picker
                  if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                  onSave({ primary_color: e.target.value });
                }}
                title="Elegir color personalizado"
                style={{
                  width: "26px",
                  height: "26px",
                  padding: 0,
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  backgroundColor: "transparent"
                }}
              />
            </div>
          </div>
        </div>

        {/* Template Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {TEMPLATES.map((tmpl) => {
            const isSelected = webTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setWebTemplate(tmpl.id);
                  setPrimaryColor(tmpl.defaultAccent);
                  onSave({ web_template: tmpl.id, primary_color: tmpl.defaultAccent });
                }}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? 800 : 500,
                  border: isSelected ? `2px solid ${tmpl.defaultAccent}` : "1px solid var(--border-color)",
                  backgroundColor: isSelected ? "var(--surface-hover)" : "var(--surface-color)",
                  color: "var(--text-color)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                {isSelected && <Check size={13} style={{ color: tmpl.defaultAccent }} />}
                {tmpl.name}
              </button>
            );
          })}
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

      {/* FULL PORTAL REPLICA CANVAS FRAME WITH HIGH-SPECIFICITY CSS CLASS & THEME PREVIEW */}
      <div 
        className={activeTmpl.fontClass}
        style={{
          borderRadius: "16px",
          border: "2px solid var(--border-color)",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          backgroundColor: canvasBg,
          color: canvasTextColor,
          width: deviceMode === "mobile" ? "390px" : "100%",
          margin: "0 auto",
          transition: "all 0.3s ease",
          position: "relative"
        }}
      >
        {/* Top simulated browser bar */}
        <div style={{ backgroundColor: "#161b22", padding: "0.6rem 1rem", borderBottom: "1px solid #30363d", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ff5f56" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#27c93f" }} />
          </div>
          <div style={{ flex: 1, backgroundColor: "#0d1117", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", color: "#8b949e", fontFamily: "monospace" }}>
            🔒 https://{agency.subdomain || "mi-automotora"}.n-sistemas.com/ [{activeTmpl.name.toUpperCase()}] ({previewModeTheme.toUpperCase()} MODE)
          </div>
        </div>

        {/* Live Portal Canvas Body */}
        <div style={{ maxHeight: "720px", overflowY: "auto", position: "relative" }}>
          
          {/* SECTION 1: HEADER NAVBAR */}
          <header style={{
            backgroundColor: previewModeTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.95)",
            color: previewModeTheme === "light" ? "#0f172a" : "#ffffff",
            padding: deviceMode === "mobile" ? "0.6rem 0.85rem" : "0.85rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${activeAccent}44`,
            position: "sticky",
            top: 0,
            zIndex: 30,
            backdropFilter: "blur(12px)"
          }}>
            {/* CONDITIONAL LOGO VS NAME RENDERING */}
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

                {/* Floating Corner Button for Logo */}
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

              {/* Agency Name (Non-editable, changed only via Superadmin) */}
              {(name.trim() || !logoUrl) && (
                <span 
                  title="El nombre de la automotora solo puede cambiarse desde la consola de Superadmin."
                  style={{
                    fontWeight: 800,
                    fontSize: deviceMode === "mobile" ? "0.95rem" : "1.1rem",
                    padding: "2px 4px",
                    opacity: name.trim() ? 1 : 0.6
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

          {/* SECTION 2: HERO BANNER (WITH TEMPLATE TYPOGRAPHY & COPY AI CLOUD) */}
          <section style={{
            position: "relative",
            minHeight: deviceMode === "mobile" ? "280px" : "340px",
            backgroundImage: webTemplate === "performance" 
              ? `linear-gradient(90deg, rgba(11, 12, 14, 0.92), rgba(11, 12, 14, 0.45)), url('${currentCover}')`
              : webTemplate === "scandinavian"
              ? `linear-gradient(rgba(250, 250, 248, 0.94), rgba(250, 250, 248, 0.9)), url('${currentCover}')`
              : webTemplate === "heritage"
              ? `linear-gradient(rgba(244, 240, 232, 0.94), rgba(244, 240, 232, 0.9)), url('${currentCover}')`
              : webTemplate === "urban"
              ? `linear-gradient(rgba(247, 248, 250, 0.95), rgba(247, 248, 250, 0.9)), url('${currentCover}')`
              : webTemplate === "local-trust"
              ? `linear-gradient(rgba(255, 255, 255, 0.95), rgba(247, 249, 251, 0.92)), url('${currentCover}')`
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 246, 247, 0.92)), url('${currentCover}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: deviceMode === "mobile" ? "2.5rem 1rem" : (webTemplate === "heritage" ? "4rem 2rem" : "4rem 1.5rem"),
            textAlign: webTemplate === "heritage" && deviceMode !== "mobile" ? "left" : "center",
            display: "flex",
            flexDirection: "column",
            alignItems: webTemplate === "heritage" && deviceMode !== "mobile" ? "flex-start" : "center",
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
              onInput={makeDebouncedSave(eyebrowDebounceRef, setHeroEyebrow, "hero_eyebrow", 800)}
              onBlur={(e) => {
                // Flush inmediato al perder foco
                if (eyebrowDebounceRef.current) clearTimeout(eyebrowDebounceRef.current);
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
            >
              {heroEyebrow}
            </div>

            {/* HERO TITLE WITH ENHANCED EDIT VISUAL EMPHASIS & COPY AI SUGGESTION CLOUD */}
            <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: webTemplate === "heritage" && deviceMode !== "mobile" ? "flex-start" : "center" }}>
              <h1 
                ref={heroTitleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveFocusField("heroTitle")}
                onInput={makeDebouncedSave(titleDebounceRef, setHeroTitle, "hero_title", 800)}
                onBlur={(e) => {
                  // Flush inmediato al perder foco
                  if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
                  const val = e.currentTarget.innerText.trim();
                  setHeroTitle(val);
                  onSave({ hero_title: val });
                }}
                style={getHeroTitleStyles()}
              >
                {heroTitle}
              </h1>

              {/* COPY AI SUGGESTION CLOUD POPUP FOR HERO TITLE */}
              {activeFocusField === "heroTitle" && COPY_SUGGESTIONS.heroTitle && (
                <div style={{
                  position: "absolute",
                  top: "105%",
                  left: webTemplate === "heritage" && deviceMode !== "mobile" ? 0 : "50%",
                  transform: webTemplate === "heritage" && deviceMode !== "mobile" ? "none" : "translateX(-50%)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: `2px solid ${activeAccent}`,
                  borderRadius: "14px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                  zIndex: 99,
                  maxWidth: "520px",
                  width: "90%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  backdropFilter: "blur(12px)"
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: activeAccent, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Lightbulb size={14} /> Sugerencias de Copy AI (Haz clic para usar):
                  </div>
                  {COPY_SUGGESTIONS.heroTitle.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyCopySuggestion("heroTitle", sug); }}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#f8fafc",
                        borderRadius: "6px",
                        padding: "0.4rem 0.7rem",
                        fontSize: "0.8rem",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      ✨ "{sug}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* HERO SUBTITLE */}
            <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: webTemplate === "heritage" && deviceMode !== "mobile" ? "flex-start" : "center" }}>
              <p 
                ref={heroSubtitleRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveFocusField("heroSubtitle")}
                onInput={makeDebouncedSave(subtitleDebounceRef, setHeroSubtitle, "hero_subtitle", 800)}
                onBlur={(e) => {
                  // Flush inmediato al perder foco
                  if (subtitleDebounceRef.current) clearTimeout(subtitleDebounceRef.current);
                  const val = e.currentTarget.innerText.trim();
                  setHeroSubtitle(val);
                  onSave({ hero_subtitle: val });
                }}
                style={{
                  fontSize: deviceMode === "mobile" ? "0.85rem" : "0.95rem",
                  color: canvasTextColor,
                  opacity: 0.9,
                  maxWidth: "620px",
                  margin: 0,
                  cursor: "text",
                  outline: activeFocusField === "heroSubtitle" ? `3px solid ${activeAccent}` : "none",
                  boxShadow: activeFocusField === "heroSubtitle" ? `0 0 16px ${activeAccent}` : "none",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  borderBottom: "1px dashed rgba(255,255,255,0.3)"
                }}
              >
                {heroSubtitle}
              </p>

              {/* COPY AI SUGGESTIONS FOR SUBTITLE */}
              {activeFocusField === "heroSubtitle" && COPY_SUGGESTIONS.heroSubtitle && (
                <div style={{
                  position: "absolute",
                  top: "105%",
                  left: webTemplate === "editorial" && deviceMode !== "mobile" ? 0 : "50%",
                  transform: webTemplate === "editorial" && deviceMode !== "mobile" ? "none" : "translateX(-50%)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: `2px solid ${activeAccent}`,
                  borderRadius: "14px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                  zIndex: 99,
                  maxWidth: "520px",
                  width: "90%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  backdropFilter: "blur(12px)"
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: activeAccent, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Lightbulb size={14} /> Sugerencias de Copy AI:
                  </div>
                  {COPY_SUGGESTIONS.heroSubtitle.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyCopySuggestion("heroSubtitle", sug); }}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#f8fafc",
                        borderRadius: "6px",
                        padding: "0.4rem 0.7rem",
                        fontSize: "0.78rem",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      ✨ "{sug}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: SEARCH & FILTER BAR */}
          <section style={{ backgroundColor: previewModeTheme === "light" ? "#f1f5f9" : "rgba(17, 24, 39, 0.6)", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${cardBorder}` }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "160px", backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#1f2937", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", border: `1px solid ${cardBorder}` }}>
                <Search size={16} style={{ color: "#9ca3af" }} />
                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Buscar vehículo...</span>
              </div>
              <div style={{ backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#1f2937", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", border: `1px solid ${cardBorder}`, fontSize: "0.85rem", color: "#9ca3af" }}>
                <Fuel size={16} /> Combustible (Todos)
              </div>
              <div style={{ backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#1f2937", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", border: `1px solid ${cardBorder}`, fontSize: "0.85rem", color: "#9ca3af" }}>
                Rango de Precio (Todos)
              </div>
            </div>
          </section>

          {/* SECTION 4: VEHICLE PUBLICATIONS CATALOG */}
          <section style={{ padding: deviceMode === "mobile" ? "1.5rem 1rem" : "2.5rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em" }}>INVENTARIO EN VENTA</span>
                <h2 style={{ margin: "0.2rem 0 0 0", fontSize: "1.4rem", color: canvasTextColor }}>Catálogo de Vehículos Seleccionados</h2>
              </div>
              <span style={{ fontSize: "0.8rem", color: activeAccent, fontWeight: 700 }}>Ver todo (3) →</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div style={{
                backgroundColor: `${activeAccent}12`,
                border: `2px dashed ${activeAccent}`,
                borderRadius: "14px",
                padding: "1.5rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "0.75rem",
                minHeight: "250px"
              }}>
                <div style={{ backgroundColor: activeAccent, color: "white", padding: "0.75rem", borderRadius: "50%" }}>
                  <Car size={24} />
                </div>
                <div>
                  <strong style={{ fontSize: "0.92rem", color: activeAccent, display: "block", marginBottom: "0.3rem" }}>
                    🚗 AQUÍ APARECERÁN TUS PUBLICACIONES
                  </strong>
                  <p style={{ fontSize: "0.78rem", opacity: 0.8, margin: 0, lineHeight: 1.4, color: canvasTextColor }}>
                    Todos los vehículos que crees desde tu panel de administrador se mostrarán automáticamente en este catálogo.
                  </p>
                </div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, backgroundColor: `${activeAccent}33`, color: activeAccent, padding: "0.3rem 0.75rem", borderRadius: "999px" }}>
                  Sincronización Automática CRM
                </span>
              </div>

              {DEMO_VEHICLES.map((v) => (
                <div key={v.id} style={{ backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#161e2e", borderRadius: "14px", overflow: "hidden", border: `1px solid ${cardBorder}` }}>
                  <div style={{ position: "relative", height: "135px" }}>
                    <img src={v.image} alt={v.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: activeAccent, color: "white", fontSize: "0.65rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {v.tag}
                    </span>
                  </div>
                  <div style={{ padding: "0.85rem" }}>
                    <span style={{ fontSize: "0.72rem", opacity: 0.6, fontWeight: 600, color: canvasTextColor }}>{v.brand}</span>
                    <h4 style={{ margin: "0.1rem 0 0.35rem 0", fontSize: "0.9rem", color: canvasTextColor }}>{v.model}</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.74rem", opacity: 0.6, color: canvasTextColor }}>{v.year} • {v.kms.toLocaleString()} km</span>
                      <strong style={{ fontSize: "0.92rem", color: activeAccent }}>{v.price}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: ABOUT US (WITH COPY AI SUGGESTIONS) */}
          <section id="nosotros" style={{ padding: deviceMode === "mobile" ? "1.75rem 1rem" : "2.5rem 1.5rem", backgroundColor: previewModeTheme === "light" ? "#f1f5f9" : "rgba(15, 23, 42, 0.7)", borderTop: `1px solid ${cardBorder}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                <Info size={14} /> SOBRE NUESTRA AUTOMOTORA
              </span>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: canvasTextColor }}>Acerca de Nosotros</h2>
              
              <p
                ref={aboutTextRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setActiveFocusField("aboutText")}
                onInput={makeDebouncedSave(aboutDebounceRef, setAboutText, "about_text", 800)}
                onBlur={(e) => {
                  // Flush inmediato al perder foco
                  if (aboutDebounceRef.current) clearTimeout(aboutDebounceRef.current);
                  const val = e.currentTarget.innerText.trim();
                  setAboutText(val);
                  onSave({ about_text: val });
                }}
                title="Escribe directamente aquí para modificar la reseña sobre tu automotora"
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  opacity: 0.95,
                  margin: 0,
                  cursor: "text",
                  outline: activeFocusField === "aboutText" ? `3px solid ${activeAccent}` : "none",
                  boxShadow: activeFocusField === "aboutText" ? `0 0 16px ${activeAccent}` : "none",
                  border: "1px dashed rgba(255,255,255,0.3)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: previewModeTheme === "light" ? "#ffffff" : "rgba(255,255,255,0.03)",
                  color: canvasTextColor
                }}
              >
                {aboutText}
              </p>

              {/* COPY AI SUGGESTIONS FOR ABOUT US */}
              {activeFocusField === "aboutText" && COPY_SUGGESTIONS.aboutText && (
                <div style={{
                  position: "absolute",
                  top: "105%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: `2px solid ${activeAccent}`,
                  borderRadius: "14px",
                  padding: "0.85rem 1rem",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                  zIndex: 99,
                  maxWidth: "560px",
                  width: "95%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  backdropFilter: "blur(12px)"
                }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: activeAccent, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Lightbulb size={14} /> Sugerencias de Reseña Copy AI:
                  </div>
                  {COPY_SUGGESTIONS.aboutText.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyCopySuggestion("aboutText", sug); }}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#f8fafc",
                        borderRadius: "6px",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.78rem",
                        textAlign: "left",
                        cursor: "pointer",
                        lineHeight: 1.4
                      }}
                    >
                      ✨ "{sug}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: PILLARS OF TRUST (100% IN-PLACE EDITABLE FOR ALL 4 BLOCKS) */}
          {showTrustSection && (
            <section style={{ padding: deviceMode === "mobile" ? "1.75rem 1rem" : "2.5rem 1.5rem", borderTop: `1px solid ${cardBorder}` }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em" }}>NUESTRO COMPROMISO</span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.35rem", color: canvasTextColor }}>¿Por qué Elegirnos?</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                {/* Block 1 */}
                <div style={{ backgroundColor: cardBg, padding: "1.25rem", borderRadius: "12px", border: `1px dashed ${cardBorder}` }}>
                  <Shield size={24} style={{ color: activeAccent, marginBottom: "0.5rem" }} />
                  <h4 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP1Title(val);
                      onSave({ trust_pillar1_title: val });
                    }}
                    style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p1Title}
                  </h4>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP1Desc(val);
                      onSave({ trust_pillar1_desc: val });
                    }}
                    style={{ margin: 0, fontSize: "0.78rem", opacity: 0.8, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p1Desc}
                  </p>
                </div>

                {/* Block 2 */}
                <div style={{ backgroundColor: cardBg, padding: "1.25rem", borderRadius: "12px", border: `1px dashed ${cardBorder}` }}>
                  <Zap size={24} style={{ color: activeAccent, marginBottom: "0.5rem" }} />
                  <h4 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP2Title(val);
                      onSave({ trust_pillar2_title: val });
                    }}
                    style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p2Title}
                  </h4>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP2Desc(val);
                      onSave({ trust_pillar2_desc: val });
                    }}
                    style={{ margin: 0, fontSize: "0.78rem", opacity: 0.8, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p2Desc}
                  </p>
                </div>

                {/* Block 3 */}
                <div style={{ backgroundColor: cardBg, padding: "1.25rem", borderRadius: "12px", border: `1px dashed ${cardBorder}` }}>
                  <Car size={24} style={{ color: activeAccent, marginBottom: "0.5rem" }} />
                  <h4 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP3Title(val);
                      onSave({ trust_pillar3_title: val });
                    }}
                    style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p3Title}
                  </h4>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP3Desc(val);
                      onSave({ trust_pillar3_desc: val });
                    }}
                    style={{ margin: 0, fontSize: "0.78rem", opacity: 0.8, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p3Desc}
                  </p>
                </div>

                {/* Block 4 */}
                <div style={{ backgroundColor: cardBg, padding: "1.25rem", borderRadius: "12px", border: `1px dashed ${cardBorder}` }}>
                  <Award size={24} style={{ color: activeAccent, marginBottom: "0.5rem" }} />
                  <h4 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP4Title(val);
                      onSave({ trust_pillar4_title: val });
                    }}
                    style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p4Title}
                  </h4>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setP4Desc(val);
                      onSave({ trust_pillar4_desc: val });
                    }}
                    style={{ margin: 0, fontSize: "0.78rem", opacity: 0.8, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {p4Desc}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 7: CONTACT & LOCATION */}
          <section style={{ padding: deviceMode === "mobile" ? "1.75rem 1rem" : "2.5rem 1.5rem", backgroundColor: previewModeTheme === "light" ? "#f1f5f9" : "rgba(11, 15, 25, 0.8)", borderTop: `1px solid ${cardBorder}` }}>
            <div style={{ display: "grid", gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "1fr 1fr", gap: "1.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeAccent, letterSpacing: "0.1em" }}>ATENCIÓN PERSONALIZADA</span>
                <h3 style={{ margin: 0, fontSize: "1.35rem", color: canvasTextColor }}>Contacto & Ubicación</h3>
                
                <div style={{ backgroundColor: cardBg, padding: "0.85rem 1rem", borderRadius: "10px", border: `1px dashed ${cardBorder}` }}>
                  <strong style={{ fontSize: "0.78rem", color: activeAccent, display: "block" }}>💬 Mensaje de Atención</strong>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setContactDescription(val);
                      onSave({ contact_description: val });
                    }}
                    style={{ fontSize: "0.85rem", margin: 0, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {contactDescription}
                  </p>
                </div>

                <div style={{ backgroundColor: cardBg, padding: "0.85rem 1rem", borderRadius: "10px", border: `1px dashed ${cardBorder}` }}>
                  <strong style={{ fontSize: "0.78rem", color: "#38bdf8", display: "block" }}>📍 Ubicación de {agency.name || "la Automotora"}</strong>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setLocationAddress(val);
                      onSave({ location_address: val });
                    }}
                    style={{ fontSize: "0.85rem", margin: 0, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {locationAddress}
                  </p>
                </div>

                <div style={{ backgroundColor: cardBg, padding: "0.85rem 1rem", borderRadius: "10px", border: `1px dashed ${cardBorder}` }}>
                  <strong style={{ fontSize: "0.78rem", color: "#f59e0b", display: "block" }}>🕒 Horarios de Atención</strong>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      setBusinessHours(val);
                      onSave({ business_hours: val });
                    }}
                    style={{ fontSize: "0.85rem", margin: 0, outline: "none", cursor: "text", color: canvasTextColor }}
                  >
                    {businessHours}
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: cardBg, padding: "1.25rem", borderRadius: "14px", border: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: canvasTextColor }}>Enviar Consulta Directa</h4>
                <input type="text" placeholder="Tu Nombre completo..." style={{ padding: "0.55rem 0.75rem", borderRadius: "6px", border: `1px solid ${cardBorder}`, backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#0b0f19", color: canvasTextColor, fontSize: "0.82rem" }} readOnly />
                <input type="text" placeholder="Tu Teléfono / WhatsApp..." style={{ padding: "0.55rem 0.75rem", borderRadius: "6px", border: `1px solid ${cardBorder}`, backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#0b0f19", color: canvasTextColor, fontSize: "0.82rem" }} readOnly />
                <textarea rows={2} placeholder="¿Qué vehículo te interesa consultar?..." style={{ padding: "0.55rem 0.75rem", borderRadius: "6px", border: `1px solid ${cardBorder}`, backgroundColor: previewModeTheme === "light" ? "#ffffff" : "#0b0f19", color: canvasTextColor, fontSize: "0.82rem", resize: "none" }} readOnly />
                <button type="button" style={{ backgroundColor: "#25d366", color: "white", border: "none", padding: "0.6rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                  Enviar por WhatsApp ↗
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 8: FOOTER (CLEANED WITHOUT EXTRA AUXILIARY LABELS) */}
          <footer style={{
            padding: "1.75rem 1.5rem",
            backgroundColor: previewModeTheme === "light" ? "#e2e8f0" : "#05070b",
            borderTop: `1px solid ${cardBorder}`,
            textAlign: "center"
          }}>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const val = e.currentTarget.innerText.trim();
                setFooterText(val);
                onSave({ footer_text: val });
              }}
              style={{
                fontSize: "0.85rem",
                opacity: 0.85,
                maxWidth: "600px",
                margin: "0 auto",
                outline: "none",
                cursor: "text",
                color: canvasTextColor,
                borderBottom: previewModeTheme === "light" ? "1px dashed rgba(0,0,0,0.3)" : "1px dashed rgba(255,255,255,0.3)"
              }}
            >
              {footerText}
            </p>
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: `1px solid ${cardBorder}`, fontSize: "0.72rem", opacity: 0.6, color: canvasTextColor }}>
              © {new Date().getFullYear()} {name || "Automotora"}. Todos los derechos reservados.
            </div>
          </footer>

        </div>
      </div>

      {/* FIXED BOTTOM OUTSIDE STATUS BANNER (YELLOW FOR SAVING / NEON GREEN FOR SAVED) */}
      {autoSavingStatus !== "idle" && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          padding: "0.7rem 1.6rem",
          borderRadius: "9999px",
          fontWeight: 800,
          fontSize: "0.88rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: autoSavingStatus === "saving" ? "#f59e0b" : autoSavingStatus === "error" ? "#ef4444" : "#10b981",
          color: autoSavingStatus === "saving" ? "#0f172a" : "#ffffff",
          border: autoSavingStatus === "saving" ? "1px solid #d97706" : autoSavingStatus === "error" ? "1px solid #dc2626" : "1px solid #059669"
        }}>
          {autoSavingStatus === "saving" ? (
            <>
              <span style={{ fontSize: "1.1rem" }}>⏳</span>
              <span>Guardando cambios en vivo...</span>
            </>
          ) : autoSavingStatus === "error" ? (
            <>
              <XCircle size={18} />
              <span>Error al guardar. Reintentando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>¡Guardado con éxito!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
