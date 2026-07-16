"use client";

import { useState, useTransition } from "react";
import { 
  Share2, 
  Link2, 
  Unlink2, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import styles from "./integrations.module.css";
import { updateIntegration, publishVehicle, unpublishVehicle, syncMercadoLibreListings } from "@/actions/autoActions";

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
  facebook: { connected: boolean; pageName?: string; token?: string };
  instagram: { connected: boolean; handle?: string };
  whatsapp: { connected: boolean; phoneNumber?: string };
}

interface Publication {
  id: string;
  vehicle_id: string;
  channel: 'mercadolibre' | 'facebook' | 'instagram';
  status: 'published' | 'pending' | 'failed';
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
}

export default function IntegrationsClient({
  initialVehicles,
  initialIntegrations,
  initialPublications,
  appId,
  appUrl
}: IntegrationsClientProps) {
  const [activeTab, setActiveTab] = useState<'connections' | 'publish' | 'active'>('connections');
  const [integrations, setIntegrations] = useState<Integrations>(initialIntegrations);
  const [publications, setPublications] = useState<Publication[]>(initialPublications);
  const [vehicles] = useState<Vehicle[]>(initialVehicles.filter(v => v.status === 'disponible'));
  const [isPending, startTransition] = useTransition();

  // Guías de integración abiertas
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({
    ml: false,
    meta: false,
    wa: false
  });

  // Modal de Conexión
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [connectData, setConnectData] = useState<Record<string, string>>({
    username: "",
    token: "",
    pageName: "",
    handle: "",
    phoneNumber: ""
  });

  // Checkboxes de publicación por vehículo
  const [selectedChannels, setSelectedChannels] = useState<Record<string, { ml: boolean; fb: boolean; ig: boolean }>>(() => {
    const initial: Record<string, { ml: boolean; fb: boolean; ig: boolean }> = {};
    initialVehicles.forEach(v => {
      initial[v.id] = { ml: false, fb: false, ig: false };
    });
    return initial;
  });

  const toggleGuide = (guide: string) => {
    setOpenGuides(prev => ({ ...prev, [guide]: !prev[guide] }));
  };

  const handleOpenConnect = (channel: string) => {
    setShowConnectModal(channel);
    // Cargar datos preexistentes si existen
    if (channel === 'mercadolibre') {
      setConnectData(prev => ({ ...prev, username: integrations.mercadolibre.username || "", token: integrations.mercadolibre.token || "" }));
    } else if (channel === 'facebook') {
      setConnectData(prev => ({ ...prev, pageName: integrations.facebook.pageName || "", token: integrations.facebook.token || "" }));
    } else if (channel === 'instagram') {
      setConnectData(prev => ({ ...prev, handle: integrations.instagram.handle || "" }));
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

  const handleSyncListings = async () => {
    startTransition(async () => {
      const res = await syncMercadoLibreListings();
      if (res.success) {
        alert(`Sincronización exitosa: se cargaron ${res.count} publicaciones.`);
        window.location.reload();
      } else {
        alert(`Error al sincronizar: ${res.error}`);
      }
    });
  };

  const handleChannelCheckboxChange = (vehicleId: string, channel: 'ml' | 'fb' | 'ig') => {
    setSelectedChannels(prev => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        [channel]: !prev[vehicleId][channel]
      }
    }));
  };

  const handlePublish = async (vehicleId: string) => {
    const channels = selectedChannels[vehicleId];
    if (!channels.ml && !channels.fb && !channels.ig) {
      alert("Por favor selecciona al menos un canal para publicar.");
      return;
    }

    startTransition(async () => {
      const updatedPubs = [...publications];

      if (channels.ml) {
        if (!integrations.mercadolibre.connected) {
          alert("Debes conectar primero MercadoLibre.");
          return;
        }
        const res = await publishVehicle(vehicleId, 'mercadolibre');
        if (res.success && res.data) updatedPubs.push(res.data as Publication);
      }
      if (channels.fb) {
        if (!integrations.facebook.connected) {
          alert("Debes conectar primero Facebook.");
          return;
        }
        const res = await publishVehicle(vehicleId, 'facebook');
        if (res.success && res.data) updatedPubs.push(res.data as Publication);
      }
      if (channels.ig) {
        if (!integrations.instagram.connected) {
          alert("Debes conectar primero Instagram.");
          return;
        }
        const res = await publishVehicle(vehicleId, 'instagram');
        if (res.success && res.data) updatedPubs.push(res.data as Publication);
      }

      setPublications(updatedPubs);
      
      // Limpiar checkbox
      setSelectedChannels(prev => ({
        ...prev,
        [vehicleId]: { ml: false, fb: false, ig: false }
      }));

      alert("¡Vehículo publicado exitosamente en los canales seleccionados!");
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Integración de Canales y Publicaciones
          </h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem" }}>
            Conecta tus cuentas comerciales y publica tu inventario en MercadoLibre, Facebook e Instagram de forma automatizada.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button 
          onClick={() => setActiveTab('connections')} 
          className={`${styles.tabBtn} ${activeTab === 'connections' ? styles.activeTabBtn : ''}`}
        >
          <Link2 size={16} /> Conexión de Canales
        </button>
        <button 
          onClick={() => setActiveTab('publish')} 
          className={`${styles.tabBtn} ${activeTab === 'publish' ? styles.activeTabBtn : ''}`}
        >
          <Share2 size={16} /> Publicar Inventario
        </button>
        <button 
          onClick={() => setActiveTab('active')} 
          className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTabBtn : ''}`}
        >
          <Sparkles size={16} /> Publicaciones Activas
          {publications.length > 0 && <span className={styles.badge}>{publications.length}</span>}
        </button>
      </div>

      {/* Tab content 1: Connections */}
      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className={styles.grid}>
            {/* Card MercadoLibre */}
            <div className={`${styles.card} ${integrations.mercadolibre.connected ? styles.cardConnected : ''}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.logoCircle} ${styles.logoMl}`}>ML</div>
                <div>
                  <h3 className={styles.cardTitle}>MercadoLibre</h3>
                  <p className={styles.cardSubtitle}>Publicación en listados y recepción de preguntas.</p>
                </div>
              </div>
              
              <div className={styles.statusSection}>
                {integrations.mercadolibre.connected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className={styles.statusSuccess}>
                      <CheckCircle2 size={16} /> Conectado como <strong>{integrations.mercadolibre.username}</strong>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        alignSelf: 'flex-start',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: (integrations.mercadolibre as any).mode === 'production' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: (integrations.mercadolibre as any).mode === 'production' ? '#10b981' : '#f59e0b'
                      }}
                    >
                      {(integrations.mercadolibre as any).mode === 'production' ? "Modo Real (Producción)" : "Modo Simulado (Pruebas)"}
                    </span>
                  </div>
                ) : (
                  <div className={styles.statusWarning}>
                    <AlertCircle size={16} /> No conectado
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                {integrations.mercadolibre.connected ? (
                  <button onClick={() => handleDisconnect('mercadolibre')} className={styles.btnDisconnect}>
                    <Unlink2 size={14} /> Desconectar
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      const authUrl = appId 
                        ? `https://auth.mercadolibre.com.uy/authorization?response_type=code&client_id=${appId}&redirect_uri=${appUrl}/api/auth/mercadolibre/callback`
                        : `/api/auth/mercadolibre/callback?code=mock_code_12345&mock=true`;
                      window.location.href = authUrl;
                    }} 
                    className={styles.btnConnectMl}
                  >
                    <Link2 size={14} /> Conectar MercadoLibre
                  </button>
                )}
              </div>

              <div className={styles.guideWrapper}>
                <button onClick={() => toggleGuide('ml')} className={styles.guideToggle}>
                  <HelpCircle size={14} /> Guía de Integración API {openGuides.ml ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {openGuides.ml && (
                  <div className={styles.guideContent}>
                    <h5>API Oficial de MercadoLibre (OAuth 2.0 & Publicaciones)</h5>
                    <p>Sigue las directivas oficiales de MercadoLibre para conectar tu sistema en producción:</p>
                    <ol style={{ paddingLeft: '1.25rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <li>Crea una aplicación en el portal de <strong>MercadoLibre Developers</strong> para obtener tu <code>client_id</code> y <code>client_secret</code>.</li>
                      <li>Registra un <code>redirect_uri</code> estático (obligatorio para evitar errores de <code>invalid_grant</code>).</li>
                      <li>Redirecciona al usuario para autorizar su cuenta comercial:
                        <pre style={{ fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', color: 'var(--text-color)' }}>
                          https://auth.mercadolibre.com.uy/authorization?response_type=code&amp;client_id=APP_ID&amp;redirect_uri=YOUR_URL
                        </pre>
                        <em>Tip: Si necesitas enviar información variable en la redirección, utiliza el parámetro <code>state</code>.</em>
                      </li>
                      <li>Intercambia el <code>code</code> obtenido por un token de acceso:
                        <pre style={{ fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', color: 'var(--text-color)' }}>
                          POST https://api.mercadolibre.com/oauth/token<br/>
                          Body (form-urlencoded):<br/>
                          grant_type=authorization_code&amp;client_id=APP_ID&amp;client_secret=SECRET&amp;code=CODE&amp;redirect_uri=YOUR_URL
                        </pre>
                      </li>
                      <li>Envía el token en la cabecera HTTP de todas las llamadas:
                        <pre style={{ fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', color: 'var(--text-color)' }}>
                          Authorization: Bearer APP_USR-...
                        </pre>
                      </li>
                      <li><strong>Refresh Token:</strong> El access token expira en 6 horas. Renuévalo con:
                        <pre style={{ fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', color: 'var(--text-color)' }}>
                          POST https://api.mercadolibre.com/oauth/token<br/>
                          Body: grant_type=refresh_token&amp;client_id=APP_ID&amp;client_secret=SECRET&amp;refresh_token=REFRESH_TOKEN
                        </pre>
                        <em>Nota: El refresh token es de un solo uso y se regenera en cada llamada.</em>
                      </li>
                    </ol>
                    <p style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}><strong>Publicación de Vehículo:</strong> POST a <code>https://api.mercadolibre.com/items</code> con el payload del vehículo.</p>
                    <p style={{ margin: 0 }}><strong>Mensajería:</strong> Configura un <strong>Webhook</strong> para el topic <code>questions</code> para atender en tiempo real las consultas de los leads.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Meta / Facebook */}
            <div className={`${styles.card} ${integrations.facebook.connected ? styles.cardConnected : ''}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.logoCircle} ${styles.logoFb}`}>FB</div>
                <div>
                  <h3 className={styles.cardTitle}>Facebook Pages</h3>
                  <p className={styles.cardSubtitle}>Posteos en el feed de la página y chat de Messenger.</p>
                </div>
              </div>

              <div className={styles.statusSection}>
                {integrations.facebook.connected ? (
                  <div className={styles.statusSuccess}>
                    <CheckCircle2 size={16} /> Conectado a <strong>{integrations.facebook.pageName}</strong>
                  </div>
                ) : (
                  <div className={styles.statusWarning}>
                    <AlertCircle size={16} /> No conectado
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                {integrations.facebook.connected ? (
                  <button onClick={() => handleDisconnect('facebook')} className={styles.btnDisconnect}>
                    <Unlink2 size={14} /> Desconectar
                  </button>
                ) : (
                  <button onClick={() => handleOpenConnect('facebook')} className={styles.btnConnectFb}>
                    <Link2 size={14} /> Conectar Página FB
                  </button>
                )}
              </div>

              <div className={styles.guideWrapper}>
                <button onClick={() => toggleGuide('meta')} className={styles.guideToggle}>
                  <HelpCircle size={14} /> Guía de Integración API {openGuides.meta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {openGuides.meta && (
                  <div className={styles.guideContent}>
                    <h5>Meta Graph API (Facebook & Instagram)</h5>
                    <p>Integración de publicaciones y mensajería:</p>
                    <ol>
                      <li>Crea una app en <strong>Meta for Developers</strong> tipo "Negocios".</li>
                      <li>Inicia sesión con Facebook y otorga permisos <code>pages_manage_posts</code>, <code>pages_show_list</code> y <code>pages_messaging</code>.</li>
                      <li>Obtén un <strong>Token de Acceso de Página</strong> de larga duración.</li>
                    </ol>
                    <p><strong>Publicar post con foto del auto:</strong></p>
                    <pre>POST https://graph.facebook.com/v20.0/&#123;page_id&#125;/photos</pre>
                    <p>Para la mensajería, suscribe tu servidor al webhook de <code>messages</code> en el producto Messenger.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Instagram */}
            <div className={`${styles.card} ${integrations.instagram.connected ? styles.cardConnected : ''}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.logoCircle} ${styles.logoIg}`}>IG</div>
                <div>
                  <h3 className={styles.cardTitle}>Instagram Professional</h3>
                  <p className={styles.cardSubtitle}>Posteos de fotos en feed e Instagram Direct.</p>
                </div>
              </div>

              <div className={styles.statusSection}>
                {integrations.instagram.connected ? (
                  <div className={styles.statusSuccess}>
                    <CheckCircle2 size={16} /> Conectado como <strong>{integrations.instagram.handle}</strong>
                  </div>
                ) : (
                  <div className={styles.statusWarning}>
                    <AlertCircle size={16} /> No conectado
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                {integrations.instagram.connected ? (
                  <button onClick={() => handleDisconnect('instagram')} className={styles.btnDisconnect}>
                    <Unlink2 size={14} /> Desconectar
                  </button>
                ) : (
                  <button onClick={() => handleOpenConnect('instagram')} className={styles.btnConnectIg}>
                    <Link2 size={14} /> Conectar Instagram
                  </button>
                )}
              </div>

              <div className={styles.guideWrapper}>
                <button onClick={() => toggleGuide('meta')} className={styles.guideToggle}>
                  <HelpCircle size={14} /> Guía de Integración API {openGuides.meta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {/* Card WhatsApp */}
            <div className={`${styles.card} ${integrations.whatsapp.connected ? styles.cardConnected : ''}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.logoCircle} ${styles.logoWa}`}>WA</div>
                <div>
                  <h3 className={styles.cardTitle}>WhatsApp Business</h3>
                  <p className={styles.cardSubtitle}>Recepción y envío de plantillas y chat libre.</p>
                </div>
              </div>

              <div className={styles.statusSection}>
                {integrations.whatsapp.connected ? (
                  <div className={styles.statusSuccess}>
                    <CheckCircle2 size={16} /> Conectado a <strong>{integrations.whatsapp.phoneNumber}</strong>
                  </div>
                ) : (
                  <div className={styles.statusWarning}>
                    <AlertCircle size={16} /> No conectado
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                {integrations.whatsapp.connected ? (
                  <button onClick={() => handleDisconnect('whatsapp')} className={styles.btnDisconnect}>
                    <Unlink2 size={14} /> Desconectar
                  </button>
                ) : (
                  <button onClick={() => handleOpenConnect('whatsapp')} className={styles.btnConnectWa}>
                    <Link2 size={14} /> Conectar WhatsApp API
                  </button>
                )}
              </div>

              <div className={styles.guideWrapper}>
                <button onClick={() => toggleGuide('wa')} className={styles.guideToggle}>
                  <HelpCircle size={14} /> Guía de Integración API {openGuides.wa ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {openGuides.wa && (
                  <div className={styles.guideContent}>
                    <h5>WhatsApp Business Cloud API</h5>
                    <p>Gestión de mensajes empresariales de WhatsApp:</p>
                    <ol>
                      <li>Configura tu cuenta de desarrollador en Meta y crea un número de prueba.</li>
                      <li>Vincula un número de teléfono comercial real y verifica tu negocio.</li>
                      <li>Obtén el ID del número de teléfono comercial.</li>
                    </ol>
                    <p><strong>Enviar mensaje (API de nube):</strong></p>
                    <pre>POST https://graph.facebook.com/v20.0/&#123;phone_number_id&#125;/messages</pre>
                    <p>Configura el Webhook en el panel de desarrollador de WhatsApp para escuchar el webhook del topic <code>messages</code>.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className={styles.infoBanner}>
            <Info size={20} />
            <div>
              <h4>Modo Simulación Activo</h4>
              <p>El sistema está ejecutándose en modo simulador interactivo para pruebas de usabilidad local. Los cambios se guardan permanentemente en el archivo local de base de datos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: Publish */}
      {activeTab === 'publish' && (
        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Inventario en Stock para Publicación
          </h2>

          {vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.5 }}>
              No hay vehículos en stock disponibles para publicar en este momento.
            </div>
          ) : (
            <div className={styles.vehiclesList}>
              {vehicles.map(v => {
                // Check if already published on any channel to show badges
                const mlPub = publications.find(p => p.vehicle_id === v.id && p.channel === 'mercadolibre');
                const fbPub = publications.find(p => p.vehicle_id === v.id && p.channel === 'facebook');
                const igPub = publications.find(p => p.vehicle_id === v.id && p.channel === 'instagram');

                return (
                  <div key={v.id} className={styles.vehicleItem}>
                    <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className={styles.vehicleImg} />
                    
                    <div className={styles.vehicleInfo}>
                      <h4>{v.brand} {v.model}</h4>
                      <p>{v.year} • {v.currency} {v.price.toLocaleString()}</p>
                      
                      <div className={styles.pubBadges}>
                        {mlPub && <span className={`${styles.pubBadge} ${styles.badgeMl}`}>MercadoLibre</span>}
                        {fbPub && <span className={`${styles.pubBadge} ${styles.badgeFb}`}>Facebook</span>}
                        {igPub && <span className={`${styles.pubBadge} ${styles.badgeIg}`}>Instagram</span>}
                      </div>
                    </div>

                    <div className={styles.channelSelectors}>
                      <div className={styles.channelCheckbox}>
                        <input 
                          type="checkbox" 
                          id={`ml-${v.id}`}
                          disabled={!!mlPub || !integrations.mercadolibre.connected}
                          checked={selectedChannels[v.id]?.ml || false}
                          onChange={() => handleChannelCheckboxChange(v.id, 'ml')}
                        />
                        <label htmlFor={`ml-${v.id}`} style={{ color: !integrations.mercadolibre.connected ? 'var(--text-muted)' : 'inherit' }}>
                          MercadoLibre {!integrations.mercadolibre.connected && "(Desconectado)"}
                        </label>
                      </div>

                      <div className={styles.channelCheckbox}>
                        <input 
                          type="checkbox" 
                          id={`fb-${v.id}`}
                          disabled={!!fbPub || !integrations.facebook.connected}
                          checked={selectedChannels[v.id]?.fb || false}
                          onChange={() => handleChannelCheckboxChange(v.id, 'fb')}
                        />
                        <label htmlFor={`fb-${v.id}`} style={{ color: !integrations.facebook.connected ? 'var(--text-muted)' : 'inherit' }}>
                          Facebook {!integrations.facebook.connected && "(Desconectado)"}
                        </label>
                      </div>

                      <div className={styles.channelCheckbox}>
                        <input 
                          type="checkbox" 
                          id={`ig-${v.id}`}
                          disabled={!!igPub || !integrations.instagram.connected}
                          checked={selectedChannels[v.id]?.ig || false}
                          onChange={() => handleChannelCheckboxChange(v.id, 'ig')}
                        />
                        <label htmlFor={`ig-${v.id}`} style={{ color: !integrations.instagram.connected ? 'var(--text-muted)' : 'inherit' }}>
                          Instagram {!integrations.instagram.connected && "(Desconectado)"}
                        </label>
                      </div>
                    </div>

                    <div className={styles.pubActions}>
                      <button 
                        onClick={() => handlePublish(v.id)} 
                        disabled={isPending}
                        className={styles.btnPublish}
                      >
                        {isPending ? <Loader2 className={styles.spin} size={14} /> : <Share2 size={14} />} 
                        Publicar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab content 3: Active Publications */}
      {activeTab === 'active' && (
        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Listados Activos en Canales Digitales
            </h2>
            {integrations.mercadolibre.connected && (
              <button 
                onClick={handleSyncListings}
                disabled={isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  cursor: 'pointer'
                }}
              >
                {isPending ? <Loader2 size={12} className={styles.spin} /> : <span style={{ fontSize: '1rem', lineHeight: 1 }}>↻</span>}
                Sincronizar MercadoLibre
              </button>
            )}
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
                    const vehicle = initialVehicles.find(v => v.id === p.vehicle_id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {vehicle?.images && (
                              <img src={vehicle.images[0]} alt="" style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
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
      )}

      {/* Modal Conexión */}
      {showConnectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Conectar Integración: {showConnectModal.toUpperCase()}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.25rem' }}>
              Ingresa los parámetros requeridos para establecer la conexión simulada.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {showConnectModal === 'mercadolibre' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Nombre de Usuario ML</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Concesionario Oficial ML"
                      value={connectData.username}
                      onChange={(e) => setConnectData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Token de Acceso Comercial / API Key</label>
                    <input 
                      type="password" 
                      placeholder="APP_USR-1234567890..."
                      value={connectData.token}
                      onChange={(e) => setConnectData(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {showConnectModal === 'facebook' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Nombre de la Fanpage de Facebook</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Automotora Premium S.A."
                      value={connectData.pageName}
                      onChange={(e) => setConnectData(prev => ({ ...prev, pageName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Token de Página de Larga Duración</label>
                    <input 
                      type="password" 
                      placeholder="EAAGb3B21c..."
                      value={connectData.token}
                      onChange={(e) => setConnectData(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {showConnectModal === 'instagram' && (
                <div className={styles.formGroup}>
                  <label>Nombre de Usuario de Instagram (Handle)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: @automotorapremium"
                    value={connectData.handle}
                    onChange={(e) => setConnectData(prev => ({ ...prev, handle: e.target.value }))}
                  />
                </div>
              )}

              {showConnectModal === 'whatsapp' && (
                <div className={styles.formGroup}>
                  <label>Número de Teléfono WhatsApp API</label>
                  <input 
                    type="text" 
                    placeholder="Ej: +598 99 999 999"
                    value={connectData.phoneNumber}
                    onChange={(e) => setConnectData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowConnectModal(null)} 
                className={styles.btnCancel}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleConnect(showConnectModal as any)} 
                className={styles.btnSaveConnect}
                disabled={isPending}
              >
                {isPending ? <Loader2 className={styles.spin} size={14} /> : "Establecer Conexión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
