"use client";

import { useState } from "react";
import { Plus, Search, Building2, MoreVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SuperAdminAgencies() {
  const [agencies, setAgencies] = useState([
    {
      id: "1",
      name: "Automotores del Sur",
      subdomain: "delsur",
      plan: "Pro",
      users: 5,
      properties: 124,
      status: "active",
      createdAt: "19 Jul 2026"
    },
    {
      id: "2",
      name: "Test-Automotora",
      subdomain: "testauto",
      plan: "Free",
      users: 1,
      properties: 2,
      status: "active",
      createdAt: "18 Jul 2026"
    }
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Organizaciones</h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Administra los inquilinos (agencias) de la plataforma.</p>
        </div>
        <button style={{
          backgroundColor: "var(--primary)",
          color: "white",
          border: "none",
          padding: "0.75rem 1.25rem",
          borderRadius: "8px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer"
        }}>
          <Plus size={18} /> Nueva Organización
        </button>
      </div>

      <div style={{
        backgroundColor: "var(--surface-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
      }}>
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          marginBottom: "1.5rem",
          alignItems: "center"
        }}>
          <div style={{
            position: "relative",
            flex: 1,
            maxWidth: "400px"
          }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-color)", opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o subdominio..." 
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.75rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7, paddingLeft: "1rem" }}>Organización</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Subdominio</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Plan</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Uso</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Registro</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Estado</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7, textAlign: "right", paddingRight: "1rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem 0", paddingLeft: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={18} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{agency.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8 }}>{agency.subdomain}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ 
                      backgroundColor: agency.plan === 'Pro' ? "rgba(168, 85, 247, 0.1)" : "rgba(156, 163, 175, 0.1)", 
                      color: agency.plan === 'Pro' ? "#a855f7" : "inherit", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "6px", 
                      fontSize: "0.75rem", 
                      fontWeight: 600 
                    }}>
                      {agency.plan}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.75rem", opacity: 0.8 }}>
                      <span>{agency.users} usuarios</span>
                      <span>{agency.properties} vehic/prop</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8, fontSize: "0.85rem" }}>{agency.createdAt}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                  </td>
                  <td style={{ padding: "1rem 0", textAlign: "right", paddingRight: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6 }}>
                        <Edit size={16} />
                      </button>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger, #ef4444)", opacity: 0.8 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
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
