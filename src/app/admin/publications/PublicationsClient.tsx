"use client";

import { useState, useEffect, useTransition } from "react";
import { Link2, ExternalLink, Eye, MessageSquare, Car, Plus, RefreshCw, X, Check, Share2, Globe, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrUpdatePublication, importAndPublishToWeb, importSocialPost } from "@/actions/autoActions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  images: string[];
  status: string;
}

interface Publication {
  id?: string;
  vehicle_id: string;
  channel: 'web' | 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp';
  status: 'published' | 'pending' | 'failed';
  external_id?: string;
  external_url?: string;
  views?: number;
  questions_count?: number;
  published_at?: string;
}

interface PublicationsClientProps {
  vehicles: Vehicle[];
  publications: Publication[];
}

const NATIVE_URLS = {
  web: "/portal/demo",
  mercadolibre: "https://vender.mercadolibre.com.ar/sell/",
  facebook: "https://business.facebook.com/latest/composer",
  instagram: "https://www.instagram.com/create/select/",
  whatsapp: "https://web.whatsapp.com/"
};

// Mocks de publicaciones disponibles en canales externos para importar
const MOCK_EXTERNAL_POSTS = [
  {
    id: "fb-post-101",
    channel: "facebook",
    title: "Toyota Hilux 2.8 SRX 4x4 2021",
    price: 38500,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-20",
    url: "https://www.facebook.com/marketplace/item/101"
  },
  {
    id: "ml-post-202",
    channel: "mercadolibre",
    title: "Volkswagen Amarok V6 Black Edition 2022",
    price: 42000,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-21",
    url: "https://articulo.mercadolibre.com.ar/MLA-202"
  },
  {
    id: "ig-ad-303",
    channel: "instagram",
    title: "BMW 330i M Sport 2.0 Turbo 2020",
    price: 49900,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-22",
    url: "https://www.instagram.com/p/303"
  }
];

