"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Monitor, 
  Smartphone, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  Clock, 
  MapPin, 
  Palette, 
  Building2, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import dynamic from "next/dynamic";

const InteractiveMapPicker = dynamic(() => import("@/components/InteractiveMapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "260px",
      borderRadius: "10px",
      border: "1px solid var(--border-color)",
      backgroundColor: "rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-muted)",
      fontSize: "0.85rem"
    }}>
      Cargando mapa interactivo...
    </div>
  ),
});

interface AgencyData {
  id: string;
  name: string;
  subdomain: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  cover_images?: string[];
  primary_color?: string;
  font_family?: string;
  web_template?: string;
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  footer_text?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  business_hours?: string;
  contact_description?: string;
  about_text?: string;
  show_trust_section?: boolean;
}

interface VisualWebBuilderProps {
  agency: AgencyData;
  onSave: (updated: Partial<AgencyData>) => Promise<void>;
  autoSavingStatus: "idle" | "saving" | "saved" | "error";
}

const COLOR_SWATCHES = [
  { name: "Verde Esmeralda", color: "#10B981" },
  { name: "Azul Ejecutivo", color: "#2563EB" },
  { name: "Cobalto Deportivo", color: "#1D4ED8" },
  { name: "Rojo Deportivo", color: "#DC2626" },
  { name: "Ámbar Premium", color: "#D97706" },
  { name: "Negro Elegante", color: "#18181B" },
];

const PRESET_COVERS = [
  {
    name: "Showroom Moderno",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "Salón Concesionario",
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "Deportivos & Gama Alta",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
  },
  {
    name: "Aéreo Showroom Drone",
    url: "/hero_dealership_drone.jpg"
  }
];

const DEMO_PREVIEW_VEHICLES = [
  {
    id: "v-1",
    brand: "BMW",
    model: "Serie 3 320i M-Sport",
    year: 2023,
    price: "USD 54,900",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    tag: "SELECCIONADO"
  },
  {
    id: "v-2",
    brand: "Audi",
    model: "Q5 45 TFSI Quattro",
    year: 2022,
    price: "USD 62,500",
    image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    tag: "IMPECABLE"
  },
  {
    id: "v-3",
    brand: "Mercedes-Benz",
    model: "C200 Avantgarde",
    year: 2023,
    price: "USD 58,000",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    tag: "GARANTÍA"
  }
];

