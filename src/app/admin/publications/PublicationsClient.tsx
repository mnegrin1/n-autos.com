"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Link2, ExternalLink, Eye, MessageSquare, Car, Plus, RefreshCw, X, Check, 
  Share2, Globe, Download, Sparkles, Send, Bot, Filter, MessageCircle, User, 
  Clock, CheckCircle2, AlertCircle, CornerDownRight, Zap, Sliders, Play, Pause, Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  createOrUpdatePublication, 
  importAndPublishToWeb, 
  importSocialPost, 
  getPublicationComments, 
  replyToPublicationComment, 
  generateAICommentReply, 
  addPublicationComment, 
  PublicationComment,
  PublicationAutomationRule,
  getPublicationAutomationsAction,
  savePublicationAutomationAction,
  togglePublicationAutomationAction,
  deletePublicationAutomationAction,
  evaluateManyChatRuleAction
} from "@/actions/autoActions";

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
  web: "https://demo.n-autos.com",
  mercadolibre: "https://vender.mercadolibre.com.ar/sell/",
  facebook: "https://business.facebook.com/latest/composer",
  instagram: "https://www.instagram.com/create/select/",
  whatsapp: "https://web.whatsapp.com/"
};

// Mocks de publicaciones disponibles en canales externos para importar a Stock y Web
const MOCK_EXTERNAL_POSTS = [
  {
    id: "fb-post-101",
    channel: "facebook" as const,
    title: "Toyota Hilux 2.8 SRX 4x4 2021",
    price: 38500,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-20",
    url: "https://www.facebook.com/marketplace/item/101"
  },
  {
    id: "ml-post-202",
    channel: "mercadolibre" as const,
    title: "Volkswagen Amarok V6 Black Edition 2022",
    price: 42000,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-21",
    url: "https://articulo.mercadolibre.com.ar/MLA-202"
  },
  {
    id: "ig-ad-303",
    channel: "instagram" as const,
    title: "BMW 330i M Sport 2.0 Turbo 2020",
    price: 49900,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-22",
    url: "https://www.instagram.com/p/303"
  }
];

