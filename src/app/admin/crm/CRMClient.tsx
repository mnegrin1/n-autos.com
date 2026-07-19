"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./crm.module.css";
import { updateAutoLeadStatus, deleteAutoLead, createAutoLead } from "@/actions/autoActions";
import { getVehicles } from "@/actions/autoActions";
import { Phone, Mail, User, Plus, Trash2, Calendar, MessageSquare, X, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  vehicle_id: string;
  message: string;
  tags?: string[];
  status: "nuevo" | "contactado" | "test_drive" | "negociacion" | "cerrado";
  time: string;
  created_at: string;
  assigned_agent_id?: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CRMClientProps {
  initialLeads: Lead[];
  initialAgents: Agent[];
  currentUser: any;
}


export default function CRMClient({ initialLeads, initialAgents, currentUser }: CRMClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleId: "",
    message: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new" || action === "sale") {
      if (action === "sale") {
        setNewLeadForm(prev => ({
          ...prev,
          message: "Venta Cerrada. Registrar detalles de la transacción.",
        }));
      }
      handleOpenAddModal();
      router.replace("/admin/crm");
    }
  }, [searchParams]);

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await getVehicles("00000000-0000-0000-0000-000000000000");
      setVehicles(res);
      // Vehicle is optional, so we can default to empty ("")
      setNewLeadForm(prev => ({ ...prev, vehicleId: "" }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!newLeadForm.tags.includes(tagInput.trim())) {
        setNewLeadForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewLeadForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este prospecto?")) {
      const res = await deleteAutoLead(leadId);
      if (res.success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      } else {
        alert("Error al eliminar lead");
      }
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name) {
      alert("El nombre es requerido");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === newLeadForm.vehicleId);
    const vehicleText = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Sin vehículo";

    startTransition(async () => {
      const res = await createAutoLead({
        agencyId: currentUser.agency_id,
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        vehicle: vehicleText,
        vehicleId: newLeadForm.vehicleId || "",
        message: newLeadForm.message,
        tags: newLeadForm.tags,
      });

      if (res.success && res.data) {
        setLeads(prev => [...prev, res.data as Lead]);
        setShowAddModal(false);
        setNewLeadForm({
          name: "",
          email: "",
          phone: "",
          vehicleId: "",
          message: "",
          tags: [],
        });
      } else {
        alert("Error al guardar contacto: " + (res?.error || JSON.stringify(res)));
      }
    });
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchLower)) ||
      (lead.vehicle && lead.vehicle.toLowerCase().includes(searchLower)) ||
      (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  return (
    <div className={styles.crmContainer}>
      <div className={styles.header}>
        <div>
          <h1>Contactos CRM</h1>
          <p>Gestión de clientes y seguimiento de embudo en tiempo real.</p>
        </div>
        <button className="btn-primary" style={{ backgroundColor: "var(--text-color)", borderColor: "var(--text-color)", color: "var(--bg-color)", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={handleOpenAddModal}>
          <Plus size={16} /> Nuevo Contacto
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={18} color="var(--text-color)" style={{ opacity: 0.5 }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, correo, vehículo o etiqueta..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.contactsList}>
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className={styles.leadCard}
          >
            {/* Columna 1: Info Básica */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h4 className={styles.leadNameLink}>{lead.name}</h4>
              <div className={styles.leadContactDetails} style={{ borderTop: "none", margin: 0, padding: 0 }}>
                {lead.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", opacity: 0.7 }}>
                    <Phone size={10} />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", opacity: 0.7 }}>
                    <Mail size={10} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Vehículo, Mensaje y Etiquetas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className={styles.leadProperty} style={{ color: "var(--text-color)", fontWeight: "600", fontSize: "0.85rem", margin: 0 }}>
                {lead.vehicle !== "Sin vehículo" ? `🚗 ${lead.vehicle}` : "👤 Contacto general"}
              </div>
              {lead.message && (
                <p style={{ fontSize: "0.8rem", margin: 0, opacity: 0.8, lineBreak: "anywhere", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  "{lead.message}"
                </p>
              )}
              {lead.tags && lead.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {lead.tags.map(tag => (
                    <span key={tag} style={{ backgroundColor: "var(--text-color)", color: "var(--bg-color)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "600" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Columna 3: Fecha y Agente */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
              <span className={styles.leadTime}>{lead.time || "Ahora"}</span>
              <span className={styles.agentBadge} style={{ margin: 0 }}>
                <User size={10} />
                <span>Asignado</span>
              </span>
            </div>

            {/* Columna 4: Acciones */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => handleDeleteLead(lead.id)}
                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", opacity: 0.7 }}
                title="Eliminar lead"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5, gridColumn: "1 / -1" }}>
            No se encontraron contactos.
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div 
          className={styles.modalOverlay} 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.6)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000 
          }}
        >
          <div 
            style={{ 
              backgroundColor: "var(--surface-color)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "16px", 
              padding: "2rem", 
              width: "90%", 
              maxWidth: "450px",
              boxShadow: "var(--shadow-lg)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Nuevo Contacto</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 099123456"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: juan@gmail.com"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Vehículo de Interés (Opcional)</label>
                <select
                  value={newLeadForm.vehicleId}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
                >
                  <option value="">Ninguno / Contacto General</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Etiquetas (Presiona Enter)</label>
                <input
                  type="text"
                  placeholder="Ej: Inversor, VIP, Contado..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.35rem" }}>
                  {newLeadForm.tags.map(tag => (
                    <span key={tag} style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--text-color)", color: "var(--bg-color)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} style={{ background: "none", border: "none", color: "var(--bg-color)", cursor: "pointer", padding: 0, display: "flex" }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Mensaje / Notas</label>
                <textarea
                  placeholder="Mensaje o notas adicionales sobre el contacto..."
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, message: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)", resize: "vertical", minHeight: "60px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "var(--text-color)", cursor: "pointer" }}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: "var(--text-color)", border: "none", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "var(--bg-color)", cursor: "pointer" }}
                  disabled={isPending}
                >
                  {isPending ? "Creando..." : "Crear Contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