export default function PublicationsClient({ vehicles, publications: initialPublications }: PublicationsClientProps) {
  const router = useRouter();
  const [publications, setPublications] = useState<Publication[]>(initialPublications);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedSecs, setLastSyncedSecs] = useState(0);

  // Modal "+ Publicar" State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || "");
  const [selectedChannel, setSelectedChannel] = useState<'web' | 'mercadolibre' | 'facebook' | 'instagram'>('web');
  const [customUrl, setCustomUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingWebId, setPublishingWebId] = useState<string | null>(null);

  // Modal "Importar Redes / ML" State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingPostId, setImportingPostId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Keep state in sync with server props
  useEffect(() => {
    setPublications(initialPublications);
  }, [initialPublications]);

  // Periodic Auto-refresh every 60 seconds (1 minute)
  useEffect(() => {
    const timer = setInterval(() => {
      handleManualRefresh();
    }, 60000);

    const secondsTimer = setInterval(() => {
      setLastSyncedSecs(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(secondsTimer);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setLastSyncedSecs(0);
      setTimeout(() => setIsRefreshing(false), 800);
    });
  };

  // Acción 1-Clic: Publicar en la Página Web
  const handlePublishToWeb = async (vehicleId: string, sourceChannel: string) => {
    setPublishingWebId(vehicleId);
    try {
      const res = await importAndPublishToWeb({
        vehicleId,
        sourceChannel
      });

      if (res.success && res.publication) {
        const newWebPub = res.publication as Publication;
        setPublications(prev => {
          const exists = prev.some(p => p.vehicle_id === newWebPub.vehicle_id && p.channel === 'web');
          if (exists) {
            return prev.map(p => p.vehicle_id === newWebPub.vehicle_id && p.channel === 'web' ? { ...p, ...newWebPub } : p);
          }
          return [newWebPub, ...prev];
        });
        alert("¡Vehículo publicado con éxito en la Página Web / Portal!");
        handleManualRefresh();
      } else {
        alert(`No se pudo publicar en la web: ${res.error || 'Error desconocido'}`);
      }
    } catch (err: any) {
      alert("Error al publicar en la web: " + err.message);
    } finally {
      setPublishingWebId(null);
    }
  };

  // Crear/Sincronizar Publicación desde Modal
  const handlePublishAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert("Por favor selecciona un vehículo de tu inventario.");
      return;
    }

    setIsSubmitting(true);

    const defaultChannelUrl = selectedChannel === 'web' 
      ? `/portal/demo/${selectedVehicleId}` 
      : NATIVE_URLS[selectedChannel];
    const destinationUrl = customUrl.trim() || defaultChannelUrl;

    try {
      // Si es un canal externo, abrir la página nativa
      if (selectedChannel !== 'web') {
        window.open(destinationUrl, "_blank", "noopener,noreferrer");
      }

      // Registrar la publicación en Supabase
      const res = await createOrUpdatePublication({
        vehicleId: selectedVehicleId,
        channel: selectedChannel,
        externalUrl: destinationUrl
      });

      if (res.success && res.publication) {
        const newPub = res.publication as Publication;
        setPublications(prev => {
          const exists = prev.some(p => p.vehicle_id === newPub.vehicle_id && p.channel === newPub.channel);
          if (exists) {
            return prev.map(p => p.vehicle_id === newPub.vehicle_id && p.channel === newPub.channel ? { ...p, ...newPub } : p);
          }
          return [newPub, ...prev];
        });

        setIsPublishModalOpen(false);
        setCustomUrl("");
        handleManualRefresh();

        if (selectedChannel === 'web') {
          alert("¡Vehículo publicado en tu Aplicación / Portal Web exitosamente!");
        }
      } else {
        alert(`Ocurrió un aviso al sincronizar: ${res.error || 'Error desconocido'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error al sincronizar la publicación: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Importar anuncio de Redes Sociales / MercadoLibre y publicar en Web App
  const handleImportAndPublishToWeb = async (post: typeof MOCK_EXTERNAL_POSTS[0]) => {
    setImportingPostId(post.id);
    try {
      const res = await importSocialPost(post.channel as 'facebook' | 'instagram', {
        id: post.id,
        title: post.title,
        price: post.price,
        currency: post.currency,
        images: [post.image],
        external_url: post.url,
        description: `Importado desde ${post.channel} y publicado en Página Web.`
      });

      if (res.success && res.publication) {
        // También aseguramos la publicación web
        const webRes = await importAndPublishToWeb({
          vehicleId: res.vehicle.id,
          sourceChannel: post.channel,
          externalUrl: post.url
        });

        if (webRes.success && webRes.publication) {
          setPublications(prev => [webRes.publication as Publication, res.publication as Publication, ...prev]);
        }

        alert(`¡Anuncio "${post.title}" importado de ${post.channel.toUpperCase()} y publicado en la Página Web!`);
        setIsImportModalOpen(false);
        handleManualRefresh();
      } else {
        alert("Error al importar anuncio.");
      }
    } catch (err: any) {
      alert("Error al importar anuncio: " + err.message);
    } finally {
      setImportingPostId(null);
    }
  };

  const filteredPubs = publications.filter(pub => {
    const v = vehicles.find(v => v.id === pub.vehicle_id);
    if (!v) return false;
    
    if (selectedChannelFilter !== "all" && pub.channel !== selectedChannelFilter) {
      return false;
    }

    const searchStr = `${v.brand} ${v.model} ${pub.channel}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header & Primary Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-color)", margin: "0 0 0.5rem 0" }}>
            Publicaciones y Canales
          </h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0 }}>
            Gestiona la presencia de tus vehículos en la **Página Web**, **MercadoLibre**, **Facebook** e **Instagram Ads**.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Sync indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.8, backgroundColor: "var(--surface-color)", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block" }}></span>
            <span>Auto-refresco 1m ({lastSyncedSecs}s)</span>
            <button 
              onClick={handleManualRefresh}
              title="Refrescar ahora"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center", padding: "2px" }}
            >
              <RefreshCw size={14} className={isRefreshing || isPending ? "spin-animation" : ""} />
            </button>
          </div>

          {/* Import Buttons for FB, IG, ML */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.9rem",
              backgroundColor: "transparent",
              color: "var(--text-color)",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1877F2"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-color)"}
          >
            <Download size={15} /> Importar de FB
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.9rem",
              backgroundColor: "transparent",
              color: "var(--text-color)",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#E1306C"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-color)"}
          >
            <Download size={15} /> Importar de IG
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.9rem",
              backgroundColor: "transparent",
              color: "var(--text-color)",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#eab308"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-color)"}
          >
            <Download size={15} /> Importar de ML
          </button>

          {/* New Publish Button */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.2rem",
              backgroundColor: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <Plus size={18} /> Publicar
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        {/* Channel Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "var(--surface-color)", padding: "0.25rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          {[
            { id: "all", label: "Todos" },
            { id: "web", label: "🌐 Página Web" },
            { id: "mercadolibre", label: "MercadoLibre" },
            { id: "facebook", label: "Facebook" },
            { id: "instagram", label: "Instagram Ads" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedChannelFilter(tab.id)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: selectedChannelFilter === tab.id ? "var(--primary)" : "transparent",
                color: selectedChannelFilter === tab.id ? "#fff" : "var(--text-color)",
                fontWeight: selectedChannelFilter === tab.id ? 600 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input 
          type="text"
          placeholder="Buscar por vehículo o canal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.55rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-color)",
            color: "var(--text-color)",
            width: "260px",
            fontSize: "0.85rem"
          }}
        />
      </div>

      {/* Publications List */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredPubs.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3.5rem 1.5rem", 
            backgroundColor: "var(--surface-color)", 
            borderRadius: "12px",
            border: "1px dashed var(--border-color)"
          }}>
            <Car size={36} style={{ color: "var(--text-color)", opacity: 0.3, marginBottom: "0.75rem" }} />
            <p style={{ color: "var(--text-color)", opacity: 0.7, margin: "0 0 1rem 0", fontWeight: 500 }}>No hay publicaciones que coincidan con los criterios.</p>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Publicar primer vehículo
            </button>
          </div>
        ) : (
          filteredPubs.map(pub => {
            const v = vehicles.find(v => v.id === pub.vehicle_id);
            if (!v) return null;

            // Verificar si este vehículo ya está publicado en la Página Web
            const isAlreadyOnWeb = publications.some(p => p.vehicle_id === pub.vehicle_id && p.channel === 'web');

            return (
              <div 
                key={`${pub.channel}-${pub.vehicle_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  {v.images && v.images[0] ? (
                    <img 
                      src={v.images[0]} 
                      alt={v.brand} 
                      style={{ width: "65px", height: "65px", objectFit: "cover", borderRadius: "8px" }} 
                    />
                  ) : (
                    <div style={{ width: "65px", height: "65px", backgroundColor: "var(--border-color)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Car size={24} color="var(--text-color)" opacity={0.5} />
                    </div>
                  )}
                  
                  <div>
                    <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem", color: "var(--text-color)", fontWeight: 600 }}>
                      {v.brand} {v.model} <span style={{ opacity: 0.6, fontSize: "0.85rem", fontWeight: 400 }}>({v.year})</span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.2rem 0.65rem", 
                        borderRadius: "6px", 
                        backgroundColor: pub.channel === 'web' ? '#10B981' : pub.channel === 'mercadolibre' ? '#FFE600' : pub.channel === 'facebook' ? '#1877F2' : pub.channel === 'instagram' ? '#E1306C' : '#25D366',
                        color: (pub.channel === 'mercadolibre' || pub.channel === 'web') ? '#fff' : '#fff',
                        fontWeight: 700,
                        textTransform: "capitalize"
                      }}>
                        {pub.channel === 'web' ? '🌐 Página Web' : pub.channel === 'mercadolibre' ? 'MercadoLibre' : pub.channel === 'instagram' ? 'Instagram Ads' : pub.channel}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-color)", opacity: 0.8, fontWeight: 500 }}>
                        {v.currency} {v.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "1.25rem", color: "var(--text-color)", opacity: 0.7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }} title="Visitas">
                      <Eye size={16} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{pub.views || 0}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }} title="Consultas / Preguntas">
                      <MessageSquare size={16} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{pub.questions_count || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {/* Botón 1-Clic: Publicar en Página Web (si proviene de red social / ML) */}
                    {pub.channel !== 'web' && !isAlreadyOnWeb && (
                      <button
                        onClick={() => handlePublishToWeb(v.id, pub.channel)}
                        disabled={publishingWebId === v.id}
                        title="Publicar este vehículo en la Aplicación / Portal Web"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.45rem 0.85rem",
                          backgroundColor: "#10B981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: publishingWebId === v.id ? "not-allowed" : "pointer",
                          opacity: publishingWebId === v.id ? 0.7 : 1
                        }}
                      >
                        <Globe size={14} />
                        {publishingWebId === v.id ? "Publicando..." : "Publicar en Web App"}
                      </button>
                    )}

                    {pub.external_url ? (
                      <a 
                        href={pub.external_url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.45rem 0.8rem",
                          backgroundColor: "transparent",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          color: "var(--text-color)",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          fontWeight: 500
                        }}
                      >
                        <ExternalLink size={14} /> {pub.channel === 'web' ? 'Ver en Web' : 'Ver Nativo'}
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.5 }}>Sin URL</span>
                    )}

                    <Link
                      href={`/admin/vehicles?action=edit&id=${v.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.45rem 0.8rem",
                        backgroundColor: "var(--primary-light)",
                        border: "1px solid var(--primary-light)",
                        borderRadius: "6px",
                        color: "var(--primary)",
                        fontSize: "0.8rem",
                        textDecoration: "none",
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: NUEVA PUBLICACIÓN (+ PUBLICAR) */}
      {isPublishModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "540px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Share2 size={20} color="var(--primary)" />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-color)" }}>
                  Publicar Vehículo en Canales
                </h2>
              </div>
              <button 
                onClick={() => setIsPublishModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePublishAndSync} style={{ padding: "1.5rem" }}>
              {/* Selector de Vehículo */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", marginBottom: "0.5rem" }}>
                  1. Selecciona el Vehículo de tu Inventario:
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                  required
                >
                  <option value="" disabled>-- Elige un vehículo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.year}) - {v.currency} {v.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vista Previa del Vehículo Seleccionado */}
              {selectedVehicle && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "var(--bg-color)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  marginBottom: "1.25rem"
                }}>
                  {selectedVehicle.images && selectedVehicle.images[0] ? (
                    <img src={selectedVehicle.images[0]} alt="" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
                  ) : (
                    <div style={{ width: "50px", height: "50px", backgroundColor: "var(--border-color)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Car size={20} opacity={0.5} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-color)" }}>
                      {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                      {selectedVehicle.currency} {selectedVehicle.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de Canal / Plataforma */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)", marginBottom: "0.5rem" }}>
                  2. Selecciona el Canal de Destino:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('web')}
                    style={{
                      padding: "0.75rem 0.25rem",
                      borderRadius: "8px",
                      border: selectedChannel === 'web' ? "2px solid #10B981" : "1px solid var(--border-color)",
                      backgroundColor: selectedChannel === 'web' ? "rgba(16, 185, 129, 0.15)" : "var(--bg-color)",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <Globe size={18} color="#10B981" />
                    Página Web
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('mercadolibre')}
                    style={{
                      padding: "0.75rem 0.25rem",
                      borderRadius: "8px",
                      border: selectedChannel === 'mercadolibre' ? "2px solid #FFE600" : "1px solid var(--border-color)",
                      backgroundColor: selectedChannel === 'mercadolibre' ? "rgba(255, 230, 0, 0.15)" : "var(--bg-color)",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span style={{ backgroundColor: "#FFE600", color: "#333", padding: "2px 5px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>ML</span>
                    MercadoLibre
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('facebook')}
                    style={{
                      padding: "0.75rem 0.25rem",
                      borderRadius: "8px",
                      border: selectedChannel === 'facebook' ? "2px solid #1877F2" : "1px solid var(--border-color)",
                      backgroundColor: selectedChannel === 'facebook' ? "rgba(24, 119, 242, 0.15)" : "var(--bg-color)",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span style={{ backgroundColor: "#1877F2", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>FB</span>
                    Facebook
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('instagram')}
                    style={{
                      padding: "0.75rem 0.25rem",
                      borderRadius: "8px",
                      border: selectedChannel === 'instagram' ? "2px solid #E1306C" : "1px solid var(--border-color)",
                      backgroundColor: selectedChannel === 'instagram' ? "rgba(225, 48, 108, 0.15)" : "var(--bg-color)",
                      color: "var(--text-color)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span style={{ backgroundColor: "#E1306C", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>IG</span>
                    Instagram Ads
                  </button>
                </div>
              </div>

              {/* URL Nativa u Opcional */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-color)", opacity: 0.8, marginBottom: "0.35rem" }}>
                  URL de la publicación (opcional):
                </label>
                <input
                  type="text"
                  placeholder={selectedChannel === 'web' ? `/portal/demo/${selectedVehicleId}` : NATIVE_URLS[selectedChannel]}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <ExternalLink size={16} />
                  {isSubmitting ? "Procesando..." : selectedChannel === 'web' ? "Publicar en Página Web" : "Publicar y Sincronizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORTAR DESDE REDES / ML A PÁGINA WEB */}
      {isImportModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Download size={20} color="var(--primary)" />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-color)" }}>
                  Importar Anuncios a la Página Web
                </h2>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-color)", opacity: 0.8, margin: "0 0 1.25rem 0" }}>
                Selecciona publicaciones o anuncios de **Facebook**, **MercadoLibre** o **Instagram Ads** para importarlos a tu catálogo e integrarlos automáticamente a tu **Página Web**:
              </p>

              <div style={{ display: "grid", gap: "1rem" }}>
                {MOCK_EXTERNAL_POSTS.map(post => (
                  <div 
                    key={post.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      backgroundColor: "var(--bg-color)",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <img src={post.image} alt="" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-color)" }}>
                          {post.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                          <span style={{ 
                            fontSize: "0.7rem", 
                            padding: "0.15rem 0.5rem", 
                            borderRadius: "4px", 
                            backgroundColor: post.channel === 'mercadolibre' ? '#FFE600' : post.channel === 'facebook' ? '#1877F2' : '#E1306C',
                            color: post.channel === 'mercadolibre' ? '#333' : '#fff',
                            fontWeight: 700,
                            textTransform: "uppercase"
                          }}>
                            {post.channel}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                            {post.currency} {post.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportAndPublishToWeb(post)}
                      disabled={importingPostId === post.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.5rem 0.85rem",
                        backgroundColor: "#10B981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: importingPostId === post.id ? "not-allowed" : "pointer",
                        opacity: importingPostId === post.id ? 0.7 : 1
                      }}
                    >
                      <Globe size={14} />
                      {importingPostId === post.id ? "Importando..." : "Importar a Web"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS helper for spinning refresh icon */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
