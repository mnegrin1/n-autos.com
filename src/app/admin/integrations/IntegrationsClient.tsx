"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  Link2, 
  Unlink2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  MessageSquare, 
  Loader2, 
  Download,
  Info
} from "lucide-react";
import styles from "./integrations.module.css";
import { updateIntegration, unpublishVehicle, fetchMercadoLibreListings, importSelectedMLListings, importSocialPost, syncMetaConversations } from "@/actions/autoActions";

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

interface Integrations {
  mercadolibre: { connected: boolean; username?: string; token?: string; mode?: 'production' | 'simulation' };
  facebook: { connected: boolean; pageName?: string; token?: string; refresh_token?: string };
  instagram: { connected: boolean; handle?: string; token?: string; refresh_token?: string };
  whatsapp: { connected: boolean; phoneNumber?: string };
}

interface Publication {
  id?: string;
  vehicle_id: string;
  channel: 'mercadolibre' | 'facebook' | 'instagram';
  status: 'published' | 'pending' | 'failed';
  external_id?: string;
  external_url?: string;
  views?: number;
  questions_count?: number;
  published_at?: string;
}

interface IntegrationsClientProps {
  initialVehicles: Vehicle[];
  initialIntegrations: Integrations;
  initialPublications: Publication[];
  appId?: string;
  appUrl?: string;
  errorMsg?: string;
  successMsg?: string;
}

// Los mocks fueron eliminados. Se usará la API real.

