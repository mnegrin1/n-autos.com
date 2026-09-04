"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Target, Activity, MousePointerClick, Eye, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getRegisteredAgencies, getRegisteredUsers, subscribeSuperAdminStore, SuperAdminAgency, SuperAdminUser } from "@/lib/superadminStore";
import { LandingClickMetrics } from "@/lib/serverLandingClickStore";

export default function SuperAdminDashboard() {
  const [agencies, setAgencies] = useState<SuperAdminAgency[]>([]);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [landingMetrics, setLandingMetrics] = useState<LandingClickMetrics | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);

  useEffect(() => {
    setAgencies(getRegisteredAgencies());
    setUsers(getRegisteredUsers());

    const unsub = subscribeSuperAdminStore(() => {
      setAgencies(getRegisteredAgencies());
      setUsers(getRegisteredUsers());
    });

    const loadMetrics = async () => {
      try {
        const res = await fetch("/api/landing-clicks?days=14", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.metrics) {
            setLandingMetrics(data.metrics);
          }
        }
      } catch (e) {}

      try {
        const inqRes = await fetch("/api/landing-inquiries", { cache: "no-store" });
        if (inqRes.ok) {
          const inqData = await inqRes.json();
          if (inqData.success && Array.isArray(inqData.inquiries)) {
            setInquiriesCount(inqData.inquiries.length);
          }
        }
      } catch (e) {}
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 15000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const totalAgencies = agencies.length;
  const totalUsers = users.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Dashboard Global</h1>
        <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Métricas principales de toda la plataforma n-sistemas y landing n-autos.com.</p>
      </div>

      {/* SECCIÓN 1: KPIS DE PLATAFORMA */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Stat Card 1 */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Organizaciones</span>
            <div style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#2563eb" }}>
              <Building2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{totalAgencies}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
            Plataforma Multi-tenant Activa
          </div>
        </div>

        {/* Stat Card 2 */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Usuarios Activos</span>
            <div style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#a855f7" }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{totalUsers}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
            Cuentas Registradas
          </div>
        </div>

        {/* Stat Card 3 */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Vehículos en Stock</span>
            <div style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#f97316" }}>
              <Target size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>328</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.6, fontWeight: 500 }}>
            Publicados en total
          </div>
        </div>

        {/* Stat Card 4 */}
        <div style={{
          backgroundColor: "var(--surface-color)",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Leads Totales</span>
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#ef4444" }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{inquiriesCount || 12}</div>
          <Link href="/superadmin/requests" style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
            Ver Consultas y Leads <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* SECCIÓN 2: RESUMEN DE ANALÍTICAS DE LANDING (n-autos.com) */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MousePointerClick size={20} color="#3b82f6" /> Actividad Landing Page (n-autos.com)
            </h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", opacity: 0.7 }}>
              Medición de visitantes, clics en CTAs e interés comercial en tiempo real.
            </p>
          </div>
          <Link
            href="/superadmin/clicks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none"
            }}
          >
            Ver Estadísticas Completas <ArrowUpRight size={15} />
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem"
        }}>
          <div style={{ padding: "1rem", borderRadius: "12px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", marginBottom: "0.3rem" }}>
              <Eye size={16} /> VISITAS TOTALES
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{landingMetrics?.totalVisits || 0}</div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{landingMetrics?.visitsToday || 0} registradas hoy</span>
          </div>

          <div style={{ padding: "1rem", borderRadius: "12px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#3b82f6", marginBottom: "0.3rem" }}>
              <MousePointerClick size={16} /> CLICS EN CTAs
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{landingMetrics?.totalClicks || 0}</div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{landingMetrics?.clicksToday || 0} clics hoy</span>
          </div>

          <div style={{ padding: "1rem", borderRadius: "12px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.3rem" }}>
              <Activity size={16} /> CTR INTERACCIÓN
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{landingMetrics?.ctr || 0}%</div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Tasa de clics / visitas</span>
          </div>

          <div style={{ padding: "1rem", borderRadius: "12px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#10b981", marginBottom: "0.3rem" }}>
              <CheckCircle2 size={16} /> BOTÓN PRINCIPAL
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "4px" }}>
              {landingMetrics?.topButton?.buttonText || "Sin datos"}
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{landingMetrics?.topButton ? `${landingMetrics.topButton.count} clics (${landingMetrics.topButton.percentage}%)` : "Esperando interacciones"}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: ORGANIZACIONES RECIENTES */}
      <div style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Organizaciones Recientes</h2>
          <Link href="/superadmin/agencies" style={{ color: "var(--primary)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}>
            Ver todas
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Nombre</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Subdominio</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Servicio</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Fecha Registro</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {agencies.slice(0, 5).map((agency) => (
                <tr key={agency.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem 0", fontWeight: 600 }}>{agency.name}</td>
                  <td style={{ padding: "1rem 0", opacity: 0.8 }}>{agency.subdomain}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{
                      backgroundColor: "rgba(37, 99, 235, 0.1)",
                      color: "#2563eb",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>
                      Agencia 360°
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8 }}>{agency.createdAt}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


