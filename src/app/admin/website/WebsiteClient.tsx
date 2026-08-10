"use client";

import { useState, useTransition } from "react";
import { Globe, Palette, Car, Eye, EyeOff, Star, ExternalLink, Sparkles, Plus, Search, Check, RefreshCw, CheckCircle2 } from "lucide-react";
import VisualWebBuilder from "../settings/VisualWebBuilder";
import { updateAgencySettings } from "@/actions/agencyActions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  kms?: number;
  price: number;
  currency: string;
  images: string[];
  status: string;
  color?: string;
  is_published_web?: boolean;
  is_featured_web?: boolean;
}

interface WebsiteClientProps {
  initialAgency: any;
  initialVehicles: Vehicle[];
}

export default function WebsiteClient({ initialAgency, initialVehicles }: WebsiteClientProps) {
  const [agency, setAgency] = useState(initialAgency);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles.map(v => ({
    ...v,
    is_published_web: v.is_published_web !== undefined ? v.is_published_web : true,
    is_featured_web: v.is_featured_web !== undefined ? v.is_featured_web : false
  })));

  const [activeTab, setActiveTab] = useState<"builder" | "publications" | "settings">("builder");
  const [autoSavingStatus, setAutoSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "published" | "hidden" | "featured">("all");
  const [, startTransition] = useTransition();

  const handleSaveAgency = async (updatedFields: Partial<any>) => {
    // BUG4 FIX: Capturar el ID directamente del estado actual antes de cualquier setter
    const currentAgencyId = agency?.id || "00000000-0000-0000-0000-000000000000";
    setAutoSavingStatus("saving");
    // Actualización optimista del estado local
    setAgency((prev: any) => ({ ...prev, ...updatedFields }));
    startTransition(async () => {
      try {
        const res = await updateAgencySettings(currentAgencyId, updatedFields);
        if (res && res.data) {
          setAgency((prev: any) => ({ ...prev, ...res.data }));
        }
        setAutoSavingStatus("saved");
        // revalidatePath en el server action se encarga de invalidar el cache del portal
        setTimeout(() => setAutoSavingStatus("idle"), 2500);
      } catch (e) {
        console.error("Fallo al guardar configuración web:", e);
        // MEJORA1: Mostrar estado de error en lugar de volver a idle silenciosamente
        setAutoSavingStatus("error");
        setTimeout(() => setAutoSavingStatus("idle"), 3500);
      }
    });
  };

  const toggleVehiclePublished = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, is_published_web: !v.is_published_web };
      }
      return v;
    }));
  };

  const toggleVehicleFeatured = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, is_featured_web: !v.is_featured_web };
      }
      return v;
    }));
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === "published") return v.is_published_web;
    if (filterMode === "hidden") return !v.is_published_web;
    if (filterMode === "featured") return v.is_featured_web;
    return true;
  });

  const publishedCount = vehicles.filter(v => v.is_published_web).length;
  const featuredCount = vehicles.filter(v => v.is_featured_web).length;

  // MEJORA2: En producción apunta al dominio externo; en dev/staging usa la ruta relativa
  const isDevMode = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname.includes("127.0.0.1"));
  const publicWebsiteUrl = isDevMode
    ? `/portal/${agency?.subdomain || "hola"}`
    : `https://${agency?.subdomain || "demo"}.n-sistemas.com`;
  const relativePortalUrl = `/portal/${agency?.subdomain || "hola"}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            padding: "0.85rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Globe size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Página Web & Portal de la Automotora</h1>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.84rem", opacity: 0.75 }}>
              Sitio web activo en: <strong style={{ color: "var(--primary)" }}>{agency?.subdomain || "demo"}.n-sistemas.com</strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href={publicWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              padding: "0.65rem 1.15rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}
          >
            🌐 {agency?.subdomain || "demo"}.n-sistemas.com ↗
          </a>
          <a
            href={relativePortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "var(--surface-color)",
              color: "var(--text-color)",
              border: "1px solid var(--border-color)",
              padding: "0.65rem 0.95rem",
              borderRadius: "999px",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
            title="Abrir vista local del portal"
          >
            👁️ Vista Previa
          </a>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        borderBottom: "2px solid var(--border-color)",
        paddingBottom: "2px"
      }}>
        <button
          type="button"
          onClick={() => setActiveTab("builder")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.4rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "builder" ? 800 : 500,
            color: activeTab === "builder" ? "var(--primary)" : "var(--text-color)",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "builder" ? "3px solid var(--primary)" : "3px solid transparent",
            cursor: "pointer"
          }}
        >
          <Palette size={18} /> Editor Visual 1:1
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("publications")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.4rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "publications" ? 800 : 500,
            color: activeTab === "publications" ? "var(--primary)" : "var(--text-color)",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "publications" ? "3px solid var(--primary)" : "3px solid transparent",
            cursor: "pointer"
          }}
        >
          <Car size={18} /> Publicaciones Activas en la Web ({publishedCount})
        </button>
      </div>

      {/* TAB 1: EDITOR VISUAL 1:1 */}
      {activeTab === "builder" && (
        <VisualWebBuilder
          agency={agency}
          onSave={handleSaveAgency}
          autoSavingStatus={autoSavingStatus}
        />
      )}

      {/* TAB 2: PUBLICACIONES ACTIVAS EN LA PAGINA WEB */}
      {activeTab === "publications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Summary Stats Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.76rem", opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>PUBLICADOS EN LA WEB</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#10b981", marginTop: "0.2rem" }}>
                {publishedCount} <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 500 }}>/ {vehicles.length} unidades</span>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.76rem", opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>DESTACADOS EN PORTAL</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#eab308", marginTop: "0.2rem" }}>
                {featuredCount} <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 500 }}>destacados</span>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.76rem", opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>VISITAS ESTIMADAS / MES</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#3b82f6", marginTop: "0.2rem" }}>
                1,420 <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 500 }}>visitas</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "220px" }}>
              <Search size={16} style={{ color: "var(--text-color)", opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Buscar vehículo por marca, modelo o año..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--text-color)",
                  outline: "none",
                  fontSize: "0.88rem",
                  width: "100%"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "Todos" },
                { id: "published", label: "👁️ Publicados" },
                { id: "hidden", label: "🙈 Ocultos" },
                { id: "featured", label: "⭐ Destacados" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id as any)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: filterMode === f.id ? 700 : 500,
                    border: "1px solid var(--border-color)",
                    backgroundColor: filterMode === f.id ? "var(--primary)" : "var(--bg-color)",
                    color: filterMode === f.id ? "white" : "var(--text-color)",
                    cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Web Catalog Table / Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filteredVehicles.map((v) => (
              <div
                key={v.id}
                style={{
                  backgroundColor: "var(--surface-color)",
                  border: v.is_featured_web ? "2px solid #eab308" : "1px solid var(--border-color)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  position: "relative"
                }}
              >
                {/* Vehicle Image */}
                <div style={{ height: "160px", position: "relative", backgroundColor: "#0f172a" }}>
                  <img
                    src={v.images?.[0] || "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                    alt={`${v.brand} ${v.model}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Status Badge */}
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: v.is_published_web ? "#10b981" : "#64748b",
                    color: "white",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}>
                    {v.is_published_web ? "PUBLICADO EN WEB" : "OCULTO DE WEB"}
                  </span>

                  {v.is_featured_web && (
                    <span style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "#eab308",
                      color: "#0f172a",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                    }}>
                      ⭐ DESTACADO
                    </span>
                  )}
                </div>

                {/* Body Details */}
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                  <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>
                    {v.brand}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                    {v.model}
                  </h3>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    <span style={{ opacity: 0.7 }}>Año {v.year}</span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>
                      USD {v.price.toLocaleString()}
                    </strong>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.85rem", borderTop: "1px solid var(--border-color)" }}>
                    <button
                      type="button"
                      onClick={() => toggleVehiclePublished(v.id)}
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        border: "1px solid var(--border-color)",
                        backgroundColor: v.is_published_web ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: v.is_published_web ? "#ef4444" : "#10b981",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem"
                      }}
                    >
                      {v.is_published_web ? <EyeOff size={13} /> : <Eye size={13} />}
                      {v.is_published_web ? "Ocultar de Web" : "Publicar en Web"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleVehicleFeatured(v.id)}
                      style={{
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        border: "1px solid var(--border-color)",
                        backgroundColor: v.is_featured_web ? "rgba(234, 179, 8, 0.2)" : "var(--bg-color)",
                        color: v.is_featured_web ? "#d97706" : "var(--text-color)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem"
                      }}
                    >
                      <Star size={13} style={{ fill: v.is_featured_web ? "#d97706" : "none" }} />
                      {v.is_featured_web ? "Destacado" : "Destacar"}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
