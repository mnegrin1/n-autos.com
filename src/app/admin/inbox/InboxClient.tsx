"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { 
  MessageSquare, 
  Search, 
  Send, 
  Phone, 
  Mail, 
  User, 
  Clock, 
  Car, 
  Check, 
  CheckCheck,
  FileText, 
  Calendar, 
  DollarSign, 
  Zap,
  Info,
  ChevronRight,
  Loader2,
  Trash2,
  Edit2,
  RefreshCw,
  MoreVertical,
  X,
  ArrowLeft,
  Mic
} from "lucide-react";
import styles from "./inbox.module.css";
import { 
  sendInboxMessage, 
  sendInboxAudio,
  markConversationRead, 
  updateConversationNotes,
  updateAutoLeadStatus,
  deleteConversation,
  updateLeadContact,
  syncMetaConversations
} from "@/actions/autoActions";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import ComposeEmailModal from "@/components/ComposeEmailModal";
import AudioMessagePlayer from "@/components/AudioMessagePlayer";
import VoiceRecorderComposer from "@/components/VoiceRecorderComposer";

interface Message {
  id: string;
  sender: 'lead' | 'agent';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'audio';
  audio_url?: string;
  audio_duration?: number;
}

interface Conversation {
  id: string;
  lead_id?: string;
  lead_name: string;
  lead_avatar?: string;
  channel: 'whatsapp' | 'mercadolibre' | 'facebook' | 'instagram' | 'email';
  last_message: string;
  last_message_time: string;
  unread: boolean;
  vehicle_id?: string;
  messages: Message[];
  notes?: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  images: string[];
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

interface InboxClientProps {
  initialConversations: Conversation[];
  vehicles: Vehicle[];
  integrations: {
    mercadolibre: { connected: boolean };
    facebook: { connected: boolean };
    instagram: { connected: boolean };
    whatsapp: { connected: boolean };
  };
  leads: Lead[];
}

// Plantillas de respuestas rápidas
const QUICK_TEMPLATES = [
  "Hola, sí, lo tenemos disponible en nuestro showroom para verlo.",
  "Hola, contamos con planes de financiación bancaria del 50% y saldo en cuotas.",
  "Hola, podemos tomar tu vehículo usado como permuta luego de una inspección técnica.",
  "Hola, ¿te queda bien coordinar una visita y un test drive para mañana por la tarde?",
  "Perfecto, quedo a las órdenes. Te paso mi contacto directo para agilizar."
];

export default function InboxClient({
  initialConversations,
  vehicles,
  integrations,
  leads
}: InboxClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversations[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'dm' | 'email'>('dm');
  const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'mercadolibre' | 'facebook' | 'instagram'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [leadTyping, setLeadTyping] = useState(false);
  
  // Lead Editing State
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadName, setEditLeadName] = useState("");
  const [editLeadEmail, setEditLeadEmail] = useState("");
  const [editLeadPhone, setEditLeadPhone] = useState("");
  
  const [isSyncingChannel, setIsSyncingChannel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [showLeadModal, setShowLeadModal] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "compose") {
      setActiveTab('email');
      setEmailModalOpen(true);
      router.replace("/admin/inbox");
    }
  }, [searchParams]);

  const handleSyncMetaChannel = async (channelName: 'facebook' | 'instagram') => {
    setIsSyncingChannel(channelName);
    try {
      const res = await syncMetaConversations(channelName);
      if (res.success) {
        alert(res.message || `Conversaciones de ${channelName} sincronizadas.`);
      } else {
        alert(`Error al sincronizar ${channelName}: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error al sincronizar ${channelName}: ${err.message}`);
    } finally {
      setIsSyncingChannel(null);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentConv = conversations.find(c => c.id === selectedConvId);

  // Escuchar mensajes en tiempo real desde Supabase
  useEffect(() => {
    const channel = supabase
      .channel('inbox_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'inbox_conversations'
        },
        (payload) => {
          const newData = payload.new as Conversation;
          
          // Reproducir sonido si hay un mensaje nuevo sin leer
          if (newData && newData.unread) {
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
              audio.volume = 0.2;
              audio.play();
            } catch (e) {}
          }

          // Actualizar la lista de conversaciones
          setConversations(prev => {
            if (payload.eventType === 'INSERT') {
              // Validamos si ya existe para evitar duplicados locales
              if (prev.some(c => c.id === newData.id)) return prev;
              return [newData, ...prev];
            } else if (payload.eventType === 'UPDATE') {
              return prev.map(c => c.id === newData.id ? { ...c, ...newData } : c);
            } else if (payload.eventType === 'DELETE') {
              return prev.filter(c => c.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Periodic auto-refresh every 1 minute (60 seconds) to keep chats and inbox updated
  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(timer);
  }, [router]);

  // Notas internas locales
  const [localNotes, setLocalNotes] = useState(currentConv?.notes || "");

  // Auto-scroll al final del chat al cambiar de chat o mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (currentConv) {
      setLocalNotes(currentConv.notes || "");
      if (currentConv.unread) {
        // Marcar como leído en la base de datos
        startTransition(async () => {
          await markConversationRead(currentConv.id);
          setConversations(prev => prev.map(c => c.id === currentConv.id ? { ...c, unread: false } : c));
        });
      }
    }
  }, [selectedConvId, currentConv?.messages.length]);

  // Chequear si hay algún canal conectado
  const anyChannelConnected = Object.values(integrations).some(i => i.connected);

  // Filtrar y buscar conversaciones
  const filteredConversations = conversations
    .filter(c => {
      if (activeTab === 'email') return c.channel === 'email';
      if (c.channel === 'email') return false;
      
      if (activeFilter === 'all') return true;
      return c.channel === activeFilter;
    })
    .filter(c => c.lead_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

  // Obtener vehículo asociado
  const associatedVehicle = vehicles.find(v => v.id === currentConv?.vehicle_id);
  // Obtener lead asociado en el CRM
  const associatedLead = leads.find(l => l.id === currentConv?.lead_id || l.name === currentConv?.lead_name);

  // Manejar el envío de mensajes
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const messageText = inputText;
    setInputText("");
    setShowTemplates(false);

    // 1. Agregar mensaje del agente de forma optimista localmente
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localAgentMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: 'agent',
      text: messageText,
      time: timeStr,
      status: 'sent'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          last_message: messageText,
          last_message_time: timeStr,
          messages: [...c.messages, localAgentMsg]
        };
      }
      return c;
    }));

    // 2. Guardar en base de datos en background
    startTransition(async () => {
      const res = await sendInboxMessage(selectedConvId, messageText);
      if (res.success && res.conversation) {
        // Actualizar datos reales del servidor
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...res.conversation } : c));
      }
    });
  };

  // Manejar el envío de audios y notas de voz
  const handleSendAudio = async (blob: Blob, duration: number, fileName?: string) => {
    if (!selectedConvId) return;

    const tempAudioUrl = URL.createObjectURL(blob);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localAgentMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: 'agent',
      text: "🎵 Nota de voz",
      type: 'audio',
      audio_url: tempAudioUrl,
      audio_duration: duration,
      time: timeStr,
      status: 'sent'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          last_message: "🎵 Nota de voz",
          last_message_time: timeStr,
          messages: [...c.messages, localAgentMsg]
        };
      }
      return c;
    }));

    startTransition(async () => {
      try {
        const formData = new FormData();
        const fileExt = fileName && fileName.includes('.') ? fileName.split('.').pop() : 'webm';
        const uploadFileName = fileName || `voice_${Date.now()}.${fileExt}`;
        formData.append("audio", blob, uploadFileName);
        formData.append("duration", duration.toString());

        const uploadRes = await fetch("/api/inbox/upload-audio", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Error al subir el archivo de audio al servidor");
        }

        const uploadData = await uploadRes.json();
        if (!uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || "No se obtuvo URL del audio");
        }

        const audioUrlToSend = uploadData.absoluteUrl || uploadData.url;
        const res = await sendInboxAudio(selectedConvId, audioUrlToSend, duration);

        if (res.success && res.conversation) {
          setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...res.conversation } : c));
        } else if (!res.success) {
          alert(`Error al enviar audio: ${res.error}`);
        }
      } catch (err: any) {
        console.error("Error enviando audio:", err);
        alert(`Error al enviar nota de voz: ${err.message}`);
      }
    });
  };

  const handleSelectTemplate = (template: string) => {
    setInputText(template);
    setShowTemplates(false);
  };

  // Guardar notas internas
  const handleSaveNotes = async () => {
    if (!selectedConvId) return;
    startTransition(async () => {
      await updateConversationNotes(selectedConvId, localNotes);
      setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, notes: localNotes } : c));
    });
  };

  // Cambiar estado del lead en el CRM
  const handleStatusChange = async (newStatus: string) => {
    const leadId = currentConv?.lead_id;
    if (!leadId) return;

    startTransition(async () => {
      await updateAutoLeadStatus(leadId, newStatus);
    });
  };

  const handleDeleteConversation = async () => {
    if (!selectedConvId) return;
    if (confirm("¿Estás seguro de que deseas eliminar este chat y todos sus mensajes permanentemente?")) {
      startTransition(async () => {
        await deleteConversation(selectedConvId);
        setConversations(prev => prev.filter(c => c.id !== selectedConvId));
        setSelectedConvId(null);
      });
    }
  };

  const handleStartEditLead = () => {
    setEditLeadName(currentConv?.lead_name || "");
    setEditLeadEmail(associatedLead?.email || "");
    setEditLeadPhone(associatedLead?.phone || "");
    setIsEditingLead(true);
  };

  const handleSaveLeadContact = async () => {
    if (!selectedConvId || !editLeadName.trim()) return;
    startTransition(async () => {
      const res = await updateLeadContact(
        selectedConvId,
        associatedLead?.id,
        editLeadName,
        editLeadEmail,
        editLeadPhone
      );
      if (res.success) {
        setIsEditingLead(false);
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, lead_name: editLeadName, lead_id: res.lead_id } : c));
      } else {
        alert("Error guardando el contacto: " + res.error);
      }
    });
  };

  // Obtener color e iconos por red social
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '#25d366';
      case 'mercadolibre': return '#ffe600';
      case 'facebook': return '#1877f2';
      case 'instagram': return '#e1306c';
      case 'email': return '#6366f1'; // Indigo for email
      default: return 'var(--primary)';
    }
  };

  return (
    <div className={styles.inboxContainer}>
      
      {/* Alerta de Modo de Simulación si no hay canales reales conectados */}
      {!anyChannelConnected && (
        <div className={styles.demoBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} />
            <span><strong>Modo Demostración Activo:</strong> Se han cargado conversaciones simuladas multicanal. Conecta tus cuentas en <strong>Publicaciones / Canales</strong> para integrar APIs de producción.</span>
          </div>
          <Link href="/admin/integrations" className={styles.demoLink}>
            Configurar Canales <ChevronRight size={14} />
          </Link>
        </div>
      )}

      <div className={`${styles.dashboard} ${selectedConvId ? styles.hasSelectedChat : styles.noSelectedChat}`}>
        {/* Columna 1: Listado de Chats */}
        <div className={styles.sidebar}>
          
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', margin: '1rem', paddingBottom: '0.5rem' }}>
             <button 
                onClick={() => setActiveTab('dm')}
                style={{ flex: 1, background: 'none', border: 'none', fontWeight: activeTab === 'dm' ? 700 : 500, color: activeTab === 'dm' ? 'var(--primary)' : 'var(--text-color)', opacity: activeTab === 'dm' ? 1 : 0.6, cursor: 'pointer', borderBottom: activeTab === 'dm' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem' }}
             >
               Mensajes
             </button>
             <button 
                onClick={() => setActiveTab('email')}
                style={{ flex: 1, background: 'none', border: 'none', fontWeight: activeTab === 'email' ? 700 : 500, color: activeTab === 'email' ? 'var(--primary)' : 'var(--text-color)', opacity: activeTab === 'email' ? 1 : 0.6, cursor: 'pointer', borderBottom: activeTab === 'email' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem' }}
             >
               Correos
             </button>
          </div>

          <div className={styles.sidebarHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>Chats de Leads</h3>
              <span className={styles.badgeCount}>
                {conversations.filter(c => c.unread).length} sin leer
              </span>
            </div>

            {activeTab === 'email' && (
              <button
                onClick={() => {
                  setEmailRecipient(associatedLead?.email || "");
                  setEmailModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  border: 'none',
                  color: 'var(--text-color)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}
              >
                <Mail size={14} /> Redactar Email
              </button>
            )}
          </div>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filtros de canales (Sólo para Mensajes Directos) */}
          {activeTab === 'dm' && (
            <div className={styles.filtersWrapper}>
              <button 
                onClick={() => setActiveFilter('all')} 
                className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.activeFilter : ''}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setActiveFilter('whatsapp')} 
                className={`${styles.filterBtn} ${activeFilter === 'whatsapp' ? styles.activeFilter : ''}`}
                style={{ color: activeFilter === 'whatsapp' ? '#25d366' : 'inherit' }}
              >
                WA
              </button>
              <button 
                onClick={() => setActiveFilter('mercadolibre')} 
                className={`${styles.filterBtn} ${activeFilter === 'mercadolibre' ? styles.activeFilter : ''}`}
                style={{ color: activeFilter === 'mercadolibre' ? '#f59e0b' : 'inherit' }}
              >
                ML
              </button>
              <button 
                onClick={() => setActiveFilter('facebook')} 
                className={`${styles.filterBtn} ${activeFilter === 'facebook' ? styles.activeFilter : ''}`}
                style={{ color: activeFilter === 'facebook' ? '#1877f2' : 'inherit' }}
              >
                FB
              </button>
              <button 
                onClick={() => setActiveFilter('instagram')} 
                className={`${styles.filterBtn} ${activeFilter === 'instagram' ? styles.activeFilter : ''}`}
                style={{ color: activeFilter === 'instagram' ? '#e1306c' : 'inherit' }}
              >
                IG
              </button>
            </div>
          )}

          {/* Lista de conversaciones */}
          <div className={styles.chatList}>
            {filteredConversations.length === 0 ? (
              <div className={styles.emptyChats}>
                No se encontraron conversaciones
              </div>
            ) : (
              filteredConversations.map(c => {
                const vehicle = vehicles.find(v => v.id === c.vehicle_id);
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedConvId(c.id)}
                    className={`${styles.chatItem} ${c.id === selectedConvId ? styles.selectedChatItem : ''} ${c.unread ? styles.unreadChatItem : ''}`}
                  >
                    <div className={styles.avatarCircle}>
                      {c.lead_avatar || c.lead_name.substr(0, 2).toUpperCase()}
                      <span 
                        className={styles.channelIndicator}
                        style={{ backgroundColor: getChannelColor(c.channel) }}
                      />
                    </div>
                    
                    <div className={styles.chatMeta}>
                      <div className={styles.chatItemRow}>
                        <h4 className={styles.leadName}>{c.lead_name}</h4>
                        <span className={styles.chatTime}>{(() => {
                          const d = new Date(c.last_message_time);
                          if (!isNaN(d.getTime()) && c.last_message_time.includes('T')) {
                            const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
                            if (diffMins < 60) return `hace ${diffMins || 1}m`;
                            if (diffMins < 1440) return `${d.toLocaleTimeString('es-UY', {hour:'2-digit', minute:'2-digit'})}`;
                            return d.toLocaleDateString('es-UY', {day:'2-digit', month:'2-digit'});
                          }
                          return c.last_message_time;
                        })()}</span>
                      </div>
                      <div className={styles.chatItemRow}>
                        <p className={styles.lastMsgPreview}>
                          {c.last_message?.includes("Nota de voz") ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Mic size={12} style={{ color: 'var(--primary)' }} /> Nota de voz
                            </span>
                          ) : (
                            c.last_message
                          )}
                        </p>
                        {c.unread && <span className={styles.unreadDot} />}
                      </div>
                      {vehicle && (
                        <span className={styles.interestTag}>
                          <Car size={10} /> {vehicle.brand} {vehicle.model}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna 2: Ventana de Chat */}
        <div className={styles.chatWindow}>
          {currentConv ? (
            <>
              {/* Chat Header */}
              <div className={styles.chatHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    onClick={() => setSelectedConvId(null)}
                    className={styles.mobileBackBtn}
                    title="Volver a los chats"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{currentConv.lead_name}</h3>
                    <span className={styles.chatHeaderChannel} style={{ color: getChannelColor(currentConv.channel) }}>
                      Interactuando vía {currentConv.channel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {associatedLead?.phone && (
                    <a href={`tel:${associatedLead.phone}`} className={styles.headerActionBtn} title="Llamar">
                      <Phone size={16} />
                    </a>
                  )}
                  {associatedLead?.email && (
                    <button 
                      onClick={() => {
                        setEmailRecipient(associatedLead.email || "");
                        setEmailModalOpen(true);
                      }}
                      className={styles.headerActionBtn} 
                      title="Enviar Email"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  <button onClick={handleDeleteConversation} className={styles.headerActionBtn} title="Eliminar Chat" style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => setShowLeadModal(true)} 
                    className={styles.headerActionBtn} 
                    title="Detalles y Opciones del Lead"
                    style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className={styles.messageBox}>
                {currentConv.messages.map(m => {
                  const isAgent = m.sender === 'agent';
                  const isAudio = m.type === 'audio' || Boolean(m.audio_url);
                  return (
                    <div 
                      key={m.id} 
                      className={`${styles.messageRow} ${isAgent ? styles.rowAgent : styles.rowLead}`}
                    >
                      <div className={`${styles.bubble} ${isAgent ? styles.bubbleAgent : styles.bubbleLead}`}>
                        {isAudio && m.audio_url ? (
                          <AudioMessagePlayer 
                            src={m.audio_url} 
                            duration={m.audio_duration} 
                            isAgent={isAgent} 
                          />
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{m.text}</p>
                        )}
                        <div className={styles.bubbleFooter}>
                          <span>{(() => {
                            const d = new Date(m.time);
                            if (!isNaN(d.getTime()) && m.time.includes('T')) {
                              const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
                              let relative = diffMins < 1 ? 'ahora' : diffMins < 60 ? `hace ${diffMins} min` : diffMins < 1440 ? `hace ${Math.floor(diffMins/60)} h` : `hace ${Math.floor(diffMins/1440)} d`;
                              return `${d.toLocaleDateString('es-UY', {day:'2-digit', month:'2-digit'})} ${d.toLocaleTimeString('es-UY', {hour:'2-digit', minute:'2-digit'})} (${relative})`;
                            }
                            return m.time;
                          })()}</span>
                          {isAgent && (
                            <span>
                              {m.status === 'sent' && <Check size={12} />}
                              {m.status === 'delivered' && <CheckCheck size={12} />}
                              {m.status === 'read' && <CheckCheck size={12} style={{ color: '#38bdf8' }} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Indicador de Lead Escribiendo */}
                {leadTyping && (
                  <div className={styles.messageRow} style={{ justifyContent: 'flex-start' }}>
                    <div className={styles.typingBubble}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Composer */}
              <form onSubmit={handleSendMessage} className={styles.composer}>
                {/* Botón de Plantillas */}
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={styles.templateBtn}
                    title="Respuestas Rápidas"
                  >
                    <Zap size={16} />
                  </button>
                  
                  {showTemplates && (
                    <div className={styles.templatesDropdown}>
                      <div className={styles.templatesHeader}>
                        <span>Respuestas Rápidas (Plantillas)</span>
                      </div>
                      <div className={styles.templatesList}>
                        {QUICK_TEMPLATES.map((t, idx) => (
                          <button 
                            key={idx} 
                            type="button" 
                            onClick={() => handleSelectTemplate(t)}
                            className={styles.templateItem}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className={styles.composerInput}
                  disabled={isPending}
                />

                {/* Grabador y adjuntador de notas de voz */}
                {currentConv.channel !== 'email' && (
                  <VoiceRecorderComposer 
                    onSendAudio={handleSendAudio}
                    isPending={isPending}
                  />
                )}
                
                {inputText.trim() ? (
                  <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={isPending}
                    title="Enviar mensaje de texto"
                  >
                    {isPending ? <Loader2 size={16} className={styles.spin} /> : <Send size={16} />}
                  </button>
                ) : null}
              </form>
            </>
          ) : (
            <div className={styles.emptyChatWindow}>
              <MessageSquare size={48} style={{ opacity: 0.25, marginBottom: '1rem' }} />
              <h3>Bandeja de Entrada Unificada</h3>
              <p>Selecciona una conversación de la lista lateral para leer los mensajes del lead.</p>
            </div>
          )}
        </div>
      </div>

      {/* POP-UP MODAL EMERGENTE: INFORMACIÓN Y EDICIÓN DEL LEAD */}
      {showLeadModal && currentConv && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowLeadModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Información del Lead
              </h3>
              <button 
                onClick={() => setShowLeadModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', opacity: 0.7 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                  {currentConv.lead_avatar || currentConv.lead_name.substr(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentConv.lead_name}</h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {associatedLead ? `CRM Lead: ${associatedLead.status.toUpperCase()}` : 'No en CRM'}
                  </span>
                </div>
                <button 
                  onClick={handleStartEditLead}
                  style={{ background: 'none', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Edit2 size={14} /> Editar
                </button>
              </div>

              {/* Formulario de Edición */}
              {isEditingLead ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre del Contacto</label>
                  <input 
                    type="text" 
                    value={editLeadName} 
                    onChange={e => setEditLeadName(e.target.value)} 
                    placeholder="Nombre del Lead"
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.88rem' }}
                  />
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</label>
                  <input 
                    type="email" 
                    value={editLeadEmail} 
                    onChange={e => setEditLeadEmail(e.target.value)} 
                    placeholder="Email (opcional)"
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.88rem' }}
                  />
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teléfono</label>
                  <input 
                    type="text" 
                    value={editLeadPhone} 
                    onChange={e => setEditLeadPhone(e.target.value)} 
                    placeholder="Teléfono (opcional)"
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.88rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={handleSaveLeadContact} 
                      style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                      disabled={isPending}
                    >
                      {isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button 
                      onClick={() => setIsEditingLead(false)} 
                      style={{ flex: 1, padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                      disabled={isPending}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                  {associatedLead?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} style={{ opacity: 0.6 }} />
                      <span>{associatedLead.phone}</span>
                    </div>
                  )}
                  {associatedLead?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} style={{ opacity: 0.6 }} />
                      <span>{associatedLead.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7, fontSize: '0.8rem' }}>
                    <Clock size={14} />
                    <span>Último contacto: {currentConv.last_message_time}</span>
                  </div>
                </div>
              )}

              {/* Selector de Estado CRM */}
              {associatedLead && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Estado del Lead en CRM</label>
                  <select
                    value={associatedLead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="test_drive">Test Drive</option>
                    <option value="negociacion">Negociación</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              )}

              {/* Ficha del Vehículo de Interés */}
              {associatedVehicle && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Vehículo de Interés</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                    <img src={associatedVehicle.images[0]} alt="" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>{associatedVehicle.brand} {associatedVehicle.model}</h5>
                      <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7 }}>{associatedVehicle.year} • {associatedVehicle.currency} {associatedVehicle.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas Internas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Notas Internas (Historial)</label>
                <textarea
                  rows={3}
                  placeholder="Añade detalles sobre esta negociación, permutas, créditos o coordinaciones..."
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  style={{ padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '0.7rem', opacity: 0.4, textAlign: 'right' }}>Se guarda automáticamente al hacer click fuera</span>
              </div>

              {/* Acción: Agendar Test Drive */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link 
                  href={`/admin/calendar?action=new&lead=${encodeURIComponent(currentConv.lead_name)}&phone=${associatedLead?.phone || ""}`}
                  style={{ flex: 1, padding: '0.65rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Calendar size={15} /> Agendar Test Drive
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <ComposeEmailModal 
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        defaultTo={emailRecipient}
      />
    </div>
  );
}
