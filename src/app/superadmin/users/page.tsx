"use client";

import { useState } from "react";
import { Plus, Search, ShieldAlert, Mail } from "lucide-react";

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([
    {
      id: "1",
      name: "Mauricio Negrin",
      email: "mauricio@automotora.com",
      agency: "Test-Automotora",
      role: "Admin (Agencia)",
      status: "active",
      createdAt: "18 Jul 2026"
    },
    {
      id: "2",
      name: "Admin Principal",
      email: "admin@n-sistemas.com",
      agency: "N-Sistemas (Plataforma)",
      role: "Superadmin",
      status: "active",
      createdAt: "1 Ene 2026"
    }
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Usuarios Globales</h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Gestión de accesos y roles de usuarios de todas las organizaciones.</p>
        </div>
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
              placeholder="Buscar usuario por email o nombre..." 
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
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7, paddingLeft: "1rem" }}>Usuario</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Email</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Organización</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Rol Global</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Estado</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7, textAlign: "right", paddingRight: "1rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem 0", paddingLeft: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        backgroundColor: user.role === 'Superadmin' ? "rgba(239, 68, 68, 0.1)" : "var(--primary-light)", 
                        color: user.role === 'Superadmin' ? "#ef4444" : "var(--primary)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem"
                      }}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8, fontSize: "0.9rem" }}>{user.email}</td>
                  <td style={{ padding: "1rem 0", opacity: 0.8, fontSize: "0.9rem" }}>{user.agency}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      backgroundColor: user.role === 'Superadmin' ? "rgba(239, 68, 68, 0.1)" : "rgba(156, 163, 175, 0.1)", 
                      color: user.role === 'Superadmin' ? "#ef4444" : "inherit", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "6px", 
                      fontSize: "0.75rem", 
                      fontWeight: 600,
                      width: "fit-content"
                    }}>
                      {user.role === 'Superadmin' && <ShieldAlert size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                  </td>
                  <td style={{ padding: "1rem 0", textAlign: "right", paddingRight: "1rem" }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.6 }}>
                      <Mail size={16} />
                    </button>
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
