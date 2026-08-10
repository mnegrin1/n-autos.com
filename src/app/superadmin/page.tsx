"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Target, Activity } from "lucide-react";
import Link from "next/link";
import { getRegisteredAgencies, getRegisteredUsers, subscribeSuperAdminStore, SuperAdminAgency, SuperAdminUser } from "@/lib/superadminStore";

export default function SuperAdminDashboard() {
  const [agencies, setAgencies] = useState<SuperAdminAgency[]>([]);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);

  useEffect(() => {
    setAgencies(getRegisteredAgencies());
    setUsers(getRegisteredUsers());

    const unsub = subscribeSuperAdminStore(() => {
      setAgencies(getRegisteredAgencies());
      setUsers(getRegisteredUsers());
    });
    return () => unsub();
  }, []);

  const totalAgencies = agencies.length;
  const totalUsers = users.length;

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
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-color)", opacity: 0.8 }}>Leads Mensuales</span>
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "8px", color: "#ef4444" }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>1,250</div>
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

