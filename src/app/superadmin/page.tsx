"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Target, Activity } from "lucide-react";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalAgencies: 12,
    totalUsers: 45,
    activeListings: 328,
    monthlyLeads: 1250,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Dashboard Global</h1>
        <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Métricas principales de toda la plataforma n-sistemas.</p>
      </div>

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
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.totalAgencies}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
            +2 este mes
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
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.totalUsers}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
            +15 este mes
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
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Vehículos / Propiedades</span>
            <div style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#f97316" }}>
              <Target size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.activeListings}</div>
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
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Leads Mensuales</span>
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#ef4444" }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.monthlyLeads}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
            +12% vs mes anterior
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        marginTop: "1rem"
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
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Fecha Registro</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem 0", fontWeight: 600 }}>Automotores del Sur</td>
                <td style={{ padding: "1rem 0", opacity: 0.8 }}>delsur</td>
                <td style={{ padding: "1rem 0", opacity: 0.8 }}>19 Jul 2026</td>
                <td style={{ padding: "1rem 0" }}>
                  <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem 0", fontWeight: 600 }}>Test-Automotora</td>
                <td style={{ padding: "1rem 0", opacity: 0.8 }}>testauto</td>
                <td style={{ padding: "1rem 0", opacity: 0.8 }}>18 Jul 2026</td>
                <td style={{ padding: "1rem 0" }}>
                  <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
