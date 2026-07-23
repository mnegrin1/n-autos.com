"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ShoppingBag,
  Share2,
  MessageSquare,
  PhoneCall,
  Unlink2,
  Link2
} from "lucide-react";
import styles from "./integrations.module.css";
import { updateIntegration, syncMetaConversations } from "@/actions/autoActions";

interface Integrations {
  mercadolibre: { connected: boolean; username?: string; token?: string; mode?: 'production' | 'simulation' };
  facebook: { connected: boolean; pageName?: string; token?: string; refresh_token?: string };
  instagram: { connected: boolean; handle?: string; token?: string; refresh_token?: string };
  whatsapp: { connected: boolean; phoneNumber?: string };
}

interface IntegrationsClientProps {
  initialVehicles?: any[];
  initialIntegrations: Integrations;
  initialPublications?: any[];
  appId?: string;
  appUrl?: string;
  errorMsg?: string;
  successMsg?: string;
}

export default function IntegrationsClient({
  initialIntegrations,
  appId,
  appUrl,
  errorMsg,
  successMsg
}: IntegrationsClientProps) {
  const [integrations, setIntegrations] = useState<Integrations>(initialIntegrations);
  const [isPending, startTransition] = useTransition();

  // Modal State para WhatsApp o credenciales manuales
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [connectData, setConnectData] = useState<Record<string, string>>({
    username: "",
    token: "",
    phoneNumber: ""
  });

  useEffect(() => {
    if (errorMsg) {
      let msg = "Ocurrió un error al conectar la integración.";
      if (errorMsg === 'no_pages_found') {
        msg = "No se encontró ninguna Página de Facebook vinculada a una cuenta de Instagram Business o faltan permisos.";
      } else if (errorMsg === 'missing_credentials') {
        msg = "Falta la configuración de credenciales de Meta en el servidor.";
      } else {
        msg = `Error: ${errorMsg}`;
      }
      setTimeout(() => alert(msg), 100);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('detail');
      window.history.replaceState({}, '', newUrl);
    }
    if (successMsg) {
      setTimeout(() => alert("¡Integración conectada con éxito!"), 100);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl);
    }
  }, [errorMsg, successMsg]);

  const handleOpenConnect = (channel: string) => {
    if (channel === 'facebook') {
      window.location.href = '/api/auth/facebook';
      return;
    }
    if (channel === 'instagram') {
      window.location.href = '/api/auth/instagram';
      return;
    }
    if (channel === 'mercadolibre') {
      const authUrl = appId 
        ? `https://auth.mercadolibre.com.uy/authorization?response_type=code&client_id=${appId}&redirect_uri=${appUrl}/api/auth/mercadolibre/callback`
        : `/api/auth/mercadolibre/callback?code=mock_code_12345&mock=true`;
      window.location.href = authUrl;
      return;
    }
    setShowConnectModal(channel);
  };

  const handleConnectSubmit = async (channel: 'whatsapp' | 'mercadolibre') => {
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

  const channelList = [
    {
      id: 'mercadolibre' as const,
      name: 'MercadoLibre',
      description: 'Sincronización automática de inventario y publicaciones en MercadoLibre Autos.',
      icon: ShoppingBag,
      bgAccent: 'rgba(234, 179, 8, 0.15)',
      iconColor: '#eab308',
      connected: integrations.mercadolibre.connected,
      accountName: integrations.mercadolibre.username
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      description: 'Publicación automática en Facebook Marketplace y gestión de leads.',
      icon: Share2,
      bgAccent: 'rgba(24, 119, 242, 0.15)',
      iconColor: '#1877f2',
      connected: integrations.facebook.connected,
      accountName: integrations.facebook.pageName
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      description: 'Conexión con Instagram Business para anuncios de autos e interacciones directas.',
      icon: MessageSquare,
      bgAccent: 'rgba(225, 48, 108, 0.15)',
      iconColor: '#e1306c',
      connected: integrations.instagram.connected,
      accountName: integrations.instagram.handle
    },
    {
      id: 'whatsapp' as const,
      name: 'WhatsApp Business',
      description: 'Recepción directa de consultas y asignación de leads desde el showroom.',
      icon: PhoneCall,
      bgAccent: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10b981',
      connected: integrations.whatsapp.connected,
      accountName: integrations.whatsapp.phoneNumber
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-color)' }}>
            Canales e Integraciones
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0, color: 'var(--text-color)' }}>
            Conecta tus plataformas de difusión para sincronizar stock y mensajería en tiempo real.
          </p>
        </div>

        {/* Listado Vertical de Canales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
          {channelList.map((ch) => {
            const IconComponent = ch.icon;
            return (
              <div 
                key={ch.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                  {/* Template Badge Icon */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: ch.bgAccent,
                    color: ch.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={22} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)' }}>
                        {ch.name}
                      </span>
                      {ch.connected ? (
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={12} /> Conectado
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 500,
                          color: 'var(--text-color)',
                          opacity: 0.5,
                          backgroundColor: 'rgba(128,128,128,0.1)',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          No conectado
                        </span>
                      )}
                    </div>
                    
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-color)', opacity: 0.65 }}>
                      {ch.connected && ch.accountName ? `Cuenta vinculada: ${ch.accountName}` : ch.description}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ch.connected ? (
                    <button 
                      onClick={() => handleDisconnect(ch.id)}
                      disabled={isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Unlink2 size={14} /> Desconectar
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenConnect(ch.id)}
                      disabled={isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1.15rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        backgroundColor: 'var(--primary)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Link2 size={14} /> Conectar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Conectar WhatsApp */}
      {showConnectModal === 'whatsapp' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Conectar WhatsApp Business</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Número Telefónico</label>
              <input 
                type="text" 
                placeholder="Ej: +59899123456" 
                value={connectData.phoneNumber}
                onChange={(e) => setConnectData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowConnectModal(null)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                onClick={() => handleConnectSubmit('whatsapp')} 
                disabled={isPending}
                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
