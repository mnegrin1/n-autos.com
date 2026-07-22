"use client";

import { useState, useTransition, useEffect } from "react";
import { Mail, ShieldCheck, Copy, Check, RefreshCw, Globe, AlertCircle, ExternalLink } from "lucide-react";
import { addCustomDomain, verifyCustomDomain, getCustomDomainStatus, DNSRecord } from "@/actions/emailDomainActions";

interface EmailDomainSettingsProps {
  agencyId: string;
}

export default function EmailDomainSettings({ agencyId }: EmailDomainSettingsProps) {
  const [domainInput, setDomainInput] = useState("");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getCustomDomainStatus();
      if (data && data.domain) {
        setActiveDomain(data.domain);
        setDomainInput(data.domain);
        setRecords(data.records || []);
        setIsVerified(data.status === "verified");
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleLinkDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    startTransition(async () => {
      const res = await addCustomDomain(agencyId, domainInput);
      if (res.success && res.domain) {
        setActiveDomain(res.domain);
        setRecords(res.records || []);
        setIsVerified(res.status === "verified");
      } else {
        alert(res.error || "No se pudo vincular el dominio.");
      }
    });
  };

  const handleVerify = async () => {
    startTransition(async () => {
      const res = await verifyCustomDomain(agencyId);
      if (res.success) {
        setIsVerified(res.verified);
        if (res.records) setRecords(res.records);
        if (res.verified) {
          alert("¡Felicitaciones! Tu dominio ha sido verificado con éxito.");
        } else {
          alert("Aún no detectamos los registros DNS en Cloudflare / GoDaddy. Recuerda verificar que la nube (Proxy) esté deshabilitada y espera unos minutos.");
        }
      } else {
        alert(res.error || "Error verificando dominio.");
      }
    });
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", opacity: 0.7 }}>
        Cargando configuración de correos...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "2rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Mail size={20} style={{ color: "var(--primary)" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-color)" }}>
            Configuración de Correo Electrónico (Marca Propia)
          </h3>
        </div>

        {activeDomain && (
          <span 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.35rem", 
              fontSize: "0.8rem", 
              fontWeight: 700, 
              padding: "0.3rem 0.75rem", 
              borderRadius: "20px",
              backgroundColor: isVerified ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              color: isVerified ? "#10b981" : "#f59e0b",
              border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
            }}
          >
            {isVerified ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            {isVerified ? "Dominio Verificado y Operativo" : "Pendiente de Registros DNS"}
          </span>
        )}
      </div>

      <p style={{ opacity: 0.75, fontSize: "0.9rem", marginTop: "-0.5rem", lineHeight: "1.5" }}>
        Configura el dominio oficial de tu concesionaria (ej. <strong>contacto@mi-automotora.com</strong>) para que tus cotizaciones y mensajes salgan con tu marca comercial y las respuestas ingresen automáticamente al Inbox.
      </p>

      {/* Domain Link Form */}
      <form onSubmit={handleLinkDomain} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}>
            Dominio Comercial de la Automotora *
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Globe size={16} style={{ position: "absolute", left: "0.85rem", color: "var(--text-color)", opacity: 0.5 }} />
            <input 
              type="text" 
              required
              placeholder="ejemplo: mi-automotora.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 0.85rem 0.75rem 2.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
                fontSize: "0.9rem"
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
            whiteSpace: "nowrap"
          }}
        >
          {isPending ? "Vinculando..." : activeDomain ? "Actualizar Dominio" : "Vincular Dominio"}
        </button>
      </form>

      {/* DNS Records Section */}
      {activeDomain && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "0.5rem", backgroundColor: "var(--bg-color)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                Registros DNS para <span style={{ color: "var(--primary)" }}>{activeDomain}</span>
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
                Agrega los siguientes registros en tu proveedor de dominio (Cloudflare, GoDaddy, Hostinger).
              </p>
            </div>

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
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
              {isPending ? "Verificando..." : "Verificar Dominio"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {records.map((rec, idx) => (
              <div 
                key={idx}
                style={{
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span 
                      style={{ 
                        backgroundColor: rec.type === "TXT" ? "rgba(59, 130, 246, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        color: rec.type === "TXT" ? "#3b82f6" : "#a855f7",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px"
                      }}
                    >
                      {rec.type}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-color)" }}>
                      {rec.purpose}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: isVerified || rec.status === "verified" ? "#10b981" : "#f59e0b" }}>
                    {isVerified || rec.status === "verified" ? "✓ OK" : "Pendiente"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "0.75rem", alignItems: "center", backgroundColor: "var(--bg-color)", padding: "0.6rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.7rem", opacity: 0.5, textTransform: "uppercase" }}>Nombre / Host</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, wordBreak: "break-all" }}>{rec.name}</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.7rem", opacity: 0.5, textTransform: "uppercase" }}>Valor / Destino</span>
                    <span style={{ fontSize: "0.8rem", fontFamily: "monospace", wordBreak: "break-all" }}>{rec.value}</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleCopy(`${rec.name}\t${rec.value}`, idx)}
                    style={{
                      background: "none",
                      border: "1px solid var(--border-color)",
                      color: copiedIndex === idx ? "#10b981" : "var(--text-color)",
                      borderRadius: "6px",
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                    title="Copiar valor"
                  >
                    {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                    {copiedIndex === idx ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
