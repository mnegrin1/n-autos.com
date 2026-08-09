"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Globe, ShieldAlert, Home } from "lucide-react";

interface SubdomainUnavailableViewProps {
  oldSubdomain: string;
  newSubdomain?: string;
  isNotFound?: boolean;
}

export default function SubdomainUnavailableView({
  oldSubdomain,
  newSubdomain,
  isNotFound = false,
}: SubdomainUnavailableViewProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        color: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.08), transparent 70%)",
      }}
    >
      <div
        style={{
          maxWidth: "580px",
          width: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "3rem 2.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            backgroundColor: isNotFound ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
            border: `1px solid ${isNotFound ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isNotFound ? "#ef4444" : "#f59e0b",
          }}
        >
          {isNotFound ? <ShieldAlert size={36} /> : <AlertTriangle size={36} />}
        </div>

        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "#94a3b8",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "inline-block",
              marginBottom: "1rem",
            }}
          >
            {isNotFound ? "Sitio No Encontrado" : "Subdominio Desactualizado"}
          </span>

          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              lineHeight: 1.25,
              margin: 0,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {isNotFound
              ? `El sitio web '${oldSubdomain}' no se encuentra disponible.`
              : `La automotora ha modificado su dirección web.`}
          </h1>
        </div>

        <p
          style={{
            fontSize: "0.98rem",
            color: "#94a3b8",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {isNotFound
            ? `El subdominio '${oldSubdomain}' no está vinculado a ninguna automotora activa en nuestra plataforma.`
            : `El subdominio '${oldSubdomain}.n-sistemas.com' ya no está activo porque la concesionaria actualizó su dirección oficial.`}
        </p>

        {newSubdomain && (
          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#6ee7b7", fontWeight: 600 }}>
              Nueva dirección oficial disponible:
            </span>
            <a
              href={`https://${newSubdomain}.n-sistemas.com`}
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#10b981",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Globe size={18} />
              {newSubdomain}.n-sistemas.com
              <ArrowRight size={18} />
            </a>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          {newSubdomain ? (
            <a
              href={`https://${newSubdomain}.n-sistemas.com`}
              style={{
                backgroundColor: "#10b981",
                color: "#022c22",
                fontWeight: 700,
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.95rem",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
            >
              Ir a la Nueva Dirección <ArrowRight size={16} />
            </a>
          ) : (
            <Link
              href="/"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontWeight: 600,
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              <Home size={16} /> Volver al Inicio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