export default function PublicationsClient({ vehicles: initialVehicles, publications: initialPublications }: PublicationsClientProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
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

  // Modal "Importar Redes / ML a Stock y Web" State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingPostId, setImportingPostId] = useState<string | null>(null);

  // Modal / Drawer "Comentarios y Consultas de Publicación" State
  const [selectedPubForComments, setSelectedPubForComments] = useState<Publication | null>(null);
  const [comments, setComments] = useState<PublicationComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);

  // Modal para agregar consulta de prueba
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [isSubmittingNewComment, setIsSubmittingNewComment] = useState(false);

  // ManyChat Automations Modal State
  const [isManyChatModalOpen, setIsManyChatModalOpen] = useState(false);
  const [manyChatRules, setManyChatRules] = useState<PublicationAutomationRule[]>([]);
  const [selectedPubForManyChat, setSelectedPubForManyChat] = useState<Publication | null>(null);
  const [editingManyChatRuleId, setEditingManyChatRuleId] = useState<string | null>(null);
  const [manyChatKeywordsInput, setManyChatKeywordsInput] = useState("precio, cuanto, valor, costo");
  const [manyChatResponseInput, setManyChatResponseInput] = useState("¡Hola {cliente}! El precio del {marca} {modelo} ({año}) es de {moneda} {precio}. Tomamos permuta y tenemos financiación. ¿Te gustaría la ficha técnica por WhatsApp?");
  const [manyChatDelayInput, setManyChatDelayInput] = useState<number>(0);
  const [manyChatChannelInput, setManyChatChannelInput] = useState<'all' | 'web' | 'mercadolibre' | 'facebook' | 'instagram'>('all');
  const [isSavingManyChat, setIsSavingManyChat] = useState(false);

  // Simulator State inside ManyChat Modal
  const [testCommentInput, setTestCommentInput] = useState("");
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTestingManyChat, setIsTestingManyChat] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Load ManyChat Rules on mount / modal open
  const handleOpenManyChatModal = async (pub?: Publication) => {
    setSelectedPubForManyChat(pub || null);
    setIsManyChatModalOpen(true);
    try {
      const rules = await getPublicationAutomationsAction(pub?.id);
      setManyChatRules(rules);
    } catch (err) {
      console.error("Error al cargar reglas ManyChat:", err);
    }
  };

  const handleSaveManyChatRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywordsArr = manyChatKeywordsInput
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);

    if (keywordsArr.length === 0) {
      alert("Por favor ingresa al menos una palabra clave.");
      return;
    }
    if (!manyChatResponseInput.trim()) {
      alert("Por favor escribe el mensaje de respuesta automática.");
      return;
    }

    setIsSavingManyChat(true);
    try {
      const res = await savePublicationAutomationAction({
        id: editingManyChatRuleId || undefined,
        publication_id: selectedPubForManyChat?.id,
        vehicle_id: selectedPubForManyChat?.vehicle_id,
        keywords: keywordsArr,
        response_text: manyChatResponseInput.trim(),
        delay_minutes: Number(manyChatDelayInput),
        is_active: true,
        channel: manyChatChannelInput
      });

      if (res.success && res.rule) {
        setManyChatRules(prev => {
          const idx = prev.findIndex(r => r.id === res.rule!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.rule!;
            return next;
          }
          return [res.rule!, ...prev];
        });
        setEditingManyChatRuleId(null);
        alert("¡Regla de automatización ManyChat guardada con éxito!");
      } else {
        alert("Error al guardar regla: " + (res.error || "Desconocido"));
      }
    } catch (err: any) {
      alert("Error al guardar regla: " + err.message);
    } finally {
      setIsSavingManyChat(false);
    }
  };

  const handleToggleManyChatRule = async (id: string, currentState: boolean) => {
    try {
      await togglePublicationAutomationAction(id, !currentState);
      setManyChatRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentState } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteManyChatRule = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta regla de automatización ManyChat?")) return;
    try {
      await deletePublicationAutomationAction(id);
      setManyChatRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestManyChatRule = async () => {
    if (!testCommentInput.trim()) return;
    setIsTestingManyChat(true);
    const pub = selectedPubForManyChat;
    const v = pub ? vehicles.find(v => v.id === pub.vehicle_id) : vehicles[0];

    try {
      const res = await evaluateManyChatRuleAction({
        commentText: testCommentInput,
        authorName: "Cliente de Prueba",
        publicationId: pub?.id,
        vehicleId: pub?.vehicle_id,
        vehicleInfo: v ? {
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          currency: v.currency
        } : undefined
      });
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingManyChat(false);
    }
  };

  // Handlers para la gestión de comentarios
  const handleOpenComments = async (pub: Publication) => {
    setSelectedPubForComments(pub);
    setIsLoadingComments(true);
    const pubId = pub.id || `${pub.channel}-${pub.vehicle_id}`;
    try {
      const data = await getPublicationComments(pubId, pub.vehicle_id, pub.channel, pub.external_id);
      setComments(data);
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendReply = async (comment: PublicationComment) => {
    const text = replyTexts[comment.id]?.trim();
    if (!text) {
      alert("Por favor escribe una respuesta antes de enviar.");
      return;
    }

    setSendingReplyId(comment.id);
    const pubId = selectedPubForComments?.id || `${selectedPubForComments?.channel}-${selectedPubForComments?.vehicle_id}`;

    try {
      const res = await replyToPublicationComment({
        commentId: comment.id,
        publicationId: pubId,
        replyText: text,
        channel: comment.channel,
        externalCommentId: comment.external_comment_id
      });

      if (res.success) {
        const nowStr = new Date().toISOString();
        setComments(prev => prev.map(c => {
          if (c.id === comment.id) {
            return {
              ...c,
              status: 'replied',
              reply_text: text,
              replied_at: nowStr
            };
          }
          return c;
        }));

        setPublications(prev => prev.map(p => {
          const match = p.id ? p.id === pubId : (p.vehicle_id === selectedPubForComments?.vehicle_id && p.channel === selectedPubForComments?.channel);
          if (match) {
            return { ...p, questions_count: (p.questions_count || 0) + 1 };
          }
          return p;
        }));

        setReplyTexts(prev => ({ ...prev, [comment.id]: "" }));
      } else {
        alert(`Error al enviar respuesta: ${res.error || 'Intenta de nuevo'}`);
      }
    } catch (err: any) {
      alert("Error al enviar respuesta: " + err.message);
    } finally {
      setSendingReplyId(null);
    }
  };

  const handleGenerateAiReply = async (comment: PublicationComment) => {
    if (!selectedPubForComments) return;
    const v = vehicles.find(v => v.id === selectedPubForComments.vehicle_id);
    if (!v) return;

    setGeneratingAiId(comment.id);
    try {
      const res = await generateAICommentReply({
        commentText: comment.text,
        vehicle: {
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          currency: v.currency
        }
      });

      if (res.success && res.suggestedReply) {
        setReplyTexts(prev => ({ ...prev, [comment.id]: res.suggestedReply }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAiId(null);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPubForComments || !newCommentText.trim()) return;
    setIsSubmittingNewComment(true);

    const pubId = selectedPubForComments.id || `${selectedPubForComments.channel}-${selectedPubForComments.vehicle_id}`;

    try {
      const res = await addPublicationComment({
        publicationId: pubId,
        vehicleId: selectedPubForComments.vehicle_id,
        channel: selectedPubForComments.channel,
        authorName: newCommentAuthor.trim() || (selectedPubForComments.channel === 'instagram' ? '@usuario_ig' : selectedPubForComments.channel === 'facebook' ? 'Usuario FB' : selectedPubForComments.channel === 'mercadolibre' ? 'COMPRADOR_ML' : 'Cliente Web'),
        text: newCommentText.trim()
      });

      if (res.success && res.comment) {
        setComments(prev => [res.comment!, ...prev]);
        setNewCommentText("");
        setNewCommentAuthor("");
        setIsAddCommentOpen(false);

        setPublications(prev => prev.map(p => {
          const match = p.id ? p.id === pubId : (p.vehicle_id === selectedPubForComments?.vehicle_id && p.channel === selectedPubForComments?.channel);
          if (match) {
            return { ...p, questions_count: (p.questions_count || 0) + 1 };
          }
          return p;
        }));
      }
    } catch (err: any) {
      alert("Error al agregar consulta: " + err.message);
    } finally {
      setIsSubmittingNewComment(false);
    }
  };

  // Keep state in sync with server props
  useEffect(() => {
    setPublications(initialPublications);
    setVehicles(initialVehicles);
  }, [initialPublications, initialVehicles]);

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
      ? `https://demo.n-autos.com/${selectedVehicleId}` 
      : NATIVE_URLS[selectedChannel];
    const destinationUrl = customUrl.trim() || defaultChannelUrl;

    try {
      if (selectedChannel !== 'web') {
        window.open(destinationUrl, "_blank", "noopener,noreferrer");
      }

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

  // Importar anuncio de Redes Sociales / MercadoLibre -> a Stock y publicar en Página Web
  const handleImportAndPublishToWeb = async (post: typeof MOCK_EXTERNAL_POSTS[0]) => {
    setImportingPostId(post.id);
    try {
      const res = await importSocialPost(post.channel, {
        id: post.id,
        title: post.title,
        price: post.price,
        currency: post.currency,
        images: [post.image],
        external_url: post.url,
        description: `Importado desde ${post.channel} directamente al catálogo de Stock y publicado en la Página Web.`
      });

      if (res.success && res.vehicle && res.publication) {
        setVehicles(prev => [res.vehicle as Vehicle, ...prev]);
        setPublications(prev => [res.publication as Publication, ...prev]);

        alert(`¡Anuncio "${post.title}" guardado en el Stock de la Automotora y publicado en la Página Web con consultas sincronizadas!`);
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
    
    if (selectedChannelFilter === "pending") {
      return (pub.questions_count || 0) > 0;
    }

    if (selectedChannelFilter !== "all" && pub.channel !== selectedChannelFilter) {
      return false;
    }

    const searchStr = `${v.brand} ${v.model} ${pub.channel}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* Banner Superior Unificado */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          padding: "1.5rem",
          backgroundColor: "var(--surface-color)",
          borderBottom: "1px solid var(--border-color)"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-color)", margin: "0 0 0.25rem 0" }}>
              Publicaciones, Canales y Consultas
            </h1>
            <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0, fontSize: "0.88rem" }}>
              Importa publicaciones de <strong>MercadoLibre</strong>, <strong>Facebook</strong> e <strong>Instagram</strong> hacia tu <strong>Stock</strong> y <strong>Página Web</strong>, gestiona consultas con prioridad y configura respuestas ManyChat.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.8, backgroundColor: "var(--bg-color)", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
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

            <button
              onClick={() => handleOpenManyChatModal()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.9rem",
                backgroundColor: "rgba(139, 92, 246, 0.12)",
                color: "#8B5CF6",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              <Zap size={16} /> 🤖 ManyChat Bot
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
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
            >
              <Download size={15} /> Importar a Stock (ML/FB/IG)
            </button>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.2rem",
                fontWeight: 600,
                fontSize: "0.875rem"
              }}
            >
              <Plus size={18} /> Publicar
            </button>
          </div>
        </div>

        {/* Buscador y Filtros dentro del Banner Superior */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "var(--bg-color)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "Todas" },
              { id: "pending", label: "🔥 Con Consultas Pendientes" },
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
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: selectedChannelFilter === tab.id ? (tab.id === 'pending' ? "#EF4444" : "var(--primary)") : "transparent",
                  color: selectedChannelFilter === tab.id ? "#fff" : "var(--text-color)",
                  fontWeight: selectedChannelFilter === tab.id ? 700 : 500,
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
              fontSize: "0.85rem",
              minWidth: "240px",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Publications List */}
      <div style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
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

            const isAlreadyOnWeb = publications.some(p => p.vehicle_id === pub.vehicle_id && p.channel === 'web');
            const hasPendingQuestions = (pub.questions_count || 0) > 0;

            return (
              <div 
                key={`${pub.channel}-${pub.vehicle_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--surface-color)",
                  border: hasPendingQuestions ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: hasPendingQuestions ? "0 2px 8px rgba(239, 68, 68, 0.08)" : "0 1px 3px rgba(0,0,0,0.04)"
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem", color: "var(--text-color)", fontWeight: 600 }}>
                        {v.brand} {v.model} <span style={{ opacity: 0.6, fontSize: "0.85rem", fontWeight: 400 }}>({v.year})</span>
                      </h3>

                      {hasPendingQuestions && (
                        <span style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: "#EF4444",
                          color: "#fff",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem"
                        }}>
                          🔥 PRIORIDAD: Consultas Activas
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.2rem 0.65rem", 
                        borderRadius: "6px", 
                        backgroundColor: pub.channel === 'web' ? '#10B981' : pub.channel === 'mercadolibre' ? '#FFE600' : pub.channel === 'facebook' ? '#1877F2' : pub.channel === 'instagram' ? '#E1306C' : '#25D366',
                        color: (pub.channel === 'mercadolibre' || pub.channel === 'web') ? (pub.channel === 'mercadolibre' ? '#333' : '#fff') : '#fff',
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

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.8rem", color: "var(--text-color)", opacity: 0.85 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} title="Visitas totales">
                      <Eye size={16} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{pub.views || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleOpenComments(pub)}
                      title="Abrir comentarios y preguntas públicas para responder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 0.85rem",
                        backgroundColor: hasPendingQuestions ? "rgba(239, 68, 68, 0.12)" : "rgba(37, 99, 235, 0.12)",
                        border: hasPendingQuestions ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(37, 99, 235, 0.3)",
                        borderRadius: "6px",
                        color: hasPendingQuestions ? "#EF4444" : "var(--primary)",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <MessageSquare size={15} />
                      <span>{pub.questions_count || 0} Consultas</span>
                    </button>

                    {/* Botón ManyChat por Publicación */}
                    <button
                      onClick={() => handleOpenManyChatModal(pub)}
                      title="Configurar automatización ManyChat para esta publicación"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.45rem 0.75rem",
                        backgroundColor: "rgba(139, 92, 246, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "6px",
                        color: "#8B5CF6",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      <Zap size={14} /> ManyChat
                    </button>

                    {/* Botón 1-Clic: Publicar en Página Web (si proviene de red social / ML) */}
                    {pub.channel !== 'web' && !isAlreadyOnWeb && (
                      <button
                        onClick={() => handlePublishToWeb(v.id, pub.channel)}
                        disabled={publishingWebId === v.id}
                        title="Publicar este vehículo en el catálogo de la Página Web"
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
                        {publishingWebId === v.id ? "Publicando..." : "Publicar en Web"}
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
                        <ExternalLink size={14} /> {pub.channel === 'web' ? 'Ver en Web' : 'Nativo'}
                      </a>
                    ) : null}
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-color)", opacity: 0.8, marginBottom: "0.35rem" }}>
                  URL de la publicación (opcional):
                </label>
                <input
                  type="text"
                  placeholder={selectedChannel === 'web' ? `https://demo.n-autos.com/${selectedVehicleId}` : NATIVE_URLS[selectedChannel]}
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

      {/* MODAL 2: IMPORTAR DESDE REDES / ML A STOCK Y PÁGINA WEB */}
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
            maxWidth: "640px",
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
                  Importar Anuncios al Stock y Página Web
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
                Selecciona publicaciones de <strong>MercadoLibre</strong>, <strong>Facebook</strong> o <strong>Instagram</strong> para importarlas al <strong>Stock de tu Automotora</strong>, publicarlas en la <strong>Página Web</strong> y priorizar sus consultas:
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
                      {importingPostId === post.id ? "Importando..." : "Importar a Stock y Web"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    padding: "0.66rem 1.25rem",
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

      {/* MODAL 3: GESTIÓN DE COMENTARIOS Y CONSULTAS DE PUBLICACIÓN */}
      {selectedPubForComments && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "780px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border-color)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden"
          }}>
            {/* Header */}
            {(() => {
              const currentVehicle = vehicles.find(v => v.id === selectedPubForComments.vehicle_id);
              const channelBadge = selectedPubForComments.channel === 'web' ? { name: '🌐 Página Web', bg: '#10B981', color: '#fff' }
                : selectedPubForComments.channel === 'mercadolibre' ? { name: 'MercadoLibre (Pregunta Pública)', bg: '#FFE600', color: '#333' }
                : selectedPubForComments.channel === 'instagram' ? { name: 'Instagram (Comentario)', bg: '#E1306C', color: '#fff' }
                : { name: 'Facebook (Comentario)', bg: '#1877F2', color: '#fff' };

              const filteredComments = comments.filter(c => {
                if (commentFilter === 'pending') return c.status === 'pending';
                if (commentFilter === 'replied') return c.status === 'replied';
                return true;
              });

              const pendingCount = comments.filter(c => c.status === 'pending').length;
              const repliedCount = comments.filter(c => c.status === 'replied').length;

              return (
                <>
                  <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      {currentVehicle?.images && currentVehicle.images[0] ? (
                        <img src={currentVehicle.images[0]} alt="" style={{ width: "55px", height: "55px", objectFit: "cover", borderRadius: "10px" }} />
                      ) : (
                        <div style={{ width: "55px", height: "55px", backgroundColor: "var(--border-color)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Car size={24} opacity={0.5} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text-color)" }}>
                            {currentVehicle ? `${currentVehicle.brand} ${currentVehicle.model} (${currentVehicle.year})` : 'Vehículo'}
                          </h2>
                          <span style={{
                            fontSize: "0.72rem",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "6px",
                            backgroundColor: channelBadge.bg,
                            color: channelBadge.color,
                            fontWeight: 800,
                            textTransform: "uppercase"
                          }}>
                            {channelBadge.name}
                          </span>
                        </div>
                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-color)", opacity: 0.7 }}>
                          Gestión y respuesta de comentarios y consultas públicas de la publicación
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        onClick={() => setIsAddCommentOpen(!isAddCommentOpen)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.45rem 0.8rem",
                          backgroundColor: "var(--primary-light)",
                          color: "var(--primary)",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <Plus size={15} /> Nueva Consulta
                      </button>
                      <button
                        onClick={() => setSelectedPubForComments(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6, padding: "0.3rem" }}
                      >
                        <X size={22} />
                      </button>
                    </div>
                  </div>

                  {/* Formulario rápido para agregar consulta de prueba */}
                  {isAddCommentOpen && (
                    <form onSubmit={handleAddCommentSubmit} style={{
                      padding: "1rem 1.5rem",
                      backgroundColor: "rgba(37, 99, 235, 0.05)",
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
                        Simular nueva consulta o comentario de un cliente:
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <input
                          type="text"
                          placeholder="Nombre del usuario (ej: @juan_autos)"
                          value={newCommentAuthor}
                          onChange={(e) => setNewCommentAuthor(e.target.value)}
                          style={{
                            width: "220px",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.82rem",
                            backgroundColor: "var(--bg-color)",
                            color: "var(--text-color)"
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Escribe la pregunta pública (ej: ¿Cuál es el precio contado y permuta?)"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "0.45rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.82rem",
                            backgroundColor: "var(--bg-color)",
                            color: "var(--text-color)"
                          }}
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingNewComment}
                          style={{
                            padding: "0.45rem 1rem",
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {isSubmittingNewComment ? "Guardando..." : "Agregar"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tabs de Filtro */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "var(--surface-color)"
                  }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[
                        { id: 'all', label: `Todas (${comments.length})` },
                        { id: 'pending', label: `Pendientes (${pendingCount})` },
                        { id: 'replied', label: `Respondidas (${repliedCount})` }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setCommentFilter(tab.id as any)}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: commentFilter === tab.id ? "var(--primary)" : "transparent",
                            color: commentFilter === tab.id ? "#fff" : "var(--text-color)",
                            fontWeight: commentFilter === tab.id ? 700 : 500,
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.6 }}>
                      {comments.length} consultas registradas
                    </div>
                  </div>

                  {/* Lista de Comentarios */}
                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                    backgroundColor: "var(--bg-color)"
                  }}>
                    {isLoadingComments ? (
                      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-color)", opacity: 0.6 }}>
                        <RefreshCw size={24} className="spin-animation" style={{ marginBottom: "0.5rem" }} />
                        <div>Cargando comentarios...</div>
                      </div>
                    ) : filteredComments.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "var(--surface-color)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                        <MessageSquare size={32} opacity={0.3} style={{ marginBottom: "0.5rem" }} />
                        <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0, fontWeight: 500 }}>
                          No hay comentarios en este filtro.
                        </p>
                      </div>
                    ) : (
                      filteredComments.map(comment => {
                        const isReplied = comment.status === 'replied';
                        const isBotReplied = comment.reply_text && comment.reply_text.includes("ManyChat");
                        const timeAgo = new Date(comment.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        });

                        return (
                          <div
                            key={comment.id}
                            style={{
                              backgroundColor: "var(--surface-color)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-color)",
                              padding: "1.25rem",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.85rem"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <div style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "50%",
                                  backgroundColor: comment.channel === 'mercadolibre' ? '#FFE600' : comment.channel === 'instagram' ? '#E1306C' : comment.channel === 'facebook' ? '#1877F2' : '#10B981',
                                  color: comment.channel === 'mercadolibre' ? '#333' : '#fff',
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "0.75rem"
                                }}>
                                  {comment.author_avatar || 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-color)" }}>
                                    {comment.author_name}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-color)", opacity: 0.6, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Clock size={12} /> {timeAgo}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {isBotReplied && (
                                  <span style={{
                                    fontSize: "0.7rem",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(139, 92, 246, 0.15)",
                                    color: "#8B5CF6",
                                    fontWeight: 800
                                  }}>
                                    🤖 ManyChat Bot
                                  </span>
                                )}

                                <span style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "20px",
                                  backgroundColor: isReplied ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                  color: isReplied ? "#10B981" : "#F59E0B",
                                  fontWeight: 700
                                }}>
                                  {isReplied ? (
                                    <><CheckCircle2 size={13} /> Respondido</>
                                  ) : (
                                    <><AlertCircle size={13} /> Pendiente</>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div style={{
                              fontSize: "0.92rem",
                              color: "var(--text-color)",
                              lineHeight: 1.45,
                              fontWeight: 500,
                              paddingLeft: "0.2rem"
                            }}>
                              "{comment.text}"
                            </div>

                            {isReplied && comment.reply_text && (
                              <div style={{
                                marginTop: "0.25rem",
                                padding: "0.85rem 1rem",
                                backgroundColor: "var(--bg-color)",
                                borderRadius: "8px",
                                borderLeft: isBotReplied ? "3px solid #8B5CF6" : "3px solid var(--primary)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 700, color: isBotReplied ? "#8B5CF6" : "var(--primary)" }}>
                                  <CornerDownRight size={14} /> {isBotReplied ? "Respuesta de Bot ManyChat" : "Respuesta de la Automotora"}
                                </div>
                                <div style={{ fontSize: "0.88rem", color: "var(--text-color)", lineHeight: 1.4 }}>
                                  {comment.reply_text}
                                </div>
                              </div>
                            )}

                            <div style={{
                              marginTop: "0.5rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.6rem"
                            }}>
                              <textarea
                                rows={2}
                                placeholder={isReplied ? "Modificar o enviar una nueva respuesta..." : "Escribe una respuesta pública..."}
                                value={replyTexts[comment.id] || ""}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                style={{
                                  width: "100%",
                                  padding: "0.65rem 0.85rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  backgroundColor: "var(--bg-color)",
                                  color: "var(--text-color)",
                                  fontSize: "0.85rem",
                                  fontFamily: "inherit",
                                  resize: "vertical",
                                  outline: "none"
                                }}
                              />

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateAiReply(comment)}
                                  disabled={generatingAiId === comment.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    padding: "0.4rem 0.75rem",
                                    backgroundColor: "rgba(139, 92, 246, 0.12)",
                                    color: "#8B5CF6",
                                    border: "1px solid rgba(139, 92, 246, 0.3)",
                                    borderRadius: "6px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    cursor: generatingAiId === comment.id ? "not-allowed" : "pointer"
                                  }}
                                >
                                  <Sparkles size={14} className={generatingAiId === comment.id ? "spin-animation" : ""} />
                                  {generatingAiId === comment.id ? "Generando..." : "Sugerir con IA 🪄"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendReply(comment)}
                                  disabled={sendingReplyId === comment.id || !replyTexts[comment.id]?.trim()}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    padding: "0.45rem 1rem",
                                    backgroundColor: "var(--primary)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    cursor: sendingReplyId === comment.id || !replyTexts[comment.id]?.trim() ? "not-allowed" : "pointer",
                                    opacity: sendingReplyId === comment.id || !replyTexts[comment.id]?.trim() ? 0.6 : 1
                                  }}
                                >
                                  <Send size={14} />
                                  {sendingReplyId === comment.id ? "Enviando..." : "Responder"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 4: AUTOMATIZACIONES ESTILO MANYCHAT (KEYWORDS & DELAY) */}
      {isManyChatModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "850px",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border-color)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            overflow: "hidden"
          }}>
            {/* Header Modal ManyChat */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Zap size={22} color="#8B5CF6" />
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text-color)" }}>
                    Automatización ManyChat de Publicaciones
                  </h2>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.7 }}>
                    {selectedPubForManyChat ? `Configuración vinculada a la publicación #${selectedPubForManyChat.id}` : 'Reglas generales aplicables a todas las publicaciones'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsManyChatModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6 }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Content Container */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Columna Izquierda: Formulario de Nueva / Edición de Regla */}
              <form onSubmit={handleSaveManyChatRule} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-color)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  {editingManyChatRuleId ? "✏️ Editar Regla ManyChat" : "➕ Nueva Regla de Respuesta por Palabra Clave"}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-color)", marginBottom: "0.35rem" }}>
                    1. Palabras Clave (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="ej: precio, cuanto sale, financiacion, permuta"
                    value={manyChatKeywordsInput}
                    onChange={(e) => setManyChatKeywordsInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                    required
                  />
                  <div style={{ fontSize: "0.75rem", color: "#8B5CF6", marginTop: "0.3rem", fontWeight: 600 }}>
                    💡 Detección inteligente: Tolera Mayúsculas/Minúsculas, tildes y signos (ej: "PRECIO?" detecta "precio").
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-color)", marginBottom: "0.35rem" }}>
                    2. Tiempo de Espera (Delay seleccionado por Automotora):
                  </label>
                  <select
                    value={manyChatDelayInput}
                    onChange={(e) => setManyChatDelayInput(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  >
                    <option value={0}>⚡ Inmediato (0 segundos)</option>
                    <option value={0.5}>⏳ 30 segundos de espera</option>
                    <option value={2}>⏱️ 2 minutos de espera</option>
                    <option value={5}>⏱️ 5 minutos de espera</option>
                    <option value={15}>⏱️ 15 minutos de espera</option>
                    <option value={30}>⏱️ 30 minutos de espera</option>
                    <option value={60}>⏱️ 1 hora de espera</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-color)", marginBottom: "0.35rem" }}>
                    3. Mensaje de Respuesta Automática:
                  </label>
                  <textarea
                    rows={4}
                    value={manyChatResponseInput}
                    onChange={(e) => setManyChatResponseInput(e.target.value)}
                    placeholder="Escribe el mensaje..."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      fontSize: "0.85rem",
                      fontFamily: "inherit"
                    }}
                    required
                  />

                  {/* Variables Insertables */}
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", opacity: 0.7, alignSelf: "center", marginRight: "0.2rem" }}>Insertar:</span>
                    {[
                      { tag: "{cliente}", label: "+ Cliente" },
                      { tag: "{marca}", label: "+ Marca" },
                      { tag: "{modelo}", label: "+ Modelo" },
                      { tag: "{precio}", label: "+ Precio" },
                      { tag: "{moneda}", label: "+ Moneda" },
                      { tag: "{whatsapp}", label: "+ Link WA" }
                    ].map(chip => (
                      <button
                        key={chip.tag}
                        type="button"
                        onClick={() => setManyChatResponseInput(prev => prev + " " + chip.tag)}
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          backgroundColor: "var(--border-color)",
                          color: "var(--text-color)",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {editingManyChatRuleId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingManyChatRuleId(null);
                        setManyChatKeywordsInput("precio, cuanto, valor");
                        setManyChatResponseInput("¡Hola {cliente}! El precio...");
                      }}
                      style={{
                        padding: "0.55rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "transparent",
                        color: "var(--text-color)",
                        fontSize: "0.82rem"
                      }}
                    >
                      Cancelar Edición
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingManyChat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.6rem 1.25rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#8B5CF6",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: isSavingManyChat ? "not-allowed" : "pointer"
                    }}
                  >
                    <Check size={16} />
                    {isSavingManyChat ? "Guardando..." : editingManyChatRuleId ? "Actualizar Regla" : "Guardar Regla ManyChat"}
                  </button>
                </div>
              </form>

              {/* Columna Derecha: Lista de Reglas + Probador en Vivo */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Probador en Vivo de Palabras Clave */}
                <div style={{
                  padding: "1rem",
                  backgroundColor: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem"
                }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#8B5CF6", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Sparkles size={16} /> Probador en Vivo de Automatización:
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Escribe un mensaje de prueba (ej: ¿PRÉCIO Y FINANCIACIÓN?)"
                      value={testCommentInput}
                      onChange={(e) => setTestCommentInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.82rem",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)"
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleTestManyChatRule}
                      disabled={isTestingManyChat || !testCommentInput.trim()}
                      style={{
                        padding: "0.45rem 0.85rem",
                        backgroundColor: "#8B5CF6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Probar
                    </button>
                  </div>

                  {testResult && (
                    <div style={{
                      marginTop: "0.3rem",
                      padding: "0.65rem",
                      backgroundColor: testResult.matched ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      border: testResult.matched ? "1px solid #10B981" : "1px solid #EF4444",
                      borderRadius: "6px",
                      fontSize: "0.78rem"
                    }}>
                      {testResult.matched ? (
                        <div>
                          <div style={{ color: "#10B981", fontWeight: 800 }}>
                            ✅ Coincidencia con palabra clave: "{testResult.keyword}" (Delay: {testResult.delayMinutes === 0 ? "Inmediato" : `${testResult.delayMinutes} min`})
                          </div>
                          <div style={{ color: "var(--text-color)", marginTop: "0.25rem", fontStyle: "italic" }}>
                            "{testResult.responseText}"
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "#EF4444", fontWeight: 700 }}>
                          ❌ Ninguna regla coincidente para este texto.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de Reglas ManyChat Guardadas */}
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-color)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  📋 Reglas de Automatización Activas ({manyChatRules.length})
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "360px", overflowY: "auto" }}>
                  {manyChatRules.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", opacity: 0.6, fontSize: "0.85rem" }}>
                      No hay reglas de automatización guardadas aún.
                    </div>
                  ) : (
                    manyChatRules.map(rule => (
                      <div
                        key={rule.id}
                        style={{
                          padding: "0.85rem 1rem",
                          backgroundColor: "var(--bg-color)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            {rule.keywords.map(kw => (
                              <span key={kw} style={{ fontSize: "0.7rem", backgroundColor: "#8B5CF6", color: "#fff", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700 }}>
                                {kw}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleManyChatRule(rule.id, rule.is_active)}
                              title={rule.is_active ? "Pausar regla" : "Activar regla"}
                              style={{ background: "none", border: "none", cursor: "pointer", color: rule.is_active ? "#10B981" : "#EF4444" }}
                            >
                              {rule.is_active ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteManyChatRule(rule.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.9 }}>
                          "{rule.response_text}"
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", opacity: 0.7 }}>
                          <span>⏱️ Delay: {rule.delay_minutes === 0 ? "Inmediato" : `${rule.delay_minutes} min`}</span>
                          <span>Ejecuciones: {rule.trigger_count || 0}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal ManyChat */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsManyChatModalOpen(false)}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

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
