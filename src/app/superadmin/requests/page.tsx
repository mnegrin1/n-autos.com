"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getBrandingRequests,
  subscribeBrandingRequestStore,
  approveBrandingRequest,
  rejectBrandingRequest,
  BrandingChangeRequest
} from "@/lib/brandingRequestStore";
import { processApprovedBrandingRequest } from "@/actions/brandingRequestActions";
import { updateTenantAgencyName } from "@/lib/tenantStore";
import { addRegisteredTenant } from "@/lib/superadminStore";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Search, ArrowRight, Building2, Globe, Clock, MessageSquareQuote } from "lucide-react";

export default function SuperAdminRequestsPage() {
  const [requests, setRequests] = useState<BrandingChangeRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRequests(getBrandingRequests());
    const unsub = subscribeBrandingRequestStore(() => {
      setRequests(getBrandingRequests());
    });
    return () => unsub();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filterStatus === "all" || r.status === filterStatus;
    const matchesSearch =
      r.currentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.currentSubdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedSubdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const handleApprove = (req: BrandingChangeRequest) => {
    if (!confirm(`¿Aprobar el cambio de marca para "${req.currentName}" a "${req.requestedName}"? Esto actualizará la base de datos y el portal público.`)) {
      return;
    }

    startTransition(async () => {
      // 1. Procesar cambio en la base de datos y caché del servidor
      const serverRes = await processApprovedBrandingRequest({
        agencyId: req.agencyId,
        newName: req.requestedName,
        newSubdomain: req.requestedSubdomain
      });

      if (serverRes.success) {
        // 2. Marcar solicitud como aprobada en la tienda de solicitudes
        approveBrandingRequest(req.id);

        // 3. Sincronizar TenantStore y SuperadminStore
        updateTenantAgencyName(req.requestedName, req.requestedSubdomain);
        addRegisteredTenant({
          agencyId: req.agencyId,
          agencyName: req.requestedName,
          subdomain: req.requestedSubdomain,
          adminName: req.userName || "Admin Automotora",
          adminEmail: req.userEmail || "admin@automotora.com",
          planName: "Starter"
        });

        setActionSuccessMsg(`✅ Solicitud aprobada con éxito. La automotora "${req.requestedName}" (${req.requestedSubdomain}) ya está actualizada.`);
        setTimeout(() => setActionSuccessMsg(""), 5000);
      } else {
        alert(serverRes.error || "No se pudo procesar la aprobación en el servidor.");
      }
    });
  };

  const handleReject = (req: BrandingChangeRequest) => {
    const reasonPrompt = prompt("Ingrese el motivo del rechazo (opcional):", "Solicitud desestimada por inconsistencia en los datos o riesgo de seguridad.");
    if (reasonPrompt === null) return; // Cancelado

    rejectBrandingRequest(req.id, reasonPrompt);
    setActionSuccessMsg(`❌ Solicitud rechazada para "${req.currentName}".`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
              Solicitudes de Cambio de Branding & Subdominio
            </h1>
            {pendingCount > 0 && (
              <span style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "12px"
              }}>
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p style={{ color: "var(--text-color)", opacity: 0.7, margin: "0.5rem 0 0 0" }}>
            Módulo de aprobación antifraude. Audita y autoriza las modificaciones de razón social y subdominios solicitadas por las automotoras.
          </p>
        </div>
      </div>

      {actionSuccessMsg && (
        <div style={{
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          color: "#10b981",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <CheckCircle size={20} />
          {actionSuccessMsg}
        </div>
      )}

      {/* Main Table Container */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
      }}>
        {/* Filters and Search */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "rgba(0,0,0,0.05)", padding: "4px", borderRadius: "10px" }}>
            <button
              onClick={() => setFilterStatus("pending")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: filterStatus === "pending" ? "var(--primary)" : "transparent",
                color: filterStatus === "pending" ? "#fff" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              ⏳ Pendientes ({requests.filter(r => r.status === "pending").length})
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: filterStatus === "approved" ? "#10b981" : "transparent",
                color: filterStatus === "approved" ? "#fff" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              ✅ Aprobadas ({requests.filter(r => r.status === "approved").length})
            </button>
            <button
              onClick={() => setFilterStatus("rejected")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: filterStatus === "rejected" ? "#ef4444" : "transparent",
                color: filterStatus === "rejected" ? "#fff" : "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              ❌ Rechazadas ({requests.filter(r => r.status === "rejected").length})
            </button>
            <button
              onClick={() => setFilterStatus("all")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: filterStatus === "all" ? "rgba(128,128,128,0.2)" : "transparent",
                color: "var(--text-color)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Todas ({requests.length})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Buscar por nombre, subdominio o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 1rem 0.6rem 2.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "inherit",
                fontSize: "0.85rem"
              }}
            />
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", opacity: 0.6 }}>
            <ShieldCheck size={48} style={{ marginBottom: "0.75rem" }} />
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>No hay solicitudes en esta categoría.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", opacity: 0.8 }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Fecha & Usuario</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Nombre (Actual → Solicitado)</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Subdominio (Actual → Solicitado)</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Motivo / Justificación</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {/* Fecha y Usuario */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{req.userName}</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{req.userEmail}</div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: "2px", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={11} /> {req.createdAt}
                      </div>
                    </td>

                    {/* Nombre */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{req.currentName}</span>
                        <ArrowRight size={14} style={{ opacity: 0.5 }} />
                        <strong style={{ color: "var(--primary)" }}>{req.requestedName}</strong>
                      </div>
                    </td>

                    {/* Subdominio */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <code style={{ fontSize: "0.8rem", opacity: 0.7 }}>{req.currentSubdomain}</code>
                        <ArrowRight size={14} style={{ opacity: 0.5 }} />
                        <code style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>{req.requestedSubdomain}</code>
                      </div>
                    </td>

                    {/* Justificación */}
                    <td style={{ padding: "1rem", maxWidth: "260px" }}>
                      <div style={{ fontSize: "0.85rem", fontStyle: "italic", opacity: 0.9, lineHeight: "1.3" }}>
                        &ldquo;{req.reason}&rdquo;
                      </div>
                    </td>

                    {/* Estado */}
                    <td style={{ padding: "1rem" }}>
                      {req.status === "pending" && (
                        <span style={{
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          color: "#f59e0b",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}>
                          ⏳ Pendiente
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span style={{
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}>
                          ✅ Aprobada
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <div>
                          <span style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem"
                          }}>
                            ❌ Rechazada
                          </span>
                          {req.rejectionReason && (
                            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "4px" }}>
                              {req.rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {req.status === "pending" ? (
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isPending}
                            style={{
                              padding: "0.45rem 0.85rem",
                              borderRadius: "6px",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isPending}
                            style={{
                              padding: "0.45rem 1rem",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: "#10b981",
                              color: "#fff",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                            }}
                          >
                            <CheckCircle size={14} /> Aprobar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>Resuelto ({req.resolvedAt})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
