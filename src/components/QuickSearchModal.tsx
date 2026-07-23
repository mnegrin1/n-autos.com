"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  LayoutDashboard, 
  Car, 
  MessageSquare, 
  Share2, 
  Users, 
  Mail, 
  Settings, 
  Plus, 
  DollarSign, 
  ArrowRight,
  X
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  category: "Navegación" | "Acciones Rápidas";
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComposeEmail?: () => void;
}

export default function QuickSearchModal({ isOpen, onClose, onOpenComposeEmail }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: SearchItem[] = [
    {
      id: "nav-dashboard",
      title: "Dashboard Principal",
      category: "Navegación",
      icon: LayoutDashboard,
      href: "/admin",
      keywords: ["home", "inicio", "resumen", "estadisticas"]
    },
    {
      id: "nav-vehicles",
      title: "Inventario de Stock",
      category: "Navegación",
      icon: Car,
      href: "/admin/vehicles",
      keywords: ["autos", "vehiculos", "stock", "catalogo", "flota"]
    },
    {
      id: "nav-inbox",
      title: "Bandeja de Entrada / Mensajes",
      category: "Navegación",
      icon: MessageSquare,
      href: "/admin/inbox",
      keywords: ["chats", "mensajes", "whatsapp", "instagram", "facebook", "directos"]
    },
    {
      id: "nav-publications",
      title: "Publicaciones Activas",
      category: "Navegación",
      icon: Share2,
      href: "/admin/publications",
      keywords: ["mercadolibre", "redes", "difusion", "compartir"]
    },
    {
      id: "nav-crm",
      title: "Contactos & Leads (CRM)",
      category: "Navegación",
      icon: Users,
      href: "/admin/crm",
      keywords: ["clientes", "contactos", "leads", "ventas", "prospectos"]
    },
    {
      id: "nav-email",
      title: "Email Broadcasts",
      category: "Navegación",
      icon: Mail,
      href: "/admin/email/broadcasts",
      keywords: ["correos", "boletin", "campañas", "broadcast"]
    },
    {
      id: "nav-settings",
      title: "Configuración del Sistema",
      category: "Navegación",
      icon: Settings,
      href: "/admin/settings",
      keywords: ["ajustes", "preferencias", "perfil", "cuenta", "temas"]
    },
    {
      id: "act-new-vehicle",
      title: "Nueva Publicación de Vehículo",
      category: "Acciones Rápidas",
      icon: Plus,
      href: "/admin/vehicles?action=new",
      keywords: ["crear", "agregar auto", "nuevo auto"]
    },
    {
      id: "act-new-contact",
      title: "Nuevo Contacto / Lead",
      category: "Acciones Rápidas",
      icon: Users,
      href: "/admin/crm?action=new",
      keywords: ["agregar cliente", "crear lead"]
    },
    {
      id: "act-compose-email",
      title: "Redactar y Enviar Email",
      category: "Acciones Rápidas",
      icon: Mail,
      action: () => {
        if (onOpenComposeEmail) onOpenComposeEmail();
      },
      keywords: ["correo", "mandar mail", "nuevo email"]
    },
    {
      id: "act-register-sale",
      title: "Registrar Nueva Venta",
      category: "Acciones Rápidas",
      icon: DollarSign,
      href: "/admin/crm?action=sale",
      keywords: ["vender", "transaccion", "cierre"]
    }
  ];

  const filteredItems = items.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const categoryMatch = item.category.toLowerCase().includes(q);
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(q));
    return titleMatch || categoryMatch || keywordMatch;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          executeItem(filteredItems[selectedIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const executeItem = (item: SearchItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "var(--surface-color, #18181b)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "75vh"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))", gap: "0.75rem" }}>
          <Search size={20} style={{ color: "var(--primary, #3b82f6)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar páginas, acciones, contactos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-color, #fff)",
              fontSize: "1rem",
              fontWeight: 500
            }}
          />
          <button 
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-color)",
              opacity: 0.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "4px",
              borderRadius: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ overflowY: "auto", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-color)", opacity: 0.6, fontSize: "0.9rem" }}>
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--primary-light, rgba(59, 130, 246, 0.12))" : "transparent",
                    color: isSelected ? "var(--primary, #3b82f6)" : "var(--text-color)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(128, 128, 128, 0.08)",
                    color: isSelected ? "var(--primary)" : "inherit"
                  }}>
                    <Icon size={18} />
                  </div>
                  
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.title}</span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>{item.category}</span>
                  </div>

                  {isSelected && (
                    <ArrowRight size={16} style={{ opacity: 0.8 }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Keyboard Guide */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1.25rem",
          borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          fontSize: "0.75rem",
          color: "var(--text-color)",
          opacity: 0.6,
          backgroundColor: "rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span><strong style={{ background: "rgba(128,128,128,0.2)", padding: "2px 6px", borderRadius: "4px" }}>↑ ↓</strong> navegar</span>
            <span><strong style={{ background: "rgba(128,128,128,0.2)", padding: "2px 6px", borderRadius: "4px" }}>↵</strong> seleccionar</span>
          </div>
          <span><strong style={{ background: "rgba(128,128,128,0.2)", padding: "2px 6px", borderRadius: "4px" }}>ESC</strong> cerrar</span>
        </div>
      </div>
    </div>
  );
}
