"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Building2, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  createAgencyAndAdmin, 
  fetchAgencies, 
  fetchAgencyUsers, 
  addUserToAgency, 
  updateUserInAgency, 
  deleteUserFromAgency 
} from "@/actions/superadminActions";

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  plan?: string;
  usersCount?: number;
  properties?: number;
  status?: string;
  created_at?: string;
}

interface User {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function SuperAdminAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([
    {
      id: "1",
      name: "Automotores del Sur",
      subdomain: "delsur",
      plan: "Pro",
      usersCount: 5,
      properties: 124,
      status: "active",
      created_at: "19 Jul 2026"
    },
    {
      id: "2",
      name: "Test-Automotora",
      subdomain: "testauto",
      plan: "Free",
      usersCount: 1,
      properties: 2,
      status: "active",
      created_at: "18 Jul 2026"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state for creating new organization
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Modal / Drawer state for managing users of selected organization
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [agencyUsers, setAgencyUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userFetchError, setUserFetchError] = useState("");

  // Modal states for adding/editing user within organization
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userModalError, setUserModalError] = useState("");
  const [userModalSuccess, setUserModalSuccess] = useState("");

  // Initial load of agencies from database if available
  useEffect(() => {
    async function loadData() {
      const res = await fetchAgencies();
      if (res.success && res.data && res.data.length > 0) {
        const formatted: Agency[] = res.data.map((a: any) => ({
          id: a.id,
          name: a.name,
          subdomain: a.subdomain,
          plan: "Pro",
          usersCount: a.users ? a.users.length : 0,
          properties: 0,
          status: "active",
          created_at: new Date(a.created_at).toLocaleDateString()
        }));
        setAgencies(formatted);
      }
    }
    loadData();
  }, []);

  // When an agency row is pressed
  const handleSelectAgency = async (agency: Agency) => {
    setSelectedAgency(agency);
    setIsLoadingUsers(true);
    setUserFetchError("");

    // Mock fallback users if database is empty or not connected
    const fallbackUsers: User[] = [
      {
        id: "u-1",
        agency_id: agency.id,
        name: "Mauricio Negrin",
        email: `mauricio@${agency.subdomain}.com`,
        role: "admin"
      },
      {
        id: "u-2",
        agency_id: agency.id,
        name: "Vendedor Demo",
        email: `vendedor@${agency.subdomain}.com`,
        role: "agent"
      }
    ];

    const res = await fetchAgencyUsers(agency.id);
    if (res.success && res.data && res.data.length > 0) {
      setAgencyUsers(res.data);
    } else {
      setAgencyUsers(fallbackUsers);
    }
    setIsLoadingUsers(false);
  };

  // Handle Create Organization Form Submit
  const handleCreateAgency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    setCreateSuccess("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createAgencyAndAdmin(formData);
      if (res.success) {
        setCreateSuccess(res.message || "Organización creada exitosamente.");
        const name = formData.get("name") as string;
        const subdomain = formData.get("subdomain") as string;
        const newAgencyObj: Agency = {
          id: res.agencyId || Date.now().toString(),
          name,
          subdomain,
          plan: "Agencia 360°",
          usersCount: 1,
          properties: 0,
          status: "active",
          created_at: "Recién"
        };

        setAgencies(prev => [newAgencyObj, ...prev]);

        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateSuccess("");
        }, 1200);
      } else {
        setCreateError(res.error || "Ocurrió un error.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Error al procesar solicitud.");
    } finally {
      setIsCreating(false);
    }
  };

