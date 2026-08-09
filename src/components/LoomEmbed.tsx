"use client";

import React from "react";
import { Video, Plus, ExternalLink } from "lucide-react";

interface LoomEmbedProps {
  loomUrl?: string;
  sectionTitle?: string;
  isSuperAdmin?: boolean;
  onEditLoomUrl?: () => void;
}

export function extractLoomEmbedUrl(urlStr?: string): string | null {
  if (!urlStr || urlStr.trim() === "") return null;
  const trimmed = urlStr.trim();

  // If already embed URL format
  if (trimmed.includes("loom.com/embed/")) {
    return trimmed;
  }

  // If share URL format: https://www.loom.com/share/815779c88be242aa8863f68faefb4ed6 or with query params
  const shareMatch = trimmed.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (shareMatch && shareMatch[1]) {
    return `https://www.loom.com/embed/${shareMatch[1]}`;
  }

  // Direct ID check if passed just 32 chars hash
  if (/^[a-f0-9]{32}$/i.test(trimmed)) {
    return `https://www.loom.com/embed/${trimmed}`;
  }

  return trimmed;
}

export default function LoomEmbed({
  loomUrl,
  sectionTitle,
  isSuperAdmin = false,
  onEditLoomUrl,
}: LoomEmbedProps) {
  const embedUrl = extractLoomEmbedUrl(loomUrl);

  if (!embedUrl) {
    return (
      <div style={{
        marginTop: "1.25rem",
        marginBottom: "1.5rem",
        padding: "1.75rem 1.5rem",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.06) 100%)",
        border: "1.5px dashed rgba(37, 99, 235, 0.25)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "0.75rem"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "rgba(37, 99, 235, 0.1)",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Video size={24} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--text-color, #1e293b)" }}>
            Video Explicativo Loom
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.825rem", color: "#64748b" }}>
            {isSuperAdmin
              ? "Como Super Admin o Fundador, puedes importar el video de Loom grabado para esta sección."
              : "Próximamente se agregará el video grabado de esta sección."}
          </p>
        </div>

        {isSuperAdmin && onEditLoomUrl && (
          <button
            onClick={onEditLoomUrl}
            style={{
              marginTop: "0.25rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              transition: "all 0.2s ease"
            }}
          >
            <Plus size={15} />
            Incluir Video de Loom
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.25rem", marginBottom: "1.75rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.5rem",
        padding: "0 4px"
      }}>
        <span style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <Video size={14} /> Video Tutorial Loom
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {loomUrl && (
            <a
              href={loomUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.775rem",
                color: "#64748b",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Abrir en Loom <ExternalLink size={12} />
            </a>
          )}

          {isSuperAdmin && onEditLoomUrl && (
            <button
              onClick={onEditLoomUrl}
              style={{
                background: "rgba(37, 99, 235, 0.08)",
                color: "#2563eb",
                border: "none",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cambiar Video
            </button>
          )}
        </div>
      </div>

      <div style={{
        position: "relative",
        paddingBottom: "56.25%", /* 16:9 ratio */
        height: 0,
        overflow: "hidden",
        borderRadius: "16px",
        background: "#000000",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <iframe
          src={embedUrl}
          title={sectionTitle || "Tutorial Loom CRM"}
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0
          }}
        />
      </div>
    </div>
  );
}
