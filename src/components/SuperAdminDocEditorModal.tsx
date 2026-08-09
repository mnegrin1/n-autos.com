"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Video, FileText, Plus, CheckCircle, Shield } from "lucide-react";
import {
  DocPage,
  DocSection,
  saveDocPage,
  getDocPages,
  getDocPageBySlug
} from "@/lib/docStore";

interface SuperAdminDocEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "edit_section" | "add_section" | "create_page";
  targetSlug?: string;
  targetSection?: DocSection | null;
}

export default function SuperAdminDocEditorModal({
  isOpen,
  onClose,
  mode,
  targetSlug,
  targetSection
}: SuperAdminDocEditorModalProps) {
  // Page creation fields
  const [pageTitle, setPageTitle] = useState("");
  const [pageCategory, setPageCategory] = useState("Configuraciones General");
  const [pageSummary, setPageSummary] = useState("");

  // Section fields
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionLoomUrl, setSectionLoomUrl] = useState("");

  useEffect(() => {
    if (mode === "edit_section" && targetSection) {
      setSectionTitle(targetSection.title);
      setSectionId(targetSection.id);
      setSectionDescription(targetSection.description);
      setSectionContent(targetSection.content);
      setSectionLoomUrl(targetSection.loomUrl || "");
    } else if (mode === "add_section") {
      setSectionTitle("");
      setSectionId(`seccion-${Date.now()}`);
      setSectionDescription("");
      setSectionContent("");
      setSectionLoomUrl("");
    } else if (mode === "create_page") {
      setPageTitle("");
      setPageCategory("Configuración CRM");
      setPageSummary("");
      setSectionTitle("1. Introducción y Configuración");
      setSectionId("introduccion-configuracion");
      setSectionDescription("Detalles iniciales de esta guía.");
      setSectionContent("Instrucciones detalladas...");
      setSectionLoomUrl("");
    }
  }, [mode, targetSection, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create_page") {
      if (!pageTitle.trim()) {
        alert("Ingresa un título para la página.");
        return;
      }
      const newSlug = pageTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const newPage: DocPage = {
        slug: newSlug,
        title: pageTitle.trim(),
        category: pageCategory.trim() || "General",
        summary: pageSummary.trim() || pageTitle.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        sections: [
          {
            id: sectionId.trim() || "seccion-inicial",
            title: sectionTitle.trim() || "1. Inicio",
            description: sectionDescription.trim(),
            content: sectionContent.trim(),
            loomUrl: sectionLoomUrl.trim(),
            order: 1
          }
        ]
      };

      saveDocPage(newPage);
      alert(`Página de documentación "${pageTitle}" creada con exito en /doc/${newSlug}`);
      onClose();
      window.location.href = `/doc/${newSlug}`;
      return;
    }

    if (!targetSlug) return;
    const page = getDocPageBySlug(targetSlug);
    if (!page) {
      alert("No se encontró la página a editar.");
      return;
    }

    const cleanSecId = sectionId.trim() || `sec-${Date.now()}`;
    const cleanSecTitle = sectionTitle.trim() || "Nueva Sección";

    let updatedSections = [...page.sections];

    if (mode === "edit_section" && targetSection) {
      const index = updatedSections.findIndex((s) => s.id === targetSection.id);
      if (index !== -1) {
        updatedSections[index] = {
          ...targetSection,
          id: cleanSecId,
          title: cleanSecTitle,
          description: sectionDescription.trim(),
          content: sectionContent.trim(),
          loomUrl: sectionLoomUrl.trim()
        };
      }
    } else if (mode === "add_section") {
      updatedSections.push({
        id: cleanSecId,
        title: cleanSecTitle,
        description: sectionDescription.trim(),
        content: sectionContent.trim(),
        loomUrl: sectionLoomUrl.trim(),
        order: updatedSections.length + 1
      });
    }

    const updatedPage: DocPage = {
      ...page,
      sections: updatedSections,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    saveDocPage(updatedPage);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "680px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "var(--card-bg, #ffffff)",
        borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        padding: "1.75rem"
      }}>
        {/* Header Modal */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                {mode === "create_page" && "Crear Nueva Página de Documentación"}
                {mode === "add_section" && "Agregar Sección a la Página"}
                {mode === "edit_section" && "Editar Sección y Video Loom"}
              </h3>
              <span style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 600 }}>
                Modo Edición Super Admin / Fundador
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {mode === "create_page" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Título de la Guía de Documentación:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Configuración de Métodos de Pago"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Categoría:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Finanzas / Ventas"
                    value={pageCategory}
                    onChange={(e) => setPageCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Resumen corto:
                  </label>
                  <input
                    type="text"
                    placeholder="Explicación breve..."
                    value={pageSummary}
                    onChange={(e) => setPageSummary(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{
            background: "#f8fafc",
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={16} /> Datos de la Sección (URL anchor & Contenido)
            </h4>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Título de la Sección:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 1. Conexión de API y Webhooks"
                value={sectionTitle}
                onChange={(e) => {
                  setSectionTitle(e.target.value);
                  if (mode !== "edit_section") {
                    setSectionId(
                      e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "")
                    );
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                ID de Sección (URL Anchor / Slug):
              </label>
              <input
                type="text"
                required
                placeholder="Ej: conexion-api-webhooks"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                La URL directa de esta sección será: <code>/doc/{targetSlug || "slug"}#{sectionId || "id"}</code>
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Subtítulo / Breve descripción:
              </label>
              <input
                type="text"
                placeholder="Ej: Pasos para habilitar las claves en el panel"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Enlace al Video de Loom (Share URL o Embed URL):
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="url"
                  placeholder="https://www.loom.com/share/e2494fd97a9145899479b1..."
                  value={sectionLoomUrl}
                  onChange={(e) => setSectionLoomUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem 0.55rem 2.25rem",
                    borderRadius: "8px",
                    border: "1px solid #625df5",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                    background: "#ffffff"
                  }}
                />
                <Video size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "#625df5" }} />
              </div>
              <span style={{ fontSize: "0.725rem", color: "#625df5", fontWeight: 600 }}>
                Pega directamente el enlace de Loom que grabaste y se incrustará automáticamente en la sección.
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Contenido / Instrucciones de la sección:
              </label>
              <textarea
                rows={5}
                placeholder="Escribe aquí los pasos detallados para el usuario..."
                value={sectionContent}
                onChange={(e) => setSectionContent(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "0.5rem"
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                background: "#dc2626",
                color: "#ffffff",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
              }}
            >
              <Save size={16} /> Guardar Cambios (Super Admin)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
