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
  CheckCircle2, 
  Mail, 
  Globe, 
  Copy, 
  ExternalLink, 
  Check,
  LogIn
} from "lucide-react";
import { 
  createAgencyAndAdmin, 
  fetchAgencies, 
  fetchAgencyUsers, 
  addUserToAgency, 
  updateUserInAgency, 
  deleteUserFromAgency,
  updateAgency,
  deleteAgency,
  switchTenantSessionAction
} from "@/actions/superadminActions";
import {
  getRegisteredAgencies,
  addRegisteredTenant,
  deleteRegisteredAgency,
  updateRegisteredAgency,
  addRegisteredUser,
  subscribeSuperAdminStore,
  SuperAdminAgency
} from "@/lib/superadminStore";

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
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state for creating new organization
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [createdInviteInfo, setCreatedInviteInfo] = useState<{ url: string; code: string; email: string; emailSent: boolean } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Modal state for editing organization name & subdomain
  const [isEditAgencyModalOpen, setIsEditAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isUpdatingAgency, setIsUpdatingAgency] = useState(false);
  const [editAgencyError, setEditAgencyError] = useState("");
  const [editAgencySuccess, setEditAgencySuccess] = useState("");

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

  // Switching tenant loading state
  const [switchingAgencyId, setSwitchingAgencyId] = useState<string | null>(null);

  // Function to refresh agency list from store + server
  const loadAgenciesData = async () => {
    const storeAgencies = getRegisteredAgencies();
    const formattedFromStore: Agency[] = storeAgencies.map((sa: SuperAdminAgency) => ({
      id: sa.id,
      name: sa.name,
      subdomain: sa.subdomain,
      plan: sa.plan || "Agencia 360°",
      usersCount: sa.users || 1,
      properties: sa.properties || 0,
      status: sa.status || "active",
      created_at: sa.createdAt || "Activo",
    }));

    try {
      const res = await fetchAgencies();
      if (res.success && res.data && res.data.length > 0) {
        const dbAgencies: Agency[] = res.data.map((a: any) => ({
          id: a.id,
          name: a.name,
          subdomain: a.subdomain,
          plan: "Agencia 360°",
          usersCount: a.users ? a.users.length : 1,
          properties: 0,
          status: "active",
          created_at: new Date(a.created_at || Date.now()).toLocaleDateString(),
        }));

        // Merge DB agencies with store agencies to avoid duplicates
        const map = new Map<string, Agency>();
        formattedFromStore.forEach(a => map.set(a.id, a));
        dbAgencies.forEach(a => map.set(a.id, a));

        setAgencies(Array.from(map.values()));
        return;
      }
    } catch (e) {
      console.warn("Could not fetch agencies from server DB, using local store:", e);
    }

    setAgencies(formattedFromStore);
  };

  useEffect(() => {
    loadAgenciesData();
    const unsub = subscribeSuperAdminStore(() => {
      loadAgenciesData();
    });
    return () => unsub();
  }, []);

  // Select agency row to manage users
  const handleSelectAgency = async (agency: Agency) => {
    setSelectedAgency(agency);
    setIsLoadingUsers(true);
    setUserFetchError("");

    const fallbackUsers: User[] = [
      {
        id: `u-admin-${agency.id}`,
        agency_id: agency.id,
        name: `Admin ${agency.name}`,
        email: `admin@${agency.subdomain}.com`,
        role: "admin"
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

  // Switch session to act as Admin of selected organization
  const handleSwitchTenant = async (agency: Agency, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSwitchingAgencyId(agency.id);

    try {
      const res = await switchTenantSessionAction(agency.id, agency.subdomain, agency.name);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        alert(res.error || "No se pudo cambiar de organización.");
        setSwitchingAgencyId(null);
      }
    } catch (err: any) {
      alert("Error al cambiar de organización: " + (err.message || "Error desconocido"));
      setSwitchingAgencyId(null);
    }
  };

  // Delete Organization
  const handleDeleteAgency = async (agency: Agency, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la organización "${agency.name}" (${agency.subdomain})?\n\nEsta acción eliminará el subdominio y sus accesos.`)) {
      return;
    }

    try {
      const res = await deleteAgency(agency.id);
      await deleteAgency(agency.subdomain);
      if (agency.subdomain.toLowerCase() === "carmax") {
        await deleteAgency("tenant-carmax-001");
      }

      deleteRegisteredAgency(agency.id);
      deleteRegisteredAgency(agency.subdomain);
      if (agency.subdomain.toLowerCase() === "carmax") {
        deleteRegisteredAgency("carmax");
        deleteRegisteredAgency("tenant-carmax-001");
      }

      setAgencies(prev => prev.filter(a => a.id !== agency.id && a.subdomain.toLowerCase() !== agency.subdomain.toLowerCase()));
      if (selectedAgency?.id === agency.id || selectedAgency?.subdomain === agency.subdomain) {
        setSelectedAgency(null);
      }
    } catch (err: any) {
      alert("Error al eliminar la organización: " + (err.message || "Error desconocido"));
    }

  };

  // Handle Create Organization Form Submit
  const handleCreateAgency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    setCreateSuccess("");
    setCreatedInviteInfo(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const subdomain = formData.get("subdomain") as string;
    const adminName = (formData.get("admin_name") as string)?.trim() || "Administrador";
    const email = formData.get("email") as string;

    try {
      const res = await createAgencyAndAdmin(formData);
      if (res.success) {
        setCreateSuccess(res.message || "Organización creada exitosamente.");
        const newAgencyId = res.agencyId || `agency-${Date.now()}`;

        // Update local reactive store
        addRegisteredTenant({
          agencyId: newAgencyId,
          agencyName: name,
          subdomain,
          adminName: adminName,
          adminEmail: email,
          planName: "Agencia 360°"
        });


        const newAgencyObj: Agency = {
          id: newAgencyId,
          name,
          subdomain,
          plan: "Agencia 360°",
          usersCount: 1,
          properties: 0,
          status: "active",
          created_at: "Recién"
        };

        setAgencies(prev => [newAgencyObj, ...prev.filter(a => a.id !== newAgencyId)]);

        if (res.inviteUrl) {
          setCreatedInviteInfo({
            url: res.inviteUrl,
            code: res.activationCode || "",
            email: email,
            emailSent: !!res.emailSent
          });
        } else {
          setTimeout(() => {
            setIsCreateModalOpen(false);
            setCreateSuccess("");
          }, 1200);
        }
      } else {
        setCreateError(res.error || "Ocurrió un error al crear la organización.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Error al procesar solicitud.");
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit Agency Modal
  const handleOpenEditAgencyModal = (agency: Agency, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAgency(agency);
    setEditAgencyError("");
    setEditAgencySuccess("");
    setIsEditAgencyModalOpen(true);
  };

  // Handle Edit Organization Form Submit (Name & Subdomain)
  const handleUpdateAgency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAgency) return;

    setIsUpdatingAgency(true);
    setEditAgencyError("");
    setEditAgencySuccess("");

    const formData = new FormData(e.currentTarget);
    formData.append("agency_id", editingAgency.id);

    try {
      const res = await updateAgency(formData);
      if (res.success) {
        setEditAgencySuccess("Organización actualizada exitosamente.");
        const name = formData.get("name") as string;
        const subdomain = formData.get("subdomain") as string;

        updateRegisteredAgency(editingAgency.id, { name, subdomain });
        setAgencies(prev => prev.map(a => a.id === editingAgency.id ? { ...a, name, subdomain } : a));
        if (selectedAgency?.id === editingAgency.id) {
          setSelectedAgency(prev => prev ? { ...prev, name, subdomain } : null);
        }

        setTimeout(() => {
          setIsEditAgencyModalOpen(false);
          setEditAgencySuccess("");
        }, 1000);
      } else {
        setEditAgencyError(res.error || "Error al actualizar la organización.");
      }
    } catch (err: any) {
      setEditAgencyError(err.message || "Error inesperado al actualizar la organización.");
    } finally {
      setIsUpdatingAgency(false);
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
            id: res.userId || Date.now().toString(),
            agency_id: selectedAgency.id,
            name,
            email,
            role
          };

          addRegisteredUser({
            id: newUser.id,
            name,
            email,
            agencyName: selectedAgency.name,
            agencyId: selectedAgency.id,
            role: role === "admin" ? "Admin (Agencia)" : "Agente"
          });

          setAgencyUsers(prev => [newUser, ...prev]);
          setAgencies(prev => prev.map(a => a.id === selectedAgency.id ? { ...a, usersCount: (a.usersCount || 0) + 1 } : a));

          if (res.inviteUrl) {
            setCreatedInviteInfo({
              url: res.inviteUrl,
              code: res.activationCode || "",
              email: email,
              emailSent: !!res.emailSent
            });
          } else {
            setTimeout(() => {
              setIsUserModalOpen(false);
              setUserModalSuccess("");
            }, 1000);
          }
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
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>Administra el nombre, dominio, accesos y usuarios de las automotoras registradas.</p>
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
                <th style={{ padding: "1rem 0", fontSize: "0.85rem", opacity: 0.7 }}>Subdominio / URL</th>
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
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {agency.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", opacity: 0.9 }}>Clic para administrar usuarios</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-color)" }}>
                      <Globe size={14} style={{ opacity: 0.6 }} />
                      <code>{agency.subdomain}</code>
                      <a 
                        href={typeof window !== "undefined" && window.location.hostname.endsWith(".localhost") 
                          ? `http://${agency.subdomain}.localhost:3000` 
                          : `https://${agency.subdomain}.n-autos.com`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir sitio web público de la automotora"
                        style={{ color: "var(--primary)", display: "inline-flex", marginLeft: "4px" }}
                      >
                        <ExternalLink size={13} />
                      </a>

                    </div>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ 
                      backgroundColor: "rgba(37, 99, 235, 0.1)", 
                      color: "#2563eb", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "6px", 
                      fontSize: "0.75rem", 
                      fontWeight: 600 
                    }}>
                      {agency.plan || "Agencia 360°"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                      <Users size={14} style={{ opacity: 0.7 }} />
                      <span>{agency.usersCount || 1} usuarios</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 0", opacity: 0.8, fontSize: "0.85rem" }}>{agency.created_at || "Activo"}</td>
                  <td style={{ padding: "1rem 0" }}>
                    <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Activo</span>
                  </td>
                  <td style={{ padding: "1rem 0", textAlign: "right", paddingRight: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                      <button 
                        onClick={(e) => handleSwitchTenant(agency, e)}
                        disabled={switchingAgencyId === agency.id}
                        title="Ingresar como Administrador de esta automotora"
                        style={{
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          padding: "0.4rem 0.65rem",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          cursor: switchingAgencyId === agency.id ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}
                      >
                        {switchingAgencyId === agency.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <LogIn size={13} />}
                        Ingresar Admin
                      </button>

                      <button 
                        onClick={(e) => handleOpenEditAgencyModal(agency, e)}
                        title="Editar nombre y subdominio de la automotora"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: "var(--text-color)",
                          border: "1px solid var(--border-color)",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}
                      >
                        <Edit size={14} /> Editar
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAgency(agency);
                        }}
                        title="Gestionar usuarios de la automotora"
                        style={{
                          backgroundColor: "var(--primary-light, rgba(37,99,235,0.1))",
                          color: "var(--primary)",
                          border: "none",
                          padding: "0.4rem 0.65rem",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}
                      >
                        <Users size={14} /> Usuarios
                      </button>

                      <button 
                        onClick={(e) => handleDeleteAgency(agency, e)}
                        title="Eliminar organización"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          border: "none",
                          padding: "0.4rem 0.55rem",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / MODAL FOR MANAGING ORGANIZATION USERS & INFO */}
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
          <div 
            className="drawerContent"
            style={{
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
            }}
          >
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
                <Globe size={15} /> {selectedAgency.subdomain}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-color)", margin: 0 }}>
                  {selectedAgency.name}
                </h2>
                <button 
                  onClick={() => handleOpenEditAgencyModal(selectedAgency)}
                  style={{
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: "var(--primary)",
                    border: "none",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <Edit size={13} /> Editar Nombre / Dominio
                </button>
              </div>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.35rem" }}>Gestión de usuarios y accesos de la automotora.</p>
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
                          {user.name ? user.name.substring(0, 2).toUpperCase() : "US"}
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

      {/* EDIT AGENCY NAME & SUBDOMAIN MODAL */}
      {isEditAgencyModalOpen && editingAgency && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1150
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "460px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            <button 
              onClick={() => setIsEditAgencyModalOpen(false)}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-color)", opacity: 0.5
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>Editar Automotora</h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "1.5rem" }}>
              Modifica el nombre oficial de la automotora o su subdominio / URL asignado.
            </p>

            {editAgencyError && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 500 }}>
                {editAgencyError}
              </div>
            )}
            {editAgencySuccess && (
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 500 }}>
                {editAgencySuccess}
              </div>
            )}

            <form onSubmit={handleUpdateAgency} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nombre de la Automotora</label>
                <input 
                  required 
                  name="name" 
                  type="text" 
                  defaultValue={editingAgency.name} 
                  placeholder="Ej: Automotores del Sur" 
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Subdominio / Dominio Asignado</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", paddingLeft: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.6, userSelect: "none" }}>https://</span>
                  <input 
                    required 
                    name="subdomain" 
                    type="text" 
                    defaultValue={editingAgency.subdomain} 
                    placeholder="ej: delsur" 
                    style={{ flex: 1, padding: "0.75rem 0.75rem 0.75rem 0.25rem", border: "none", backgroundColor: "transparent", color: "var(--text-color)", outline: "none", fontFamily: "inherit" }} 
                  />
                  <span style={{ fontSize: "0.85rem", opacity: 0.6, paddingRight: "0.75rem", userSelect: "none" }}>.n-autos.com</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditAgencyModalOpen(false)} 
                  style={{ padding: "0.75rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdatingAgency} 
                  style={{ padding: "0.75rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "var(--primary)", color: "white", fontWeight: 600, cursor: isUpdatingAgency ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {isUpdatingAgency && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
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
            maxWidth: "520px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            position: "relative"
          }}>
            <button 
              onClick={() => { setIsCreateModalOpen(false); setCreatedInviteInfo(null); }}
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

            {createdInviteInfo ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "1rem", borderRadius: "12px", color: "var(--text-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#10b981", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={20} /> ¡Organización y Usuario Creados!
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9, lineHeight: 1.5 }}>
                    {createdInviteInfo.emailSent
                      ? `Se ha enviado el correo de activación a ${createdInviteInfo.email}.`
                      : `La cuenta se creó correctamente para ${createdInviteInfo.email}. Usa el enlace directo a continuación:`}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Enlace de Activación Directo</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      readOnly 
                      value={createdInviteInfo.url} 
                      style={{ flex: 1, padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.82rem", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdInviteInfo.url);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }}
                      style={{ padding: "0.65rem 1rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      {copiedInvite ? <Check size={16} /> : <Copy size={16} />}
                      {copiedInvite ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <a 
                    href={createdInviteInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ flex: 1, textAlign: "center", padding: "0.75rem", backgroundColor: "#16a34a", color: "white", borderRadius: "10px", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <ExternalLink size={16} /> Abrir y Establecer Contraseña
                  </a>
                  <button 
                    type="button" 
                    onClick={() => { setIsCreateModalOpen(false); setCreatedInviteInfo(null); }}
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nombre del Administrador</label>
                    <input required name="admin_name" type="text" placeholder="Ej: Mauricio Negrin" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email Administrador</label>
                    <input required name="email" type="email" placeholder="admin@automotors.com" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} />
                  </div>
                </div>


                <div style={{ backgroundColor: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.2)", padding: "0.85rem", borderRadius: "8px", fontSize: "0.82rem", color: "var(--text-color)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <Mail size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Invitación automática por correo:</strong> No se requiere ingresar contraseña. Se enviará un correo de activación a este administrador desde <code>contacto@n-sistemas.com</code> con el botón para crear su contraseña.
                  </div>
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
            )}
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
            maxWidth: "480px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            <button 
              onClick={() => { setIsUserModalOpen(false); setCreatedInviteInfo(null); }}
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

            {createdInviteInfo ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "1rem", borderRadius: "12px", color: "var(--text-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#10b981", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={20} /> ¡Usuario Agregado Exitosamente!
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9, lineHeight: 1.5 }}>
                    {createdInviteInfo.emailSent
                      ? `Se envió un correo de activación a ${createdInviteInfo.email}.`
                      : `Usuario registrado para ${createdInviteInfo.email}. Enlace de activación directo:`}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700 }}>Enlace de Activación Directo</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      readOnly 
                      value={createdInviteInfo.url} 
                      style={{ flex: 1, padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.82rem", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdInviteInfo.url);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }}
                      style={{ padding: "0.65rem 1rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      {copiedInvite ? <Check size={16} /> : <Copy size={16} />}
                      {copiedInvite ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <a 
                    href={createdInviteInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ flex: 1, textAlign: "center", padding: "0.75rem", backgroundColor: "#16a34a", color: "white", borderRadius: "10px", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <ExternalLink size={16} /> Abrir y Establecer Contraseña
                  </a>
                  <button 
                    type="button" 
                    onClick={() => { setIsUserModalOpen(false); setCreatedInviteInfo(null); }}
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-color)", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
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

                {editingUser ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      Nueva Contraseña (dejar en blanco para no cambiar)
                    </label>
                    <input 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)", outline: "none" }} 
                    />
                  </div>
                ) : (
                  <div style={{ backgroundColor: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.2)", padding: "0.85rem", borderRadius: "8px", fontSize: "0.82rem", color: "var(--text-color)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <Mail size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Invitación automática por correo:</strong> No se requiere ingresar contraseña. Se enviará un correo de activación desde <code>contacto@n-sistemas.com</code> con el enlace para crear su contraseña.
                    </div>
                  </div>
                )}

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
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
