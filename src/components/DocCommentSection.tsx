"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Shield, UserCheck, Sparkles, User } from "lucide-react";
import {
  DocComment,
  getDocComments,
  addDocComment,
  deleteDocComment,
  subscribeDocStore,
  getActiveUserSessionInfo
} from "@/lib/docStore";

interface DocCommentSectionProps {
  docSlug: string;
  sectionId?: string;
  isSuperAdmin?: boolean;
}

export default function DocCommentSection({
  docSlug,
  sectionId,
  isSuperAdmin = false
}: DocCommentSectionProps) {
  const userInfo = getActiveUserSessionInfo();

  const [comments, setComments] = useState<DocComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState(userInfo.userName);
  const [authorRole, setAuthorRole] = useState(userInfo.userRole);

  useEffect(() => {
    function loadComments() {
      const list = getDocComments(docSlug, sectionId);
      setComments(list);
    }
    loadComments();
    const unsub = subscribeDocStore(loadComments);
    return () => unsub();
  }, [docSlug, sectionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addDocComment({
      docSlug,
      sectionId,
      authorName: authorName.trim() || userInfo.userName || "Usuario CRM",
      authorRole: authorRole.trim() || userInfo.userRole || "Cliente",
      authorEmail: userInfo.userEmail,
      content: commentText.trim()
    });

    setCommentText("");
  };

  const handleDelete = (commentId: string) => {
    if (confirm("¿Eliminar este comentario?")) {
      deleteDocComment(commentId);
    }
  };

  return (
    <div style={{
      marginTop: "1.75rem",
      padding: "1.5rem",
      borderRadius: "16px",
      background: "var(--card-bg, #ffffff)",
      border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
      boxShadow: "0 4px 20px -4px rgba(0,0,0,0.03)"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.25rem",
        borderBottom: "1px solid var(--border-color, rgba(226, 232, 240, 0.6))",
        paddingBottom: "0.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            padding: "6px",
            borderRadius: "8px",
            background: "rgba(37, 99, 235, 0.08)",
            color: "#2563eb"
          }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-color, #0f172a)" }}>
              Comentarios y Preguntas
            </h4>
            <p style={{ margin: 0, fontSize: "0.775rem", color: "#64748b" }}>
              {comments.length === 1 ? "1 comentario publicado" : `${comments.length} comentarios publicados`}
            </p>
          </div>
        </div>

        {userInfo.isLoggedIn && (
          <span style={{
            fontSize: "0.75rem",
            padding: "4px 10px",
            borderRadius: "20px",
            background: userInfo.isSuperAdmin ? "rgba(239, 68, 68, 0.08)" : "rgba(37, 99, 235, 0.08)",
            color: userInfo.isSuperAdmin ? "#dc2626" : "#2563eb",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {userInfo.isSuperAdmin ? <Shield size={12} /> : <UserCheck size={12} />}
            Sesión: {userInfo.userName} ({userInfo.isSuperAdmin ? "Super Admin" : "Lectura"})
          </span>
        )}
      </div>

      {/* Form para publicar comentario */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "0.75rem"
        }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
              Tu Nombre:
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej: Mauricio Negrin"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                fontSize: "0.85rem",
                background: "var(--input-bg, #f8fafc)",
                color: "var(--text-color, #0f172a)",
                outline: "none"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
              Cargo / Rol:
            </label>
            <input
              type="text"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              placeholder="Ej: Fundador, Superadmin, Administrador"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                fontSize: "0.85rem",
                background: "var(--input-bg, #f8fafc)",
                color: "var(--text-color, #0f172a)",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu comentario o consulta sobre este tema..."
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #cbd5e1)",
              fontSize: "0.875rem",
              background: "var(--input-bg, #ffffff)",
              color: "var(--text-color, #0f172a)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={!commentText.trim()}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                background: commentText.trim() ? "#2563eb" : "#cbd5e1",
                color: "#ffffff",
                border: "none",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: commentText.trim() ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <Send size={14} /> Publicar Comentario
            </button>
          </div>
        </div>
      </form>

      {/* Lista de comentarios publicados */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {comments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "1.5rem 1rem",
            color: "#94a3b8",
            fontSize: "0.825rem",
            background: "rgba(248, 250, 252, 0.6)",
            borderRadius: "10px",
            border: "1px dashed rgba(203, 213, 225, 0.6)"
          }}>
            Aún no se han realizado comentarios en este apartado. ¡Sé el primero en aportar o preguntar!
          </div>
        ) : (
          comments.map((comment) => {
            const isFounderOrAdmin =
              comment.authorRole.toLowerCase().includes("super") ||
              comment.authorRole.toLowerCase().includes("fundador") ||
              comment.authorRole.toLowerCase().includes("admin");

            return (
              <div
                key={comment.id}
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: isFounderOrAdmin ? "rgba(37, 99, 235, 0.03)" : "rgba(248, 250, 252, 0.8)",
                  border: isFounderOrAdmin ? "1px solid rgba(37, 99, 235, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: isFounderOrAdmin ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#cbd5e1",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700
                    }}>
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-color, #0f172a)" }}>
                          {comment.authorName}
                        </span>
                        <span style={{
                          fontSize: "0.7rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: isFounderOrAdmin ? "#2563eb" : "#e2e8f0",
                          color: isFounderOrAdmin ? "#ffffff" : "#475569",
                          fontWeight: 600
                        }}>
                          {comment.authorRole}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                        {comment.createdAt}
                      </span>
                    </div>
                  </div>

                  {(isSuperAdmin || userInfo.isSuperAdmin) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      title="Eliminar comentario (Super Admin)"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        opacity: 0.8
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--text-color, #334155)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap"
                }}>
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
