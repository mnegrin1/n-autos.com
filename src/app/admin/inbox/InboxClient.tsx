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
  Loader2
} from "lucide-react";
import styles from "./inbox.module.css";
import { 
  sendInboxMessage, 
  simulateLeadReply, 
  markConversationRead, 
  updateConversationNotes,
  updateAutoLeadStatus
} from "@/actions/autoActions";
import Link from "next/link";

interface Message {
  id: string;
  sender: 'lead' | 'agent';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  lead_id?: string;
  lead_name: string;
  lead_avatar?: string;
  channel: 'whatsapp' | 'mercadolibre' | 'facebook' | 'instagram';
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'mercadolibre' | 'facebook' | 'instagram'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [leadTyping, setLeadTyping] = useState(false);
  const [isPending, startTransition] = useTransition();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentConv = conversations.find(c => c.id === selectedConvId);

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
      if (activeFilter === 'all') return true;
      return c.channel === activeFilter;
    })
    .filter(c => c.lead_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
        
        // 3. Simular escritura y respuesta del cliente después de 1.5s
        setLeadTyping(true);
        setTimeout(async () => {
          const replyRes = await simulateLeadReply(selectedConvId, messageText);
          setLeadTyping(false);
          if (replyRes.success && replyRes.conversation) {
            setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...replyRes.conversation } : c));
            
            // Sonido de notificación simulado
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
              audio.volume = 0.15;
              audio.play();
            } catch (e) {}
          }
        }, 1800);
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
      alert(`Estado del lead actualizado en el CRM a: ${newStatus.toUpperCase()}`);
    });
  };

  // Obtener color e iconos por red social
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '#25d366';
      case 'mercadolibre': return '#ffe600';
      case 'facebook': return '#1877f2';
      case 'instagram': return '#e1306c';
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

      <div className={styles.dashboard}>
        {/* Columna 1: Listado de Chats */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Chats de Leads</h3>
            <span className={styles.badgeCount}>
              {conversations.filter(c => c.unread).length} sin leer
            </span>
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

          {/* Filtros de canales */}
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
                        <span className={styles.chatTime}>{c.last_message_time}</span>
                      </div>
                      <div className={styles.chatItemRow}>
                        <p className={styles.lastMsgPreview}>{c.last_message}</p>
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
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{currentConv.lead_name}</h3>
                  <span className={styles.chatHeaderChannel} style={{ color: getChannelColor(currentConv.channel) }}>
                    Interactuando vía {currentConv.channel.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {associatedLead?.phone && (
                    <a href={`tel:${associatedLead.phone}`} className={styles.headerActionBtn} title="Llamar">
                      <Phone size={16} />
                    </a>
                  )}
                  {associatedLead?.email && (
                    <a href={`mailto:${associatedLead.email}`} className={styles.headerActionBtn} title="Enviar Mail">
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Chat Message Box */}
              <div className={styles.messageBox}>
                {currentConv.messages.map(m => {
                  const isAgent = m.sender === 'agent';
                  return (
                    <div 
                      key={m.id} 
                      className={`${styles.messageRow} ${isAgent ? styles.rowAgent : styles.rowLead}`}
                    >
                      <div className={`${styles.bubble} ${isAgent ? styles.bubbleAgent : styles.bubbleLead}`}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{m.text}</p>
                        <div className={styles.bubbleFooter}>
                          <span>{m.time}</span>
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
                
                <button 
                  type="submit" 
                  className={styles.sendBtn}
                  disabled={!inputText.trim() || isPending}
                >
                  {isPending ? <Loader2 size={16} className={styles.spin} /> : <Send size={16} />}
                </button>
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

        {/* Columna 3: Información de Lead & CRM */}
        <div className={styles.leadDetailsPanel}>
          {currentConv ? (
            <div className={styles.panelContent}>
              <h3 className={styles.panelTitle}>Información del Lead</h3>
              
              {/* Perfil card */}
              <div className={styles.leadProfileCard}>
                <div className={styles.avatarLarge}>
                  {currentConv.lead_avatar || currentConv.lead_name.substr(0, 2).toUpperCase()}
                </div>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  {currentConv.lead_name}
                </h4>
                <span className={styles.crmStatusBadge}>
                  {associatedLead ? `CRM Lead: ${associatedLead.status.toUpperCase()}` : 'No en CRM'}
                </span>
                
                <div style={{ width: '100%', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  {associatedLead?.phone && (
                    <div className={styles.detailRow}>
                      <Phone size={12} style={{ opacity: 0.5 }} />
                      <span>{associatedLead.phone}</span>
                    </div>
                  )}
                  {associatedLead?.email && (
                    <div className={styles.detailRow}>
                      <Mail size={12} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{associatedLead.email}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <Clock size={12} style={{ opacity: 0.5 }} />
                    <span>Último contacto: {currentConv.last_message_time}</span>
                  </div>
                </div>
              </div>

              {/* Ficha del Vehículo de Interés */}
              {associatedVehicle ? (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionHeader}>Vehículo de Interés</h4>
                  <div className={styles.vehicleCard}>
                    <img 
                      src={associatedVehicle.images[0]} 
                      alt="" 
                      className={styles.vehicleThumb} 
                    />
                    <div className={styles.vehicleMeta}>
                      <h5>{associatedVehicle.brand} {associatedVehicle.model}</h5>
                      <p>{associatedVehicle.year} • {associatedVehicle.currency} {associatedVehicle.price.toLocaleString()}</p>
                      <Link 
                        href={`/admin/vehicles?id=${associatedVehicle.id}`} 
                        className={styles.vehicleLink}
                      >
                        Ver Ficha <span style={{ fontSize: "0.75rem", marginLeft: "2px" }}>↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionHeader}>Vehículo de Interés</h4>
                  <div style={{ fontSize: '0.8rem', opacity: 0.5, padding: '0.5rem' }}>
                    Ningún vehículo asociado a esta conversación
                  </div>
                </div>
              )}

              {/* Estado de CRM */}
              {associatedLead && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionHeader}>Sincronizar CRM</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>Estado del Lead en CRM</label>
                    <select
                      value={associatedLead.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={styles.crmSelect}
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="test_drive">Test Drive</option>
                      <option value="negociacion">Negociación</option>
                      <option value="cerrado">Cerrado / Venta</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notas Internas Persistentes */}
              <div className={styles.detailSection} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 className={styles.sectionHeader}>Notas Internas (Historial)</h4>
                <textarea
                  placeholder="Añade detalles sobre esta negociación, permutas, créditos o coordinaciones..."
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  className={styles.notesTextarea}
                />
                <span style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '2px', textAlign: 'right' }}>
                  Se guarda automáticamente al hacer click fuera
                </span>
              </div>

              {/* Acciones Rápidas */}
              <div className={styles.quickActions}>
                <Link 
                  href={`/admin/calendar?action=new&lead=${encodeURIComponent(currentConv.lead_name)}&phone=${associatedLead?.phone || ""}`}
                  className={styles.actionBtnCalendar}
                >
                  <Calendar size={14} /> Agendar Test Drive
                </Link>
                <Link 
                  href={`/admin/crm?action=sale&leadId=${associatedLead?.id || ""}`}
                  className={styles.actionBtnSale}
                >
                  <DollarSign size={14} /> Registrar Venta
                </Link>
              </div>

            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>
              Selecciona un lead para ver sus detalles en el CRM.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
