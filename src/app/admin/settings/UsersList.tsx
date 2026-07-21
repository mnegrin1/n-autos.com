"use client";

import { useState, useTransition } from "react";
import { createUser, deleteUser } from "@/actions/userActions";
import { User, Trash2, UserPlus } from "lucide-react";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UsersList({ agencyId, initialUsers }: { agencyId: string, initialUsers: UserType[] }) {
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [isPending, startTransition] = useTransition();

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    startTransition(async () => {
      const res = await createUser(agencyId, name, email, role);
      if (res.success && res.data) {
        setUsers([...users, res.data as UserType]);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <form onSubmit={handleAddUser} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap", backgroundColor: "var(--bg-color)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 150px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Rol</label>
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
        <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: "0.75rem 1.5rem", height: "fit-content" }}>
          <UserPlus size={18} />
          {isPending ? "Guardando..." : "Agregar"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {users.map((user) => (
          <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ backgroundColor: "var(--primary-light)", padding: "0.75rem", borderRadius: "50%", color: "var(--primary)" }}>
                <User size={20} />
              </div>
              <div>
                <p style={{ fontWeight: "600", margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>{user.email} • {user.role}</p>
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
        {users.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.5, padding: "2rem" }}>No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
