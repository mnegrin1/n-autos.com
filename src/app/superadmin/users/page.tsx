"use client";

import { useState, useEffect } from "react";
import { 
  getGlobalFeatures, 
  getUserOverrides, 
  setUserFeatureOverride, 
  subscribeFeatureFlags, 
  FeatureDefinition, 
  UserFeatureOverrideState 
} from "@/lib/featureFlagsStore";
import { Plus, Search, ShieldAlert, Mail, Sliders, X, Check, Globe } from "lucide-react";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [userOverrides, setUserOverrides] = useState<Record<string, Record<string, UserFeatureOverrideState>>>({});

  useEffect(() => {
    setFeatures(getGlobalFeatures());
    setUserOverrides(getUserOverrides());

    const unsubscribe = subscribeFeatureFlags(() => {
      setFeatures(getGlobalFeatures());
      setUserOverrides(getUserOverrides());
    });
    return () => unsubscribe();
  }, []);

  const handleOpenUserFeatures = (user: typeof users[0]) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleFeatureStateChange = (featureId: string, state: UserFeatureOverrideState) => {
    if (!selectedUser) return;
    setUserFeatureOverride(selectedUser.email, featureId, state);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.agency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Usuarios Globales</h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>
            Gestión de accesos, roles y control específico de funcionalidades CRM por usuario.
          </p>
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
              placeholder="Buscar usuario por email, nombre u organización..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredUsers.map((user) => (
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
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => handleOpenUserFeatures(user)}
                        title="Configurar Funcionalidades del CRM"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          backgroundColor: "rgba(37, 99, 235, 0.1)",
                          color: "#2563eb",
                          border: "none",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        <Sliders size={14} /> Funcionalidades
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Permisos y Funcionalidades del Usuario */}
      {isModalOpen && selectedUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "1.75rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Funcionalidades CRM: {selectedUser.name}
                </h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.2rem 0 0 0" }}>
                  {selectedUser.email} • {selectedUser.agency}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-color)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>
              Configura los permisos específicos de este usuario. Puedes forzar la activación o desactivación de cualquier módulo del CRM, o dejar que herede la configuración global del Superadmin.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {features.map((feat) => {
                const currentOverride = userOverrides[selectedUser.email]?.[feat.id] || "default";
                const isEffectiveEnabled = currentOverride === "enabled" ? true : (currentOverride === "disabled" ? false : feat.enabledGlobally);

                return (
                  <div 
                    key={feat.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "rgba(128,128,128,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{feat.name}</span>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: isEffectiveEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isEffectiveEnabled ? "#10b981" : "#ef4444"
                        }}>
                          {isEffectiveEnabled ? "Activo para Usuario" : "Desactivado para Usuario"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", opacity: 0.7, display: "block", marginTop: "2px" }}>
                        Estado Global: {feat.enabledGlobally ? "Activado" : "Desactivado"}
                      </span>
                    </div>

                    {/* Selector de Override */}
                    <select
                      value={currentOverride}
                      onChange={(e) => handleFeatureStateChange(feat.id, e.target.value as UserFeatureOverrideState)}
                      style={{
                        padding: "0.45rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--surface-color)",
                        color: "var(--text-color)",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="default">Heredar Global</option>
                      <option value="enabled">Forzar Activado</option>
                      <option value="disabled">Forzar Desactivado</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "0.65rem 1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