export default function VisualWebBuilder({
  agency,
  onSave,
  autoSavingStatus
}: VisualWebBuilderProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  
  // Estado local para reacción inmediata al tipear
  const [name, setName] = useState(agency.name || "");
  const [primaryColor, setPrimaryColor] = useState(agency.primary_color || "#10B981");
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || "");
  
  const initialCovers = (agency.cover_images && agency.cover_images.length > 0)
    ? agency.cover_images
    : (agency.cover_url ? [agency.cover_url] : [PRESET_COVERS[0].url]);
  const [coverImages, setCoverImages] = useState<string[]>(initialCovers);
  const [coverUrl, setCoverUrl] = useState(agency.cover_url || initialCovers[0] || PRESET_COVERS[0].url);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  // Auto-slide periódico en la vista previa cuando hay más de una foto
  useEffect(() => {
    if (coverImages.length <= 1) {
      setPreviewSlideIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPreviewSlideIndex((prev) => (prev + 1) % coverImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [coverImages.length]);

  const [heroTitle, setHeroTitle] = useState(agency.hero_title || "Encuentra tu próximo vehículo");
  const [heroSubtitle, setHeroSubtitle] = useState(
    agency.hero_subtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro."
  );
  const [aboutText, setAboutText] = useState(
    agency.about_text || "Somos una automotora comprometida con la excelencia, la transparencia y la calidad. Ofrecemos vehículos seleccionados con certificación total, garantía y atención personalizada."
  );
  const [locationAddress, setLocationAddress] = useState(
    agency.location_address || "Av. Principal 1234, Montevideo, Uruguay"
  );
  const [latitude, setLatitude] = useState<number>(agency.latitude ?? -34.9011);
  const [longitude, setLongitude] = useState<number>(agency.longitude ?? -56.1645);
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp || "+598 99 123 456");
  const [businessHours, setBusinessHours] = useState(
    agency.business_hours || "Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs"
  );

  // Registro de valores guardados para comparar en onBlur
  const savedValuesRef = useRef<Record<string, any>>({
    name: agency.name || "",
    primary_color: agency.primary_color || "#10B981",
    logo_url: agency.logo_url || "",
    cover_url: initialCovers[0] || PRESET_COVERS[0].url,
    cover_images: initialCovers,
    hero_title: agency.hero_title || "Encuentra tu próximo vehículo",
    hero_subtitle: agency.hero_subtitle || "",
    about_text: agency.about_text || "",
    location_address: agency.location_address || "",
    latitude: agency.latitude ?? -34.9011,
    longitude: agency.longitude ?? -56.1645,
    whatsapp: agency.whatsapp || "",
    business_hours: agency.business_hours || "",
  });

  // Mensaje visual de guardado al hacer clic afuera
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar estado cuando agency cambie externamente
  useEffect(() => {
    if (agency) {
      if (agency.name !== undefined) setName(agency.name);
      if (agency.primary_color) setPrimaryColor(agency.primary_color);
      if (agency.logo_url !== undefined) setLogoUrl(agency.logo_url);
      
      const newCovers = (agency.cover_images && agency.cover_images.length > 0)
        ? agency.cover_images
        : (agency.cover_url ? [agency.cover_url] : [PRESET_COVERS[0].url]);
      setCoverImages(newCovers);
      setCoverUrl(newCovers[0] || PRESET_COVERS[0].url);

      if (agency.hero_title !== undefined) setHeroTitle(agency.hero_title);
      if (agency.hero_subtitle !== undefined) setHeroSubtitle(agency.hero_subtitle);
      if (agency.about_text !== undefined) setAboutText(agency.about_text);
      if (agency.location_address !== undefined) setLocationAddress(agency.location_address);
      if (agency.latitude !== undefined) setLatitude(agency.latitude);
      if (agency.longitude !== undefined) setLongitude(agency.longitude);
      if (agency.whatsapp !== undefined) setWhatsapp(agency.whatsapp);
      if (agency.business_hours !== undefined) setBusinessHours(agency.business_hours);

      savedValuesRef.current = {
        name: agency.name || "",
        primary_color: agency.primary_color || "#10B981",
        logo_url: agency.logo_url || "",
        cover_url: newCovers[0] || PRESET_COVERS[0].url,
        cover_images: newCovers,
        hero_title: agency.hero_title || "",
        hero_subtitle: agency.hero_subtitle || "",
        about_text: agency.about_text || "",
        location_address: agency.location_address || "",
        latitude: agency.latitude ?? -34.9011,
        longitude: agency.longitude ?? -56.1645,
        whatsapp: agency.whatsapp || "",
        business_hours: agency.business_hours || "",
      };
    }
  }, [agency]);

  // Manejador central de onBlur: guarda inmediatamente cuando el usuario hace clic afuera
  const handleFieldBlur = useCallback((fieldKey: string, currentValue: any, friendlyName: string) => {
    const previous = savedValuesRef.current[fieldKey];
    if (previous === currentValue) return; // Sin cambios, no enviar petición innecesaria

    savedValuesRef.current[fieldKey] = currentValue;
    onSave({ [fieldKey]: currentValue });

    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setLastSavedMessage(`✓ ${friendlyName} guardado`);
    messageTimeoutRef.current = setTimeout(() => {
      setLastSavedMessage(null);
    }, 3000);
  }, [onSave]);

  // Manejador centralizado de actualización de imágenes de portada
  const updateCoverImages = (newImages: string[]) => {
    const finalImages = newImages.length > 0 ? newImages : [PRESET_COVERS[0].url];
    setCoverImages(finalImages);
    setCoverUrl(finalImages[0]);
    savedValuesRef.current["cover_images"] = finalImages;
    savedValuesRef.current["cover_url"] = finalImages[0];
    onSave({ cover_images: finalImages, cover_url: finalImages[0] });
    setLastSavedMessage(
      finalImages.length > 1 
        ? `✓ ${finalImages.length} fotos guardadas (carrusel con deslizamiento)` 
        : "✓ Foto de portada guardada"
    );
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setLastSavedMessage(null), 3000);
  };

  // Manejador de carga de archivos (cover / logo)
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleMultipleCoversUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      formData.append("folder", "covers");

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.urls && data.urls.length > 0) {
        const isDefaultOnly = coverImages.length === 1 && coverImages[0] === PRESET_COVERS[0].url;
        const updated = isDefaultOnly ? data.urls : [...coverImages, ...data.urls];
        updateCoverImages(updated);
      } else {
        alert("Error al subir imagen: " + (data.error || "Intente nuevamente"));
      }
    } catch (err) {
      console.error("Error subiendo foto de portada:", err);
      alert("Error de conexión al subir la imagen.");
    } finally {
      setIsUploadingImages(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveCover = (indexToRemove: number) => {
    if (coverImages.length <= 1) {
      updateCoverImages([PRESET_COVERS[0].url]);
      return;
    }
    const updated = coverImages.filter((_, i) => i !== indexToRemove);
    updateCoverImages(updated);
    if (previewSlideIndex >= updated.length) {
      setPreviewSlideIndex(0);
    }
  };

  const handleToggleOrAddPreset = (url: string) => {
    if (coverImages.includes(url)) {
      if (coverImages.length > 1) {
        handleRemoveCover(coverImages.indexOf(url));
      }
      return;
    }
    const updated = [...coverImages, url];
    updateCoverImages(updated);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "branding");

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
        savedValuesRef.current["logo_url"] = data.url;
        onSave({ logo_url: data.url });
        setLastSavedMessage("✓ Logo actualizado");
        setTimeout(() => setLastSavedMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error subiendo logo:", err);
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleColorChange = (hex: string) => {
    setPrimaryColor(hex);
    savedValuesRef.current["primary_color"] = hex;
    onSave({ primary_color: hex });
    setLastSavedMessage("✓ Color de marca guardado");
    setTimeout(() => setLastSavedMessage(null), 3000);
  };

  // URL del portal público
  const publicSubdomain = agency?.subdomain || "demo";
  const portalUrl = `/portal/${publicSubdomain}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      
      {/* BARRA SUPERIOR DE ESTADO Y VISTA */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "0.85rem 1.25rem",
      }}>
        {/* Indicador de guardado automático onBlur */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            backgroundColor: autoSavingStatus === "saving" ? "#f59e0b" : "#10b981",
            boxShadow: autoSavingStatus === "saving" ? "0 0 8px #f59e0b" : "0 0 8px #10b981"
          }} />
          <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-color)" }}>
            {autoSavingStatus === "saving" && "Guardando cambios en tu web..."}
            {autoSavingStatus !== "saving" && (lastSavedMessage || "Guardado automático al salir de cada campo")}
          </span>
        </div>

        {/* Toggle de Dispositivo para la Vista Previa */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Vista Previa:
          </span>
          <div style={{
            display: "inline-flex",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "2px"
          }}>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: deviceMode === "desktop" ? "var(--surface-hover)" : "transparent",
                color: deviceMode === "desktop" ? "#ffffff" : "var(--text-muted)",
              }}
            >
              <Monitor size={14} /> Escritorio
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: deviceMode === "mobile" ? "var(--surface-hover)" : "transparent",
                color: deviceMode === "mobile" ? "#ffffff" : "var(--text-muted)",
              }}
            >
              <Smartphone size={14} /> Celular
            </button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL SPLIT: BLOQUES DE EDICIÓN + VISTA PREVIA SIEMPRE VISIBLE */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(380px, 440px) 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}>

        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA: BLOQUES DE EDICIÓN ULTRA-ESENCIALES   */}
        {/* ======================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* ---------------------------------------------------- */}
          {/* BLOQUE 1: PORTADA & TITULARES PRINCIPALES (HERO)     */}
          {/* ---------------------------------------------------- */}
          <div 
            data-tour="web-config-top"
            style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div style={{ color: primaryColor }}><ImageIcon size={18} /></div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>Foto de Portada & Titulares</h3>
            </div>

            {/* Fotos de Portada del Showroom */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                  Fotos de Portada del Showroom
                </label>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  backgroundColor: coverImages.length > 1 ? `${primaryColor}20` : "rgba(255,255,255,0.06)",
                  color: coverImages.length > 1 ? primaryColor : "var(--text-muted)",
                  border: `1px solid ${coverImages.length > 1 ? `${primaryColor}40` : "var(--border-color)"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  {coverImages.length > 1 ? (
                    <>
                      <Sparkles size={11} /> Carrusel activo ({coverImages.length} fotos con deslizamiento)
                    </>
                  ) : (
                    "📌 1 foto fija (sin deslizamiento)"
                  )}
                </span>
              </div>

              {/* Galería de miniaturas y botón para añadir más */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
                gap: "0.55rem",
              }}>
                {coverImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      height: "70px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: `2px solid ${idx === previewSlideIndex && coverImages.length > 1 ? primaryColor : "var(--border-color)"}`,
                      backgroundImage: `url(${imgUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "border-color 0.2s ease"
                    }}
                  >
                    {/* Badge con número de orden */}
                    <span style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      backgroundColor: "rgba(0,0,0,0.75)",
                      color: "#fff",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      lineHeight: 1
                    }}>
                      #{idx + 1}
                    </span>

                    {/* Botón para eliminar foto */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCover(idx)}
                      title="Eliminar foto"
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        backgroundColor: "rgba(220, 38, 38, 0.85)",
                        color: "#fff",
                        border: "none",
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Botón para subir fotos adicionales */}
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  style={{
                    height: "70px",
                    borderRadius: "8px",
                    border: "1.5px dashed var(--border-color)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    cursor: "pointer",
                    color: "var(--text-color)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                  }}
                >
                  {isUploadingImages ? (
                    <span style={{ fontSize: "0.72rem", color: primaryColor, fontWeight: 700 }}>
                      Subiendo...
                    </span>
                  ) : (
                    <>
                      <Plus size={16} style={{ color: primaryColor }} />
                      <span>+ Subir foto(s)</span>
                    </>
                  )}
                </button>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleCoversUpload}
                  style={{ display: "none" }}
                />
              </div>

              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                💡 Tip: Agrega 2 o más fotos para que tu showroom se deslice automáticamente. Con 1 sola foto se mantendrá fija.
              </span>

              {/* Presets recomendados */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.15rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Añadir fotos recomendadas:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
                  {PRESET_COVERS.map((preset, idx) => {
                    const isSelected = coverImages.includes(preset.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleOrAddPreset(preset.url)}
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.25rem 0.55rem",
                          borderRadius: "6px",
                          backgroundColor: isSelected ? `${primaryColor}22` : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isSelected ? primaryColor : "var(--border-color)"}`,
                          color: isSelected ? primaryColor : "var(--text-color)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        {isSelected ? <Check size={11} /> : <Plus size={11} />}
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Título Principal */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Título Principal
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                onBlur={() => handleFieldBlur("hero_title", heroTitle, "Título principal")}
                placeholder="Encuentra tu próximo vehículo"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  outline: "none"
                }}
              />
            </div>

            {/* Subtítulo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Subtítulo de Portada
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                onBlur={() => handleFieldBlur("hero_subtitle", heroSubtitle, "Subtítulo")}
                placeholder="Unidades seleccionadas con garantía total..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  resize: "vertical",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* BLOQUE 2: IDENTIDAD & COLOR DE MARCA                 */}
          {/* ---------------------------------------------------- */}
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div style={{ color: primaryColor }}><Building2 size={18} /></div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>Identidad & Color de Marca</h3>
            </div>

            {/* Nombre de la automotora (Protegido contra edición directa) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                  Nombre de la Automotora
                </label>
                <span style={{
                  fontSize: "0.7rem",
                  color: primaryColor,
                  backgroundColor: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}35`,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}>
                  🔒 Protegido
                </span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                color: "var(--text-color)",
                fontSize: "0.88rem",
                fontWeight: 700
              }}>
                <span>{name || "Tu Automotora"}</span>
                <a
                  href="/admin/settings"
                  style={{
                    fontSize: "0.74rem",
                    color: primaryColor,
                    textDecoration: "none",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem"
                  }}
                >
                  Solicitar cambio a soporte →
                </a>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Por seguridad comercial, el nombre solo se modifica desde <strong>Configuración</strong> solicitándolo al equipo de soporte.
              </span>
            </div>

            {/* Logo de la automotora */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Logo
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <Building2 size={20} style={{ opacity: 0.4 }} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--surface-hover)",
                    color: "var(--text-color)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Upload size={13} /> {logoUrl ? "Cambiar Logo" : "Subir Logo"}
                </button>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: "none" }}
                />

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl("");
                      savedValuesRef.current["logo_url"] = "";
                      onSave({ logo_url: "" });
                      setLastSavedMessage("✓ Logo removido");
                      setTimeout(() => setLastSavedMessage(null), 3000);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Color de Marca */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Color de Acento & Botones
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {COLOR_SWATCHES.map((swatch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title={swatch.name}
                    onClick={() => handleColorChange(swatch.color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: swatch.color,
                      border: primaryColor.toLowerCase() === swatch.color.toLowerCase() ? "3px solid #ffffff" : "2px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      boxShadow: primaryColor.toLowerCase() === swatch.color.toLowerCase() ? `0 0 10px ${swatch.color}` : "none",
                      transition: "transform 0.15s ease",
                      transform: primaryColor.toLowerCase() === swatch.color.toLowerCase() ? "scale(1.15)" : "scale(1)"
                    }}
                  />
                ))}
                
                {/* Input color libre */}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  onBlur={() => handleColorChange(primaryColor)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    padding: 0
                  }}
                  title="Color personalizado"
                />
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* BLOQUE 3: SOBRE NOSOTROS                             */}
          {/* ---------------------------------------------------- */}
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div style={{ color: primaryColor }}><FileText size={18} /></div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>Sobre Nosotros</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Historia & Presentación
              </label>
              <textarea
                rows={4}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                onBlur={() => handleFieldBlur("about_text", aboutText, "Sobre nosotros")}
                placeholder="Describe la trayectoria, valores y propuesta de tu automotora..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.75rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.86rem",
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* BLOQUE 4: UBICACIÓN, MAPA & CONTACTO                 */}
          {/* ---------------------------------------------------- */}
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div style={{ color: primaryColor }}><MapPin size={18} /></div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>Ubicación & Contacto</h3>
            </div>

            {/* Dirección Showroom */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Dirección del Showroom
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                onBlur={() => handleFieldBlur("location_address", locationAddress, "Dirección")}
                placeholder="Ej: Av. Giannattasio km 21, Canelones"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Mapa Interactivo con selección manual por clic */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                  Ubicación en el Mapa (Clic sobre el lugar exacto)
                </label>
                <span style={{
                  fontSize: "0.72rem",
                  color: primaryColor,
                  backgroundColor: `${primaryColor}15`,
                  padding: "0.15rem 0.45rem",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontWeight: 700
                }}>
                  📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>

              <InteractiveMapPicker
                latitude={latitude}
                longitude={longitude}
                primaryColor={primaryColor}
                onChangeLocation={(newLat, newLng, suggestedAddress) => {
                  setLatitude(newLat);
                  setLongitude(newLng);
                  savedValuesRef.current["latitude"] = newLat;
                  savedValuesRef.current["longitude"] = newLng;

                  const updatesToSave: Partial<AgencyData> = {
                    latitude: newLat,
                    longitude: newLng,
                  };

                  if (suggestedAddress && (!locationAddress || locationAddress === "Av. Principal 1234, Montevideo, Uruguay")) {
                    setLocationAddress(suggestedAddress);
                    savedValuesRef.current["location_address"] = suggestedAddress;
                    updatesToSave.location_address = suggestedAddress;
                  }

                  onSave(updatesToSave);
                  setLastSavedMessage("✓ Ubicación en el mapa actualizada");
                  if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
                  messageTimeoutRef.current = setTimeout(() => setLastSavedMessage(null), 3000);
                }}
              />
            </div>

            {/* WhatsApp de Ventas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                WhatsApp de Ventas
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                onBlur={() => handleFieldBlur("whatsapp", whatsapp, "WhatsApp de ventas")}
                placeholder="+598 99 123 456"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Horario de Atención */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-color)" }}>
                Horario de Atención
              </label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                onBlur={() => handleFieldBlur("business_hours", businessHours, "Horario de atención")}
                placeholder="Lunes a Viernes 09:00 a 19:00 hs"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  color: "var(--text-color)",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA: VISTA PREVIA SIEMPRE VISIBLE (STICKY)   */}
        {/* ======================================================== */}
        <div style={{
          position: "sticky",
          top: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "100%",
          maxWidth: deviceMode === "mobile" ? "375px" : "100%",
          margin: deviceMode === "mobile" ? "0 auto" : "0",
          transition: "max-width 0.3s ease"
        }}>
          {/* Barra de Navegador de la Vista Previa */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#111318",
            border: "1px solid rgba(255,255,255,0.1)",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            padding: "0.6rem 0.85rem",
            fontSize: "0.76rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} />
              <span style={{ marginLeft: "0.5rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                https://{publicSubdomain}.n-autos.com
              </span>
            </div>

            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                color: primaryColor,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.74rem"
              }}
            >
              Abrir web real <ExternalLink size={12} />
            </a>
          </div>

          {/* Canvas Web Renderizado en Vivo */}
          <div style={{
            border: "1px solid rgba(255,255,255,0.1)",
            borderTop: "none",
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px",
            backgroundColor: "#090a0f",
            color: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto"
          }}>
            {/* Header del Sitio */}
            <header style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.25rem",
              backgroundColor: "rgba(15, 17, 23, 0.95)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              position: "sticky",
              top: 0,
              zIndex: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ height: "26px", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
                    {name || "Tu Automotora"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: "#25d366",
                  color: "#ffffff",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "999px"
                }}>
                  <Phone size={11} /> WhatsApp
                </span>
              </div>
            </header>

            {/* Hero Section */}
            <section style={{
              position: "relative",
              padding: deviceMode === "mobile" ? "2.5rem 1.25rem" : "3.5rem 2rem",
              backgroundImage: coverImages.length <= 1 
                ? `linear-gradient(rgba(9, 10, 15, 0.75), rgba(9, 10, 15, 0.92)), url(${coverImages[0] || coverUrl})` 
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.85rem",
              overflow: "hidden"
            }}>
              {/* Carrusel con deslizamiento hacia la derecha si hay múltiples fotos */}
              {coverImages.length > 1 && (
                <>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    zIndex: 1,
                    pointerEvents: "none"
                  }}>
                    <div style={{
                      display: "flex",
                      height: "100%",
                      width: `${coverImages.length * 100}%`,
                      transform: `translateX(-${(previewSlideIndex * 100) / coverImages.length}%)`,
                      transition: "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
                      willChange: "transform"
                    }}>
                      {coverImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          style={{
                            width: `${100 / coverImages.length}%`,
                            height: "100%",
                            backgroundImage: `linear-gradient(rgba(9, 10, 15, 0.75), rgba(9, 10, 15, 0.92)), url(${imgUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Indicadores de diapositiva en preview */}
                  <div style={{
                    position: "absolute",
                    bottom: "0.65rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    zIndex: 4
                  }}>
                    {coverImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSlideIndex(i);
                        }}
                        style={{
                          width: i === previewSlideIndex ? "16px" : "5px",
                          height: "5px",
                          borderRadius: "999px",
                          backgroundColor: i === previewSlideIndex ? primaryColor : "rgba(255,255,255,0.4)",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.3s ease"
                        }}
                      />
                    ))}
                  </div>

                  {/* Botones de navegación en preview */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSlideIndex((prev) => (prev - 1 + coverImages.length) % coverImages.length);
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "0.5rem",
                      transform: "translateY(-50%)",
                      zIndex: 4,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSlideIndex((prev) => (prev + 1) % coverImages.length);
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "0.5rem",
                      transform: "translateY(-50%)",
                      zIndex: 4,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Contenido del Hero sobre el slider */}
              <div style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.85rem",
                width: "100%"
              }}>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: primaryColor,
                  backgroundColor: `${primaryColor}22`,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "999px",
                  border: `1px solid ${primaryColor}44`
                }}>
                  AUTOMOTORA OFICIAL
                </span>

                <h1 style={{
                  margin: 0,
                  fontSize: deviceMode === "mobile" ? "1.45rem" : "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  maxWidth: "600px",
                  lineHeight: 1.2
                }}>
                  {heroTitle}
                </h1>

                <p style={{
                  margin: 0,
                  fontSize: deviceMode === "mobile" ? "0.82rem" : "0.92rem",
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: "520px",
                  lineHeight: 1.5
                }}>
                  {heroSubtitle}
                </p>

                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                  <span style={{
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 700
                  }}>
                    Ver Catálogo
                  </span>
                  <span style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    border: "1px solid rgba(255,255,255,0.15)"
                  }}>
                    Contacto
                  </span>
                </div>
              </div>
            </section>

            {/* Catálogo de Muestra */}
            <section style={{ padding: "1.5rem 1.25rem", backgroundColor: "#0c0d12" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>Vehículos Destacados</h3>
                <span style={{ fontSize: "0.75rem", color: primaryColor, fontWeight: 600 }}>Ver todos (3) →</span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: deviceMode === "mobile" ? "1fr" : "repeat(3, 1fr)",
                gap: "0.85rem"
              }}>
                {DEMO_PREVIEW_VEHICLES.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div style={{ height: "90px", backgroundImage: `url(${v.image})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                      <span style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        backgroundColor: primaryColor,
                        color: "#fff",
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px"
                      }}>
                        {v.tag}
                      </span>
                    </div>
                    <div style={{ padding: "0.65rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{v.brand}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.model}</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 800, color: primaryColor, marginTop: "0.25rem" }}>{v.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sección Sobre Nosotros */}
            <section style={{ padding: "1.75rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#090a0f" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nuestra Trayectoria
              </span>
              <h3 style={{ margin: "0.25rem 0 0.65rem 0", fontSize: "1.1rem", fontWeight: 700 }}>
                Sobre {name || "Nosotros"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                {aboutText}
              </p>
            </section>

            {/* Sección Ubicación, Contacto & Mapa */}
            <section style={{ padding: "1.75rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#0c0d12" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Encuéntranos
              </span>
              <h3 style={{ margin: "0.25rem 0 0.85rem 0", fontSize: "1.1rem", fontWeight: 700 }}>
                Showroom & Contacto
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={15} style={{ color: primaryColor, flexShrink: 0 }} />
                  <span>{locationAddress}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone size={15} style={{ color: "#25d366", flexShrink: 0 }} />
                  <span>WhatsApp de Ventas: <b>{whatsapp}</b></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={15} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span>{businessHours}</span>
                </div>
              </div>

              {/* Mapa Interactivo Embed */}
              <div style={{
                marginTop: "1rem",
                height: "140px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "#1a1d24"
              }}>
                <iframe
                  key={`${latitude}-${longitude}`}
                  title="Ubicación de la automotora"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                />
              </div>
            </section>

            {/* Footer del Sitio */}
            <footer style={{
              padding: "1.25rem 1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#07080b",
              textAlign: "center",
              fontSize: "0.74rem",
              color: "rgba(255,255,255,0.4)"
            }}>
              <div>© {new Date().getFullYear()} {name || "Automotora"}. Todos los derechos reservados.</div>
              <div style={{ marginTop: "0.2rem", fontSize: "0.68rem" }}>Sitio web impulsado por n-autos.com</div>
            </footer>
          </div>
        </div>

      </div>

    </div>
  );
}
