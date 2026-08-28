"use client";

import { useState, useTransition } from "react";
import { createUser, deleteUser } from "@/actions/userActions";
import { addRegisteredTenant } from "@/lib/superadminStore";
import { User, Trash2, UserPlus, Mail, CheckCircle, ExternalLink, Copy, X, Sparkles, Send } from "lucide-react";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CurrentUserType {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function UsersList({ agencyId, initialUsers, currentUser }: { agencyId: string, initialUsers: UserType[], currentUser?: CurrentUserType }) {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [isPending, startTransition] = useTransition();

  // Invite Modal State
  const [invitedUser, setInvitedUser] = useState<{ name: string; email: string; role: string; inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    startTransition(async () => {
      const res = await createUser(agencyId, name, email, role);
      if (res.success && res.data) {
        const newUser = res.data as UserType;
        setUsers([...users, newUser]);

        // Register in SuperAdmin global store
        addRegisteredTenant({
          agencyId: agencyId,
          agencyName: "Automotora",
          subdomain: "crm",
          adminName: name,
          adminEmail: email,
          planName: "Starter"
        });

        // Generate invite URL
        const inviteLink = `${window.location.origin}/admin/accept-invite?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&agencyId=${encodeURIComponent(agencyId)}`;

        setInvitedUser({
          name,
          email,
          role,
          inviteUrl: inviteLink
        });

        setName("");
        setEmail("");
        setRole("agent");
      } else {
        alert(res.error || "Error al agregar usuario");
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    startTransition(async () => {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(res.error || "Error al eliminar usuario");
      }
    });
  };

  const handleCopyLink = () => {
    if (invitedUser?.inviteUrl) {
      navigator.clipboard.writeText(invitedUser.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Form para agregar usuario / empleado */}
      <form onSubmit={handleAddUser} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap", backgroundColor: "var(--bg-color)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre del Empleado</label>
          <input
            type="text"
            required
            placeholder="ej. Ana Rodríguez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Correo Electrónico (para invitación)</label>
          <input
            type="email"
            required
            placeholder="empleado@automotora.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 150px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Rol Asignado</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
          >
            <option value="agent">Agente de Ventas</option>
            <option value="manager">Gerente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: "0.75rem 1.5rem", height: "fit-content", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserPlus size={18} />
          {isPending ? "Enviando..." : "Agregar y Enviar Invitación"}
        </button>
      </form>

      {/* Lista de Usuarios */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Cuenta Activa del Administrador */}
        {currentUser && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            backgroundColor: "rgba(16, 185, 129, 0.07)",
            border: "1.5px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", padding: "0.75rem", borderRadius: "50%", color: "#10b981" }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <p style={{ fontWeight: "700", margin: 0 }}>{currentUser.name || "Administrador"}</p>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(16, 185, 129, 0.3)"
                  }}>Tu cuenta</span>
                </div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>
                  {currentUser.email || "mauricio@automotora.com"} &bull;
                  <span style={{ color: "#10b981", fontWeight: 600 }}> Administrador</span>
                </p>
              </div>
            </div>
            <span style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              padding: "0.3rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}>Acceso Total</span>
          </div>
        )}

        {users.map((user) => (
          <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ backgroundColor: "var(--primary-light)", padding: "0.75rem", borderRadius: "50%", color: "var(--primary)" }}>
                <User size={20} />
              </div>
              <div>
                <p style={{ fontWeight: "600", margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>{user.email} &bull; {user.role === "agent" ? "Agente de Ventas" : user.role === "manager" ? "Gerente" : user.role === "admin" ? "Administrador" : user.role}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => handleDeleteUser(user.id)} 
              className="btn-danger"
              disabled={isPending}
              style={{ padding: "0.5rem", borderRadius: "8px" }}
              title="Eliminar usuario"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {users.length === 0 && !currentUser && (
          <p style={{ textAlign: "center", opacity: 0.5, padding: "2rem" }}>No hay usuarios ni empleados registrados.</p>
        )}
        {users.length === 0 && currentUser && (
          <p style={{ textAlign: "center", opacity: 0.5, padding: "1rem", fontSize: "0.85rem" }}>No hay empleados adicionales registrados. Invitá a tu equipo usando el formulario de arriba.</p>
        )}
      </div>

      {/* Modal de Previsualización del Email de Invitación al Empleado */}
      {invitedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "580px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              border: "1px solid #cbd5e1"
            }}
          >
            {/* Header Modal */}
            <div style={{ padding: "1.25rem 1.5rem", background: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Send size={18} style={{ color: "#38bdf8" }} />
                <span style={{ fontWeight: 800, fontSize: "1rem" }}>Email de Invitación Enviado al Empleado</span>
              </div>
              <button
                type="button"
                onClick={() => setInvitedUser(null)}
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Simulated Email Envelope Body */}
            <div style={{ padding: "1.75rem" }}>
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.3rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                  <div><strong>De:</strong> Plataforma CRM &lt;notificaciones@n-autos.com&gt;</div>
                  <div><strong>Para:</strong> {invitedUser.name} &lt;{invitedUser.email}&gt;</div>
                  <div><strong>Asunto:</strong> Invitación para unirte al equipo de ventas de la automotora</div>
                </div>

                <div style={{ fontSize: "0.92rem", color: "#1e293b", lineHeight: "1.5" }}>
                  <p style={{ margin: "0 0 0.75rem 0" }}>Hola <strong>{invitedUser.name}</strong>,</p>
                  <p style={{ margin: "0 0 1.25rem 0" }}>
                    El administrador te ha asignado el rol de <strong>{invitedUser.role === "agent" ? "Agente de Ventas" : invitedUser.role}</strong> en la plataforma.
                    Haz clic en el siguiente botón para aceptar la invitación, establecer tu nueva contraseña e ingresar al CRM.
                  </p>

                  <a
                    href={invitedUser.inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      padding: "0.85rem 1.5rem",
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                    }}
                  >
                    Aceptar Invitación y Crear Contraseña <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Copy link box */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  readOnly
                  value={invitedUser.inviteUrl}
                  style={{
                    flex: 1,
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    color: "#475569",
                    backgroundColor: "#f1f5f9"
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    padding: "0.65rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: copied ? "#16a34a" : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                  {copied ? "¡Copiado!" : "Copiar Enlace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
