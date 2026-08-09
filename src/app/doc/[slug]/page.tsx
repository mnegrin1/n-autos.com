"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Video,
  Plus,
  Edit3,
  Trash2,
  List,
  Shield,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Share2
} from "lucide-react";
import {
  DocPage,
  DocSection,
  getDocPageBySlug,
  deleteDocPage,
  subscribeDocStore,
  getActiveUserSessionInfo
} from "@/lib/docStore";
import LoomEmbed from "@/components/LoomEmbed";
import DocCommentSection from "@/components/DocCommentSection";
import SuperAdminDocEditorModal from "@/components/SuperAdminDocEditorModal";

export default function DocSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [page, setPage] = useState<DocPage | null>(null);
  const [userInfo, setUserInfo] = useState(getActiveUserSessionInfo());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit_section" | "add_section" | "create_page">("edit_section");
  const [selectedSection, setSelectedSection] = useState<DocSection | null>(null);

  useEffect(() => {
    function loadData() {
      const data = getDocPageBySlug(slug);
      setPage(data);
      setUserInfo(getActiveUserSessionInfo());
    }
    loadData();
    const unsub = subscribeDocStore(loadData);
    return () => unsub();
  }, [slug]);

  if (!page) {
    return (
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "3rem",
        textAlign: "center",
        border: "1px solid #e2e8f0"
      }}>
        <h2 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>Guía de Documentación no encontrada</h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          La página <code>/doc/{slug}</code> no existe o ha sido eliminada.
        </p>
        <Link
          href="/doc"
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "10px",
            background: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.875rem"
          }}
        >
          Volver a la Documentación Principal
        </Link>
      </div>
    );
  }

  const handleEditSection = (section: DocSection) => {
    setSelectedSection(section);
    setModalMode("edit_section");
    setIsModalOpen(true);
  };

  const handleAddSection = () => {
    setSelectedSection(null);
    setModalMode("add_section");
    setIsModalOpen(true);
  };

  const handleDeletePage = () => {
    if (confirm(`¿Estás seguro de eliminar la guía "${page.title}"?`)) {
      deleteDocPage(page.slug);
      window.location.href = "/doc";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header de la Guía */}
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        padding: "2rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.03)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem"
        }}>
          <span style={{
            fontSize: "0.775rem",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "20px",
            background: "rgba(37, 99, 235, 0.08)",
            color: "#2563eb"
          }}>
            {page.category}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.775rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={13} /> Actualizado: {page.updatedAt}
            </span>

            {userInfo.isSuperAdmin && (
              <button
                onClick={handleDeletePage}
                title="Eliminar esta guía de documentación"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Trash2 size={13} /> Eliminar Guía
              </button>
            )}
          </div>
        </div>

        <h1 style={{ margin: "0 0 0.75rem 0", fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
          {page.title}
        </h1>

        <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", lineHeight: 1.6 }}>
          {page.summary}
        </p>

        {/* Tabla de Contenidos por Ancla / URL */}
        {page.sections.length > 1 && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#64748b",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <List size={14} /> Contenido de esta página (URLs por sección)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {page.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#2563eb",
                    textDecoration: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1"
                  }}
                >
                  {sec.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secciones de Contenido y Loom Embed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {page.sections.map((section, idx) => (
          <article
            key={section.id}
            id={section.id}
            style={{
              scrollMarginTop: "80px",
              background: "#ffffff",
              borderRadius: "24px",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px -5px rgba(0,0,0,0.03)"
            }}
          >
            {/* Encabezado de la sección */}
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "1rem"
            }}>
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                  {section.title}
                </h2>
                {section.description && (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                    {section.description}
                  </p>
                )}
              </div>

              {userInfo.isSuperAdmin && (
                <button
                  onClick={() => handleEditSection(section)}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "8px",
                    background: "rgba(220, 38, 38, 0.08)",
                    color: "#dc2626",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Edit3 size={14} /> Editar Sección / Loom
                </button>
              )}
            </div>

            {/* Texto de Instrucción de la sección */}
            <div style={{
              fontSize: "0.925rem",
              color: "#334155",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
              whiteSpace: "pre-wrap"
            }}>
              {section.content}
            </div>

            {/* Video tutorial de Loom */}
            <LoomEmbed
              loomUrl={section.loomUrl}
              sectionTitle={section.title}
              isSuperAdmin={userInfo.isSuperAdmin}
              onEditLoomUrl={() => handleEditSection(section)}
            />

            {/* Sección de Comentarios interactivos debajo del video */}
            <DocCommentSection
              docSlug={page.slug}
              sectionId={section.id}
              isSuperAdmin={userInfo.isSuperAdmin}
            />
          </article>
        ))}

        {/* Botón para que el Super Admin agregue más secciones a esta guía */}
        {userInfo.isSuperAdmin && (
          <div style={{
            textAlign: "center",
            padding: "2rem",
            background: "rgba(239, 68, 68, 0.03)",
            borderRadius: "20px",
            border: "2px dashed rgba(239, 68, 68, 0.2)"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 800, color: "#dc2626" }}>
              ¿Quieres añadir otra sección a la guía "{page.title}"?
            </h4>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#64748b" }}>
              Como Super Admin / Fundador puedes agregar tantas secciones con sus respectivas URLs e importar nuevos videos de Loom.
            </p>
            <button
              onClick={handleAddSection}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "10px",
                background: "#dc2626",
                color: "#ffffff",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
              }}
            >
              <Plus size={16} /> Agregar Nueva Sección
            </button>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <SuperAdminDocEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        targetSlug={page.slug}
        targetSection={selectedSection}
      />
    </div>
  );
}
