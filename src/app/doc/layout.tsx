"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Search,
  Settings,
  Car,
  MessageSquare,
  Users,
  Globe,
  Zap,
  ShieldCheck,
  ChevronRight,
  Shield,
  ArrowLeft,
  Video,
  Plus,
  Lock,
  Edit3
} from "lucide-react";
import {
  DocPage,
  getDocPages,
  subscribeDocStore,
  getActiveUserSessionInfo
} from "@/lib/docStore";
import SuperAdminDocEditorModal from "@/components/SuperAdminDocEditorModal";

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pages, setPages] = useState<DocPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState(getActiveUserSessionInfo());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    function refreshData() {
      setPages(getDocPages());
      setUserInfo(getActiveUserSessionInfo());
    }
    refreshData();
    const unsub = subscribeDocStore(refreshData);
    return () => unsub();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "primeros pasos":
        return <Settings size={18} />;
      case "inventario":
        return <Car size={18} />;
      case "comunicación":
        return <MessageSquare size={18} />;
      case "ventas":
        return <Users size={18} />;
      case "multicanal":
        return <Globe size={18} />;
      case "marketing":
        return <Zap size={18} />;
      default:
        return <ShieldCheck size={18} />;
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      {/* Navbar Superior */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "64px",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.825rem",
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "#f1f5f9",
              transition: "all 0.2s ease"
            }}
          >
            <ArrowLeft size={16} /> Volver al CRM
          </Link>

          <div style={{ height: "20px", width: "1px", background: "#cbd5e1" }} />

          <Link href="/doc" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Centro de Documentación CRM
              </span>
              <span style={{ display: "block", fontSize: "0.725rem", color: "#64748b", fontWeight: 500 }}>
                Guías de Configuración & Videos Loom
              </span>
            </div>
          </Link>
        </div>

        {/* Buscador y Sesión */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative", width: "260px" }}>
            <input
              type="text"
              placeholder="Buscar en la documentación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2.25rem",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                fontSize: "0.825rem",
                background: "#f8fafc",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <Search size={15} style={{ position: "absolute", left: "10px", top: "9px", color: "#94a3b8" }} />
          </div>

          {/* Badge de Sesión con detección de Super Admin vs Lectura */}
          <div style={{
            padding: "6px 12px",
            borderRadius: "20px",
            background: userInfo.isSuperAdmin ? "rgba(239, 68, 68, 0.08)" : "rgba(37, 99, 235, 0.08)",
            border: userInfo.isSuperAdmin ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(37, 99, 235, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: userInfo.isSuperAdmin ? "#ef4444" : "#2563eb"
            }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.775rem", fontWeight: 700, color: userInfo.isSuperAdmin ? "#dc2626" : "#2563eb" }}>
                {userInfo.userName}
              </span>
              <span style={{ fontSize: "0.675rem", color: "#64748b" }}>
                {userInfo.userRole}
              </span>
            </div>
          </div>

          {userInfo.isSuperAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                background: "#dc2626",
                color: "#ffffff",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)"
              }}
            >
              <Plus size={15} /> Nueva Guía / Página
            </button>
          )}
        </div>
      </header>

      {/* Contenedor Principal */}
      <div style={{ display: "flex", maxWidth: "1440px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Sidebar Lateral */}
        <aside style={{
          width: "280px",
          flexShrink: 0,
          marginRight: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#94a3b8",
              marginBottom: "0.75rem"
            }}>
              Índice de Guías CRM
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Link
                href="/doc"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  fontWeight: pathname === "/doc" ? 700 : 500,
                  color: pathname === "/doc" ? "#2563eb" : "#334155",
                  background: pathname === "/doc" ? "rgba(37, 99, 235, 0.08)" : "transparent",
                  textDecoration: "none"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={16} /> Vista General / Inicio
                </span>
                <ChevronRight size={14} style={{ opacity: pathname === "/doc" ? 1 : 0.4 }} />
              </Link>

              {filteredPages.map((page) => {
                const isActive = pathname === `/doc/${page.slug}`;
                return (
                  <Link
                    key={page.slug}
                    href={`/doc/${page.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#2563eb" : "#334155",
                      background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getCategoryIcon(page.category)}
                      {page.title}
                    </span>
                    <ChevronRight size={14} style={{ opacity: isActive ? 1 : 0.3 }} />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Banner Informativo de Permisos de Sesión */}
          <div style={{
            background: userInfo.isSuperAdmin
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(220, 38, 38, 0.1))"
              : "linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(59, 130, 246, 0.1))",
            borderRadius: "16px",
            padding: "1rem",
            border: userInfo.isSuperAdmin ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(37, 99, 235, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {userInfo.isSuperAdmin ? <Shield size={16} color="#dc2626" /> : <Lock size={16} color="#2563eb" />}
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: userInfo.isSuperAdmin ? "#dc2626" : "#2563eb" }}>
                {userInfo.isSuperAdmin ? "Modo Super Admin (Edición)" : "Modo Lectura (Usuario)"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#475569", lineHeight: 1.4 }}>
              {userInfo.isSuperAdmin
                ? "Tienes permisos de Super Admin: Puedes agregar secciones, importar videos de Loom y guardar cambios."
                : "Estás visualizando las guías oficiales. Puedes ver los videos tutoriales y escribir comentarios."}
            </p>
          </div>
        </aside>

        {/* Áreas de Contenido */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Modal de Edición Super Admin */}
      <SuperAdminDocEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create_page"
      />
    </div>
  );
}
