"use client";

import { useState, useTransition, useEffect } from "react";
import { Globe, ShieldCheck, Copy, Check, RefreshCw, AlertCircle, ExternalLink, Trash2, ArrowRight, Save } from "lucide-react";
import { updateAgencySettings } from "@/actions/agencyActions";
import {
  getAgencyDomainInfo,
  addCustomDomainAction,
  verifyCustomDomainAction,
  removeCustomDomainAction,
  DomainInfoResponse,
} from "@/actions/domainActions";

interface WebDomainSettingsProps {
  agencyId: string;
  subdomain: string;
}

export default function WebDomainSettings({ agencyId, subdomain }: WebDomainSettingsProps) {
  const [domainInfo, setDomainInfo] = useState<DomainInfoResponse | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [subdomainVal, setSubdomainVal] = useState(subdomain || "demo");
  const [isSavingSubdomain, setIsSavingSubdomain] = useState(false);
  const [subdomainSuccessMsg, setSubdomainSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubdomain = subdomainVal.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanSubdomain) return;

    setIsSavingSubdomain(true);
    setSubdomainSuccessMsg("");
    try {
      const res = await updateAgencySettings(agencyId, { subdomain: cleanSubdomain });
      if (res && res.success) {
        setSubdomainVal(cleanSubdomain);
        setSubdomainSuccessMsg(`¡Subdominio guardado con éxito! Tu sitio web está activo en https://${cleanSubdomain}.n-autos.com`);
        setTimeout(() => setSubdomainSuccessMsg(""), 5000);
      } else {
        alert(res?.error || "No se pudo actualizar el subdominio.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el subdominio.");
    } finally {
      setIsSavingSubdomain(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await getAgencyDomainInfo(agencyId);
    setDomainInfo(data);
    if (data.custom_domain) {
      setDomainInput(data.custom_domain);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [agencyId]);

  const handleLinkDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    startTransition(async () => {
      const res = await addCustomDomainAction(agencyId, domainInput);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "No se pudo vincular el dominio.");
      }
    });
  };

  const handleVerify = async () => {
    startTransition(async () => {
      const res = await verifyCustomDomainAction(agencyId);
      if (res.success) {
        await loadData();
        if (res.status === "active") {
          alert("¡Excelente! Tu dominio personalizado está 100% activo y protegido con SSL HTTPS.");
        } else {
          alert("El dominio aún está procesando los registros DNS. Por favor, asegúrate de haber creado el registro CNAME en tu proveedor (GoDaddy, NIC, etc.) y aguarda unos minutos.");
        }
      } else {
        alert(res.error || "Error al verificar el dominio.");
      }
    });
  };

  const handleRemove = async () => {
    if (!confirm("¿Seguro que deseas desvincular tu dominio personalizado?")) return;

    startTransition(async () => {
      const res = await removeCustomDomainAction(agencyId);
      if (res.success) {
        setDomainInput("");
        await loadData();
      } else {
        alert(res.error || "Error al desvincular el dominio.");
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const crmUrl = `https://${subdomainVal || "demo"}.n-autos.com`;
  const isCustomActive = domainInfo?.custom_domain_status === "active";

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", opacity: 0.7 }}>
        Cargando configuración de dominios del sitio web...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sección 1: Subdominio del CRM (Fase 1) */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Globe size={20} style={{ color: "var(--primary)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-color)" }}>
              Subdominio de la Plataforma
            </h3>
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "0.3rem 0.75rem",
              borderRadius: "20px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <ShieldCheck size={14} /> Activo & Listo
          </span>
        </div>

        <p style={{ opacity: 0.75, fontSize: "0.9rem", margin: 0, lineHeight: "1.5" }}>
          Ingresa o modifica el subdominio con el cual tus clientes accederán a tu catálogo y sitio web público.
        </p>

        {/* FORMULARIO EDITABLE DE SUBDOMINIO */}
        <form onSubmit={handleSaveSubdomain} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: "0.75rem", flexWrap: "wrap" }}>
            
            {/* Input Box Contenedor Solido */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flex: "1 1 300px",
              maxWidth: "480px",
              backgroundColor: "var(--bg-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "0.65rem 1rem",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.6, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>https://</span>
              <input
                type="text"
                required
                placeholder="tu-automotora"
                value={subdomainVal}
                onChange={(e) => setSubdomainVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-color)",
                  fontWeight: 800,
                  outline: "none",
                  width: "100%",
                  minWidth: "60px",
                  fontSize: "0.95rem"
                }}
              />
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--primary)", whiteSpace: "nowrap", flexShrink: 0 }}>.n-autos.com</span>
            </div>

            {/* Grupo de Botones de Accion */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={isSavingSubdomain}
                className="btn-primary"
                style={{
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                <Save size={16} />
                {isSavingSubdomain ? "Guardando..." : "Guardar Subdominio"}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(crmUrl)}
                style={{
                  backgroundColor: "var(--surface-hover, transparent)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: copiedText === crmUrl ? "#10b981" : "var(--text-color)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap"
                }}
              >
                {copiedText === crmUrl ? <Check size={16} /> : <Copy size={16} />}
                {copiedText === crmUrl ? "Copiado" : "Copiar Enlace"}
              </button>

              <a
                href={crmUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "0.65rem 1.1rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap"
                }}
              >
                Ver Web <ExternalLink size={16} />
              </a>
            </div>

          </div>

          {subdomainSuccessMsg && (
            <div style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Check size={16} /> {subdomainSuccessMsg}
            </div>
          )}
        </form>

        {/* PANEL ADMINISTRATIVO UNIFICADO */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: "10px",
            padding: "1.15rem",
            marginTop: "0.5rem"
          }}
        >
          <div>
            <strong style={{ fontSize: "0.95rem", color: "#3b82f6", display: "block" }}>
              🔑 Panel de Administración Único & Centralizado
            </strong>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.84rem", opacity: 0.85 }}>
              Toda la gestión de tu automotora (inventario, contactos CRM, integraciones, automatizaciones y editor web) se realiza centralizadamente desde tu cuenta en:
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", backgroundColor: "var(--bg-color)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: "#3b82f6" }}>
              https://admin.n-autos.com/admin
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => handleCopy("https://admin.n-autos.com/admin")}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-color)",
                  cursor: "pointer"
                }}
              >
                Copiar Enlace Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Dominio Personalizado Propio (Fase 2) */}
      <div
        style={{
          backgroundColor: "var(--surface-color)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-color)" }}>
              Conectar Dominio Personalizado (Fase 2)
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.75 }}>
              Usa tu propio dominio web (ej: <strong>www.automotora-martinez.com</strong>) impulsado por <strong>Cloudflare for SaaS</strong> con SSL gratuito.
            </p>
          </div>

          {domainInfo?.custom_domain && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                backgroundColor: isCustomActive ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                color: isCustomActive ? "#10b981" : "#f59e0b",
                border: `1px solid ${isCustomActive ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
              }}
            >
              {isCustomActive ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
              {isCustomActive ? "Dominio & SSL Activo" : "Pendiente de Configuración DNS"}
            </span>
          )}
        </div>

        {/* Formulario para agregar / modificar dominio */}
        <form onSubmit={handleLinkDomain} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}>
              Tu Dominio Web Personalizado *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Globe size={16} style={{ position: "absolute", left: "0.85rem", color: "var(--text-color)", opacity: 0.5 }} />
              <input
                type="text"
                required
                placeholder="ejemplo: www.automotora-martinez.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 0.85rem 0.75rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !domainInput.trim()}
            style={{
              backgroundColor: "var(--text-color)",
              color: "var(--bg-color)",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isPending ? "Conectando..." : domainInfo?.custom_domain ? "Actualizar Dominio" : "Conectar Dominio"}
          </button>
        </form>

        {/* Detalles de Configuración DNS cuando hay un dominio registrado */}
        {domainInfo?.custom_domain && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              marginTop: "0.5rem",
              backgroundColor: "var(--bg-color)",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                  Instrucciones DNS para <span style={{ color: "var(--primary)" }}>{domainInfo.custom_domain}</span>
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
                  Agrega este registro en tu proveedor de dominio (GoDaddy, NIC, DonWeb, Cloudflare, etc.).
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isPending}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.6rem 1.15rem",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
                  {isPending ? "Verificando..." : "Verificar Estado"}
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isPending}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.9rem",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} /> Desvincular
                </button>
              </div>
            </div>

            {/* Registros DNS exigidos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Record 1: CNAME principal */}
              <div
                style={{
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      CNAME
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-color)" }}>
                      Enrutamiento Web Principal
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: isCustomActive ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {isCustomActive ? "✓ Activo" : "Pendiente"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr auto",
                    gap: "0.75rem",
                    alignItems: "center",
                    backgroundColor: "var(--bg-color)",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.7rem", opacity: 0.5, textTransform: "uppercase" }}>Nombre / Host</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, wordBreak: "break-all" }}>
                      {domainInfo.custom_domain.startsWith("www.") ? "www" : domainInfo.custom_domain}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.7rem", opacity: 0.5, textTransform: "uppercase" }}>Valor / Target</span>
                    <span style={{ fontSize: "0.8rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                      admin.n-autos.com
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("admin.n-autos.com")}
                    style={{
                      background: "none",
                      border: "1px solid var(--border-color)",
                      color: copiedText === "admin.n-autos.com" ? "#10b981" : "var(--text-color)",
                      borderRadius: "6px",
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {copiedText === "admin.n-autos.com" ? <Check size={12} /> : <Copy size={12} />}
                    {copiedText === "admin.n-autos.com" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
