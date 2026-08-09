"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Settings,
  Car,
  MessageSquare,
  Users,
  Globe,
  Zap,
  ShieldCheck,
  Video,
  ArrowRight,
  Plus,
  Shield,
  Clock,
  Sparkles
} from "lucide-react";
import {
  DocPage,
  getDocPages,
  subscribeDocStore,
  getActiveUserSessionInfo
} from "@/lib/docStore";
import SuperAdminDocEditorModal from "@/components/SuperAdminDocEditorModal";

export default function DocHomePage() {
  const [pages, setPages] = useState<DocPage[]>([]);
  const [userInfo, setUserInfo] = useState(getActiveUserSessionInfo());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    function loadData() {
      setPages(getDocPages());
      setUserInfo(getActiveUserSessionInfo());
    }
    loadData();
    const unsub = subscribeDocStore(loadData);
    return () => unsub();
  }, []);

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "primeros pasos":
        return <Settings size={22} color="#2563eb" />;
      case "inventario":
        return <Car size={22} color="#059669" />;
      case "comunicación":
        return <MessageSquare size={22} color="#7c3aed" />;
      case "ventas":
        return <Users size={22} color="#d97706" />;
      case "multicanal":
        return <Globe size={22} color="#0284c7" />;
      case "marketing":
        return <Zap size={22} color="#e11d48" />;
      default:
        return <ShieldCheck size={22} color="#4f46e5" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Banner Principal */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        borderRadius: "24px",
        padding: "2.5rem",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.3)"
      }}>
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: "720px", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "20px",
            background: "rgba(37, 99, 235, 0.2)",
            color: "#60a5fa",
            fontSize: "0.775rem",
            fontWeight: 700,
            marginBottom: "1rem"
          }}>
            <Sparkles size={14} /> Centro de Aprendizaje & Configuración CRM
          </div>

          <h1 style={{ margin: "0 0 0.75rem 0", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Documentación Oficial del CRM
          </h1>

          <p style={{ margin: 0, fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.6 }}>
            Aprende a configurar paso a paso la plataforma para tu automotora. Visualiza videos tutoriales de Loom por sección y realiza consultas o comentarios en tiempo real.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "#cbd5e1" }}>
              <Video size={16} color="#60a5fa" /> Videos Loom integrados
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "#cbd5e1" }}>
              <MessageSquare size={16} color="#34d399" /> Comentarios por tema
            </div>
            {userInfo.isSuperAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "#fca5a5" }}>
                <Shield size={16} color="#ef4444" /> Editor Super Admin Activo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Guías de Configuración */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              Guías de Configuración Destacadas
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              Selecciona una categoría para comenzar la configuración de tu automotora.
            </p>
          </div>

          {userInfo.isSuperAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "10px",
                background: "#dc2626",
                color: "#ffffff",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)"
              }}
            >
              <Plus size={16} /> Crear Nueva Guía
            </button>
          )}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem"
        }}>
          {pages.map((page) => {
            const hasLoom = page.sections.some((s) => s.loomUrl && s.loomUrl.trim() !== "");
            return (
              <Link
                key={page.slug}
                href={`/doc/${page.slug}`}
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "1.5rem",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 20px -5px rgba(0,0,0,0.03)"
                }}
              >
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem"
                  }}>
                    <div style={{
                      padding: "10px",
                      borderRadius: "12px",
                      background: "rgba(241, 245, 249, 0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {getIcon(page.category)}
                    </div>

                    <span style={{
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#475569"
                    }}>
                      {page.category}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                    {page.title}
                  </h3>

                  <p style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#64748b",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {page.summary}
                  </p>
                </div>

                <div style={{
                  marginTop: "1.25rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "#94a3b8" }}>
                    {hasLoom && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2563eb", fontWeight: 600 }}>
                        <Video size={13} /> Video Incluido
                      </span>
                    )}
                    <span>• {page.sections.length} secciones</span>
                  </div>

                  <span style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    Ver Guía <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <SuperAdminDocEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create_page"
      />
    </div>
  );
}