  // Open User Modal for Create or Edit
  const handleOpenUserModal = (userToEdit?: User) => {
    setEditingUser(userToEdit || null);
    setUserModalError("");
    setUserModalSuccess("");
    setIsUserModalOpen(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgency) return;

    setIsSubmittingUser(true);
    setUserModalError("");
    setUserModalSuccess("");

    const formData = new FormData(e.currentTarget);
    formData.append("agency_id", selectedAgency.id);

    try {
      if (editingUser) {
        formData.append("user_id", editingUser.id);
        const res = await updateUserInAgency(formData);
        if (res.success) {
          setUserModalSuccess("Usuario actualizado.");
          const name = formData.get("name") as string;
          const role = formData.get("role") as string;
          setAgencyUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name, role } : u));
          setTimeout(() => {
            setIsUserModalOpen(false);
            setUserModalSuccess("");
          }, 1000);
        } else {
          setUserModalError(res.error || "Error al actualizar usuario.");
        }
      } else {
        const res = await addUserToAgency(formData);
        if (res.success) {
          setUserModalSuccess("Usuario creado correctamente.");
          const name = formData.get("name") as string;
          const email = formData.get("email") as string;
          const role = formData.get("role") as string;

          const newUser: User = {
            id: Date.now().toString(),
            agency_id: selectedAgency.id,
            name,
            email,
            role
          };

          setAgencyUsers(prev => [newUser, ...prev]);
          setAgencies(prev => prev.map(a => a.id === selectedAgency.id ? { ...a, usersCount: (a.usersCount || 0) + 1 } : a));

          setTimeout(() => {
            setIsUserModalOpen(false);
            setUserModalSuccess("");
          }, 1000);
        } else {
          setUserModalError(res.error || "Error al agregar usuario.");
        }
      }
    } catch (err: any) {
      setUserModalError(err.message || "Error al guardar usuario.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?`)) return;

    const res = await deleteUserFromAgency(userId);
    if (res.success) {
      setAgencyUsers(prev => prev.filter(u => u.id !== userId));
      setAgencies(prev => prev.map(a => a.id === selectedAgency?.id ? { ...a, usersCount: Math.max(0, (a.usersCount || 1) - 1) } : a));
    } else {
      alert(res.error || "No se pudo eliminar el usuario.");
    }
  };

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Organizaciones</h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Haz clic sobre cualquier organización para administrar sus usuarios.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          style={{
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
          }}
        >
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Servicio</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Usuarios</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Registro</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Estado</th>
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7, textAlign: "right", paddingRight: "1rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgencies.map((agency) => (
                <tr 
                  key={agency.id} 
                  onClick={() => handleSelectAgency(agency)}
                  style={{ 
                    borderBottom: "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-hover, rgba(255,255,255,0.03))"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={{ padding: "1rem 0", paddingLeft: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{agency.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", opacity: 0.9 }}>Clic para administrar usuarios</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8 }}>{agency.subdomain}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ 
                      backgroundColor: "rgba(37, 99, 235, 0.1)", 
                      color: "#2563eb", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "6px", 
                      fontSize: "0.75rem", 
                      fontWeight: 600 
                    }}>
                      Agencia 360°
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                      <Users size={14} style={{ opacity: 0.7 }} />
                      <span>{agency.usersCount || 0} usuarios</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8, fontSize: "0.85rem" }}>{agency.created_at || "Activo"}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                  </td>
                  <td style={{ padding: "1rem 0", textAlign: "right", paddingRight: "1rem" }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAgency(agency);
                      }}
                      style={{
                        backgroundColor: "var(--primary-light, rgba(37,99,235,0.1))",
                        color: "var(--primary)",
                        border: "none",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <Users size={14} /> Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / MODAL FOR MANAGING ORGANIZATION USERS */}
      {selectedAgency && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            width: "100%",
            maxWidth: "650px",
            height: "100%",
            padding: "2rem",
            boxShadow: "-10px 0 25px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            overflowY: "auto",
            position: "relative"
          }}>
            <button 
              onClick={() => setSelectedAgency(null)}
              style={{
                position: "absolute", top: "1.5rem", right: "1.5rem",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-color)", opacity: 0.5
              }}
            >
              <X size={22} />
            </button>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>
                <Building2 size={16} /> {selectedAgency.subdomain}
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem", color: "var(--text-color)" }}>
                {selectedAgency.name}
              </h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Gestión de usuarios y accesos de la organización.</p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} /> Usuarios ({agencyUsers.length})
              </h3>
              <button 
                onClick={() => handleOpenUserModal()}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer"
                }}
              >
                <UserPlus size={16} /> Agregar Usuario
              </button>
            </div>

            {isLoadingUsers ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {agencyUsers.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", opacity: 0.6, fontSize: "0.9rem" }}>
                    No hay usuarios registrados en esta organización.
                  </div>
                ) : (
                  agencyUsers.map((user) => (
                    <div 
                      key={user.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: user.role === 'admin' ? "rgba(239, 68, 68, 0.1)" : "var(--primary-light)",
                          color: user.role === 'admin' ? "#ef4444" : "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700
                        }}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{user.name}</div>
                          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{user.email}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          backgroundColor: user.role === 'admin' ? "rgba(239,68,68,0.1)" : "rgba(37,99,235,0.1)",
                          color: user.role === 'admin' ? "#ef4444" : "#2563eb",
                          textTransform: "uppercase"
                        }}>
                          {user.role}
                        </span>

                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button 
                            onClick={() => handleOpenUserModal(user)}
                            title="Editar usuario"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.4rem",
                              borderRadius: "6px",
                              color: "var(--text-color)",
                              opacity: 0.7
                            }}
                          >
                            <Edit size={16} />
                          </button>

                          <button 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            title="Eliminar usuario"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.4rem",
                              borderRadius: "6px",
                              color: "#ef4444"
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW ORGANIZATION MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "500px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative"
          }}>
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-color)", opacity: 0.5
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Nueva Organización</h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1.5rem" }}>Crea una agencia y su cuenta de administrador principal.</p>

            {createError && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {createError}
              </div>
            )}
            {createSuccess && (
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAgency} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nombre de la Agencia</label>
                  <input required name="name" type="text" placeholder="Ej: AutoMotors" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Subdominio</label>
                  <input required name="subdomain" type="text" placeholder="ej: automotors" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email Administrador</label>
                <input required name="email" type="email" placeholder="admin@automotors.com" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Contraseña Inicial</label>
                <input required name="password" type="password" placeholder="••••••••" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating} style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "none", backgroundColor: "var(--primary)", color: "white", fontWeight: 600, cursor: isCreating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {isCreating && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL FOR SELECTED ORGANIZATION */}
      {isUserModalOpen && selectedAgency && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "450px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            <button 
              onClick={() => setIsUserModalOpen(false)}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-color)", opacity: 0.5
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              {editingUser ? "Editar Usuario" : "Agregar Usuario"}
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1.5rem" }}>
              Organización: <strong>{selectedAgency.name}</strong>
            </p>

            {userModalError && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {userModalError}
              </div>
            )}
            {userModalSuccess && (
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {userModalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nombre Completo</label>
                <input 
                  required 
                  name="name" 
                  type="text" 
                  defaultValue={editingUser?.name || ""} 
                  placeholder="Ej: Juan Pérez" 
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} 
                />
              </div>

              {!editingUser && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Correo Electrónico</label>
                  <input 
                    required 
                    name="email" 
                    type="email" 
                    placeholder="usuario@dominio.com" 
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} 
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Rol dentro de la Agencia</label>
                <select 
                  name="role" 
                  defaultValue={editingUser?.role || "agent"} 
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }}
                >
                  <option value="admin">Administrador de Agencia (Admin)</option>
                  <option value="manager">Gerente / Manager</option>
                  <option value="agent">Agente / Vendedor</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {editingUser ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                </label>
                <input 
                  required={!editingUser} 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)} 
                  style={{ padding: "0.75rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingUser} 
                  style={{ padding: "0.75rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "var(--primary)", color: "white", fontWeight: 600, cursor: isSubmittingUser ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {isSubmittingUser && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
