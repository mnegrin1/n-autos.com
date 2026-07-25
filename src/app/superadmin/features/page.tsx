"use client";

import { useState, useEffect } from "react";
import { 
  getGlobalFeatures, 
  toggleGlobalFeature, 
  subscribeFeatureFlags, 
  FeatureDefinition 
} from "@/lib/featureFlagsStore";
import { 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Car, 
  MessageSquare, 
  Share2, 
  Users, 
  Mail, 
  Zap 
} from "lucide-react";

export default function SuperAdminFeatures() {
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);

  useEffect(() => {
    setFeatures(getGlobalFeatures());
    const unsubscribe = subscribeFeatureFlags(() => {
      setFeatures(getGlobalFeatures());
    });
    return () => unsubscribe();
  }, []);

  const getFeatureIcon = (id: string) => {
    switch (id) {
      case "vehicles": return <Car size={20} />;
      case "inbox": return <MessageSquare size={20} />;
      case "publications": return <Share2 size={20} />;
      case "crm": return <Users size={20} />;
      case "email": return <Mail size={20} />;
      case "automations": return <Zap size={20} />;
      default: return <Sliders size={20} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Control Global de Funcionalidades CRM
        </h1>
        <p style={{ color: "var(--text-color)", opacity: 0.7 }}>
          Prende o apaga los módulos del CRM de forma general para todos los usuarios. Los cambios se aplican de forma inmediata en las aplicaciones de las automotoras.
        </p>
      </div>

      <div style={{
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        border: "1px solid rgba(37, 99, 235, 0.2)",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <Info size={20} style={{ color: "#2563eb", flexShrink: 0 }} />
        <span style={{ fontSize: "0.875rem", color: "var(--text-color)" }}>
          <strong>Nota:</strong> Si apagas un módulo globalmente, se ocultará en el menú lateral de todos los usuarios, salvo aquellos para los que hayas configurado una excepción específica en el panel de <strong>Usuarios Globales</strong>.
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem"
      }}>
        {features.map((feat) => (
          <div
            key={feat.id}
            style={{
              backgroundColor: "var(--surface-color)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  padding: "0.6rem",
                  borderRadius: "10px",
                  backgroundColor: feat.enabledGlobally ? "rgba(16, 185, 129, 0.1)" : "rgba(128,128,128,0.1)",
                  color: feat.enabledGlobally ? "#10b981" : "var(--text-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {getFeatureIcon(feat.id)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{feat.name}</h3>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {feat.category}
                  </span>
                </div>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "48px", height: "26px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={feat.enabledGlobally}
                  onChange={() => toggleGlobalFeature(feat.id)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: feat.enabledGlobally ? "#10b981" : "var(--border-color)",
                    transition: "0.3s",
                    borderRadius: "34px"
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "20px",
                      width: "20px",
                      left: feat.enabledGlobally ? "24px" : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      transition: "0.3s",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </span>
              </label>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-color)", opacity: 0.8, margin: 0 }}>
              {feat.description}
            </p>

            <div style={{
              marginTop: "auto",
              paddingTop: "0.85rem",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem"
            }}>
              <span style={{ opacity: "0.7" }}>Ruta CRM: <code>{feat.path}</code></span>
              <span style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontWeight: 700,
                color: feat.enabledGlobally ? "#10b981" : "#ef4444"
              }}>
                {feat.enabledGlobally ? (
                  <><CheckCircle2 size={14} /> Encendido Global</>
                ) : (
                  <><XCircle size={14} /> Apagado Global</>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