export default function IntegrationsClient({
  initialVehicles,
  initialIntegrations,
  initialPublications,
  appId,
  appUrl,
  errorMsg,
  successMsg
}: IntegrationsClientProps) {
  const [integrations, setIntegrations] = useState<Integrations>(initialIntegrations);
  const [publications, setPublications] = useState<Publication[]>(initialPublications);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (errorMsg) {
      let msg = "Ocurrió un error al conectar la integración.";
      if (errorMsg === 'no_pages_found') {
        msg = "El usuario de Facebook inició sesión correctamente, pero no se encontró ninguna Página asociada o no se otorgaron los permisos necesarios. Por favor, asegúrate de tener una página creada y de seleccionarla al otorgar los permisos a la aplicación.";
      } else if (errorMsg === 'missing_credentials') {
        msg = "Falta la configuración de credenciales de Meta (Facebook/Instagram) en el servidor.";
      } else if (errorMsg === 'db_error_fb') {
        msg = "Error al guardar la integración de Facebook en la base de datos.";
      } else if (errorMsg === 'meta_callback_failed') {
        msg = "Fallo inesperado al procesar la respuesta de Meta.";
      } else {
        msg = `Error: ${errorMsg}`;
      }
      // Use setTimeout to ensure alert doesn't block immediate rendering of the page
      setTimeout(() => alert(msg), 100);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl);
    }
    if (successMsg) {
      setTimeout(() => alert("¡Integración conectada con éxito!"), 100);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl);
    }
  }, [errorMsg, successMsg]);

  // Modal de Conexión
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [connectData, setConnectData] = useState<Record<string, string>>({
    username: "",
    token: "",
    pageName: "",
    handle: "",
    phoneNumber: ""
  });

  // Modal de Importación y Carga de Posts
  const [showImportModal, setShowImportModal] = useState<'facebook' | 'instagram' | null>(null);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Modal de Sincronización ML
  const [showMLSyncModal, setShowMLSyncModal] = useState<boolean>(false);
  const [mlListings, setMlListings] = useState<any[]>([]);
  const [selectedMlItems, setSelectedMlItems] = useState<Set<string>>(new Set());
  const [isLoadingML, setIsLoadingML] = useState(false);
  const handleOpenConnect = (channel: string) => {
    if (channel === 'facebook' || channel === 'instagram') {
      window.location.href = '/api/auth/meta';
      return;
    }
    setShowConnectModal(channel);
    if (channel === 'mercadolibre') {
      setConnectData(prev => ({ ...prev, username: integrations.mercadolibre.username || "", token: integrations.mercadolibre.token || "" }));
    } else if (channel === 'whatsapp') {
      setConnectData(prev => ({ ...prev, phoneNumber: integrations.whatsapp.phoneNumber || "" }));
    }
  };

  const handleConnect = async (channel: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp') => {
    startTransition(async () => {
      const res = await updateIntegration(channel, true, connectData);
      if (res.success && res.integrations) {
        setIntegrations(res.integrations as Integrations);
        setShowConnectModal(null);
      }
    });
  };

  const handleDisconnect = async (channel: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp') => {
    if (confirm(`¿Estás seguro de que deseas desconectar la integración con ${channel.toUpperCase()}?`)) {
      startTransition(async () => {
        const res = await updateIntegration(channel, false);
        if (res.success && res.integrations) {
          setIntegrations(res.integrations as Integrations);
        }
      });
    }
  };

  const handleSyncMeta = async (channel: 'facebook' | 'instagram') => {
    startTransition(async () => {
      const res = await syncMetaConversations(channel);
      if (res.success) {
        alert(res.message);
      } else {
        alert(`Error al sincronizar: ${res.error}`);
      }
    });
  };

  const handleSyncListings = async () => {
    setIsLoadingML(true);
    setShowMLSyncModal(true);
    setMlListings([]);
    setSelectedMlItems(new Set());
    
    try {
      const res = await fetchMercadoLibreListings();
      if (res.success) {
        setMlListings(res.listings || []);
      } else {
        alert(`Error al buscar en MercadoLibre: ${res.error}`);
        setShowMLSyncModal(false);
      }
    } catch (err: any) {
      alert(`Error al sincronizar: ${err.message}`);
      setShowMLSyncModal(false);
    }
    setIsLoadingML(false);
  };

  const handleImportML = async () => {
    if (selectedMlItems.size === 0) return alert("Selecciona al menos una publicación");
    
    const selectedData = mlListings.filter(item => selectedMlItems.has(item.id));
    
    startTransition(async () => {
      const res = await importSelectedMLListings(selectedData);
      if (res.success) {
        alert(`Sincronización exitosa: se cargaron/actualizaron ${res.count} publicaciones.`);
        setShowMLSyncModal(false);
        window.location.reload();
      } else {
        alert(`Error al importar: ${res.error}`);
      }
    });
  };

  const handleUnpublish = async (vehicleId: string, channel: 'mercadolibre' | 'facebook' | 'instagram') => {
    if (confirm(`¿Desvincular esta publicación de ${channel.toUpperCase()}?`)) {
      startTransition(async () => {
        await unpublishVehicle(vehicleId, channel);
        setPublications(prev => prev.filter(p => !(p.vehicle_id === vehicleId && p.channel === channel)));
      });
    }
  };

  const handleImportSocial = async (channel: 'facebook' | 'instagram', post: any) => {
    if (publications.some(p => p.id === `pub-${channel}-${post.id}`)) {
      alert("Esta publicación ya fue importada anteriormente.");
      return;
    }
    
    startTransition(async () => {
      const res = await importSocialPost(channel, post);
      if (res.success && res.publication && res.vehicle) {
        setPublications(prev => [...prev, res.publication as Publication]);
        setVehicles(prev => [...prev, res.vehicle as Vehicle]);
        setShowImportModal(null);
        alert(`¡Publicación de ${channel} importada con éxito al inventario!`);
      } else {
        alert("Ocurrió un error al importar.");
      }
    });
  };

  const renderConnectionButton = (channel: 'mercadolibre' | 'facebook' | 'instagram', label: string, data: { connected: boolean, name?: string }) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          {data.connected ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#9ca3af" />}
          <span>{label}</span>
        </div>
        
        {data.connected ? (
          <button onClick={() => handleDisconnect(channel)} style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>
            Desconectar
          </button>
        ) : (
          <button onClick={() => {
            if (channel === 'mercadolibre') {
              const authUrl = appId 
                ? `https://auth.mercadolibre.com.uy/authorization?response_type=code&client_id=${appId}&redirect_uri=${appUrl}/api/auth/mercadolibre/callback`
                : `/api/auth/mercadolibre/callback?code=mock_code_12345&mock=true`;
              window.location.href = authUrl;
            } else {
              handleOpenConnect(channel);
            }
          }} style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
            Conectar
          </button>
        )}

        {data.connected && (channel === 'facebook' || channel === 'instagram') && (
          <button onClick={() => handleSyncMeta(channel)} disabled={isPending} style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#10b981', background: 'none', border: '1px solid #10b981', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>
            {isPending ? '...' : 'Sincronizar Chats'}
          </button>
        )}

        {data.connected && (
          <div className="tooltip-container" style={{ marginLeft: 'auto', cursor: 'help', position: 'relative' }}>
            <Info size={16} color="#6b7280" />
            <div className="tooltip" style={{
              position: 'absolute', top: '100%', right: '0', background: '#1f2937', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', marginTop: '8px', whiteSpace: 'nowrap', zIndex: 10, display: 'none', pointerEvents: 'none'
            }}>
              Conectado como: <strong>{data.name}</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Estilos inline para hover del tooltip sin CSS externo adicional */}
      <style dangerouslySetInnerHTML={{__html: `
        .tooltip-container:hover .tooltip { display: block !important; }
      `}} />

      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Canales y Publicaciones
          </h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem" }}>
            Administra tus integraciones y visualiza tus publicaciones activas en MercadoLibre, Facebook e Instagram.
          </p>
        </div>
      </div>

      {/* Top Bar de Conexiones */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {renderConnectionButton('mercadolibre', 'MercadoLibre', { connected: integrations.mercadolibre.connected, name: integrations.mercadolibre.username })}
        {renderConnectionButton('facebook', 'Facebook', { connected: integrations.facebook.connected, name: integrations.facebook.pageName })}
        {renderConnectionButton('instagram', 'Instagram', { connected: integrations.instagram.connected, name: integrations.instagram.handle })}
        {renderConnectionButton('whatsapp', 'WhatsApp', { connected: integrations.whatsapp.connected, name: integrations.whatsapp.phoneNumber })}
      </div>

      {/* Main Content: Active Publications */}
      <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            Listados Activos
          </h2>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={async () => {
                if (!integrations.facebook.connected) return alert("Conecta Facebook primero.");
                setShowImportModal('facebook');
                setIsLoadingPosts(true);
                setSocialPosts([]);
                try {
                  const res = await fetch('/api/meta/posts?channel=facebook');
                  const data = await res.json();
                  if (data.success) {
                    setSocialPosts(data.posts);
                  } else {
                    alert("Error cargando posts: " + data.error);
                  }
                } catch (e) {
                  alert("Error cargando posts.");
                }
                setIsLoadingPosts(false);
              }}
              className={styles.btnPublish}
              style={{ background: '#1877F2', borderColor: '#1877F2', opacity: integrations.facebook.connected ? 1 : 0.5 }}
            >
              <Download size={14} /> Importar de FB
            </button>
            <button 
              onClick={async () => {
                if (!integrations.instagram.connected) return alert("Conecta Instagram primero.");
                setShowImportModal('instagram');
                setIsLoadingPosts(true);
                setSocialPosts([]);
                try {
                  const res = await fetch('/api/meta/posts?channel=instagram');
                  const data = await res.json();
                  if (data.success) {
                    setSocialPosts(data.posts);
                  } else {
                    alert("Error cargando posts: " + data.error);
                  }
                } catch (e) {
                  alert("Error cargando posts.");
                }
                setIsLoadingPosts(false);
              }}
              className={styles.btnPublish}
              style={{ background: '#E1306C', borderColor: '#E1306C', opacity: integrations.instagram.connected ? 1 : 0.5 }}
            >
              <Download size={14} /> Importar de IG
            </button>
            <button 
              onClick={handleSyncListings}
              disabled={!integrations.mercadolibre.connected || isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px',
                backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: (!integrations.mercadolibre.connected || isPending) ? 'not-allowed' : 'pointer',
                opacity: (!integrations.mercadolibre.connected) ? 0.5 : 1
              }}
            >
              {isPending ? <Loader2 size={14} className={styles.spin} /> : <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>↻</span>}
              Sincronizar MercadoLibre
            </button>
          </div>
        </div>

        {publications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.5 }}>
            No hay publicaciones activas registradas en los canales.
          </div>
        ) : (
          <div className={styles.publicationsTableWrapper}>
            <table className={styles.pubTable}>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Canal</th>
                  <th>Estado</th>
                  <th>Visitas / Leads</th>
                  <th>Fecha Pub.</th>
                  <th>Enlace Externo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {publications.map(p => {
                  const vehicle = vehicles.find(v => v.id === p.vehicle_id);
                  return (
                    <tr key={p.id || p.external_id || Math.random().toString()}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {vehicle?.images && vehicle.images.length > 0 ? (
                            <img src={vehicle.images[0]} alt="" style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '30px', borderRadius: '4px', background: '#e5e7eb' }}></div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Desconocido"}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>ID: {p.vehicle_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.channelTag} ${
                          p.channel === 'mercadolibre' ? styles.tagMl : p.channel === 'facebook' ? styles.tagFb : styles.tagIg
                        }`}>
                          {p.channel === 'mercadolibre' ? "MercadoLibre" : p.channel === 'facebook' ? "Facebook" : "Instagram"}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusBadgeLive}>Publicado</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Eye size={12} /> {p.views || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MessageSquare size={12} /> {p.questions_count || 0}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {p.published_at ? new Date(p.published_at).toLocaleDateString() : 'Reciente'}
                      </td>
                      <td>
                        <a href={p.external_url} target="_blank" rel="noreferrer" className={styles.externalLink}>
                          Visitar <ExternalLink size={12} />
                        </a>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleUnpublish(p.vehicle_id, p.channel)}
                          disabled={isPending}
                          className={styles.btnUnpublish}
                        >
                          <Unlink2 size={12} /> Pausar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Conexión Genérico */}
      {showConnectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Conectar Integración: {showConnectModal.toUpperCase()}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.25rem' }}>
              Ingresa los parámetros requeridos para establecer la conexión simulada.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {showConnectModal === 'whatsapp' && (
                <div className={styles.formGroup}>
                  <label>Número de WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="Ej: +59899123456"
                    value={connectData.phoneNumber}
                    onChange={(e) => setConnectData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowConnectModal(null)} className={styles.btnCancel} disabled={isPending}>
                Cancelar
              </button>
              <button onClick={() => handleConnect(showConnectModal as any)} className={styles.btnSaveConnect} disabled={isPending}>
                {isPending ? <Loader2 className={styles.spin} size={14} /> : "Establecer Conexión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar FB/IG */}
      {showImportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }}>
            <h3>Importar Posteos de {showImportModal === 'facebook' ? 'Facebook' : 'Instagram'}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.25rem' }}>
              Selecciona una publicación reciente de tu perfil para importarla como vehículo al inventario.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
              {isLoadingPosts ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  <Loader2 className={styles.spin} size={24} style={{ margin: '0 auto' }} />
                  <p>Cargando publicaciones reales...</p>
                </div>
              ) : socialPosts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  No se encontraron publicaciones.
                </div>
              ) : (
                socialPosts.map(post => {
                  const isImported = publications.some(p => p.external_id === post.id || p.external_url === post.external_url);
                  return (
                    <div key={post.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'center' }}>
                      {post.images && post.images.length > 0 ? (
                        <img src={post.images[0]} alt="" style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '4px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>Sin imagen</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{new Date(post.date).toLocaleString()}</div>
                        <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.description || "Sin descripción"}
                        </div>
                        <a href={post.external_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', display: 'inline-block' }}>Ver post original</a>
                      </div>
                      <button 
                        onClick={() => handleImportSocial(showImportModal, post)}
                        disabled={isImported || isPending}
                        className={styles.btnPublish}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: isImported ? 'var(--bg-secondary)' : 'var(--primary)', color: isImported ? 'var(--text-muted)' : 'white', borderColor: isImported ? 'var(--border-color)' : 'var(--primary)' }}
                      >
                        {isPending ? <Loader2 size={12} className={styles.spin} /> : (isImported ? "Importado" : "Importar")}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.modalActions} style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImportModal(null)} className={styles.btnCancel} disabled={isPending}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Sincronización Mercado Libre */}
      {showMLSyncModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '700px', width: '90%' }}>
            <h3>Publicaciones de Mercado Libre</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.25rem' }}>
              Selecciona las publicaciones que deseas importar al inventario del CRM. Se muestran publicaciones activas y pausadas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {isLoadingML ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  <Loader2 className={styles.spin} size={24} style={{ margin: '0 auto' }} />
                  <p>Buscando en Mercado Libre...</p>
                </div>
              ) : mlListings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  No se encontraron publicaciones en Mercado Libre.
                </div>
              ) : (
                mlListings.map(item => {
                  const isImported = publications.some(p => p.external_id === item.id || p.external_url === item.permalink);
                  const isSelected = selectedMlItems.has(item.id);
                  const statusLabel = item.status === 'active' ? 'Activa' : (item.status === 'paused' ? 'Pausada' : item.status);
                  const statusColor = item.status === 'active' ? '#10b981' : '#f59e0b';
                  
                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', gap: '1rem', padding: '1rem', 
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`, 
                        borderRadius: '8px', alignItems: 'center',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                        cursor: isImported ? 'default' : 'pointer',
                        opacity: isImported ? 0.6 : 1
                      }}
                      onClick={() => {
                        if (isImported) return;
                        const newSet = new Set(selectedMlItems);
                        if (newSet.has(item.id)) newSet.delete(item.id);
                        else newSet.add(item.id);
                        setSelectedMlItems(newSet);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected || isImported} 
                        disabled={isImported}
                        onChange={() => {}}
                        style={{ cursor: isImported ? 'default' : 'pointer' }}
                      />
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '4px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>Sin imagen</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: statusColor, fontWeight: 600, marginBottom: '4px' }}>
                          {statusLabel}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {item.currency} {item.price.toLocaleString()}
                        </div>
                        <a href={item.permalink} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', display: 'inline-block' }} onClick={e => e.stopPropagation()}>Ver original</a>
                      </div>
                      {isImported && <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Importado</span>}
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.modalActions} style={{ justifyContent: 'space-between' }}>
              <button onClick={() => setShowMLSyncModal(false)} className={styles.btnCancel} disabled={isPending}>
                Cancelar
              </button>
              
              <button 
                onClick={handleImportML} 
                className={styles.btnPublish} 
                disabled={isPending || isLoadingML || selectedMlItems.size === 0}
                style={{ padding: '8px 16px', fontWeight: 600 }}
              >
                {isPending ? <Loader2 size={14} className={styles.spin} /> : "Importar Seleccionados"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
