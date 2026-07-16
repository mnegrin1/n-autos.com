"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./crm.module.css";
import { updateAutoLeadStatus, deleteAutoLead, createAutoLead } from "@/actions/autoActions";
import { getVehicles } from "@/actions/autoActions";
import { Phone, Mail, User, Plus, Trash2, Calendar, MessageSquare, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  vehicle_id: string;
  message: string;
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

const columns = [
  { title: "Nuevos Leads", status: "nuevo" as const },
  { title: "Contactados", status: "contactado" as const },
  { title: "Test Drive", status: "test_drive" as const },
  { title: "Negociación", status: "negociacion" as const },
  { title: "Cerrados / Vendidos", status: "cerrado" as const },
];

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
  });

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
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

  // Load vehicles for lead creation modal
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await getVehicles("demo-agency-id");
      setVehicles(res);
      if (res.length > 0) {
        setNewLeadForm(prev => ({ ...prev, vehicleId: res[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: Lead["status"]) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
    
    // Server action
    const res = await updateAutoLeadStatus(leadId, nextStatus);
    if (!res.success) {
      alert("Error al actualizar estado del lead en el servidor");
      // Revert if error
      setLeads(initialLeads);
    }
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
    if (!newLeadForm.name || !newLeadForm.vehicleId) {
      alert("Nombre y vehículo son campos requeridos");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === newLeadForm.vehicleId);
    const vehicleText = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Vehículo";

    startTransition(async () => {
      const res = await createAutoLead({
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        vehicle: vehicleText,
        vehicleId: newLeadForm.vehicleId,
        message: newLeadForm.message,
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
        });
      } else {
        alert("Error al guardar lead");
      }
    });
  };

  // Drag and drop event handlers
  const handleDragStart = (id: string) => {
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Lead["status"]) => {
    e.preventDefault();
    if (draggedLeadId) {
      handleStatusChange(draggedLeadId, status);
      setDraggedLeadId(null);
    }
  };

  return (
    <div className={styles.crmContainer}>
      <div className={styles.header}>
        <div>
          <h1>CRM Automotor</h1>
          <p>Embudo de ventas y seguimiento de prospectos en tiempo real.</p>
        </div>
        <button className="btn-primary" style={{ backgroundColor: "#10b981", borderColor: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={handleOpenAddModal}>
          <Plus size={16} /> Crear Prospecto
        </button>
      </div>

      <div className={styles.kanbanBoard}>
        {columns.map((col) => {
          const colLeads = leads.filter(l => l.status === col.status);
          
          return (
            <div 
              key={col.status} 
              className={styles.kanbanColumn}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className={styles.columnHeader}>
                <h3>{col.title}</h3>
                <span className={styles.leadCount} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  {colLeads.length}
                </span>
              </div>

              <div className={styles.leadsList}>
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={styles.leadCard}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 className={styles.leadNameLink}>{lead.name}</h4>
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", opacity: 0.7 }}
                        title="Eliminar lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className={styles.leadProperty} style={{ color: "#10b981", fontWeight: "600", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      🚗 {lead.vehicle}
                    </div>

                    {lead.message && (
                      <p style={{ fontSize: "0.8rem", margin: "0.5rem 0", opacity: 0.8, lineBreak: "anywhere" }}>
                        "{lead.message}"
                      </p>
                    )}

                    <div className={styles.leadContactDetails}>
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

                    <select
                      className={styles.statusSelect}
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="test_drive">Test Drive</option>
                      <option value="negociacion">Negociación</option>
                      <option value="cerrado">Cerrado/Vendido</option>
                    </select>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                      <span className={styles.agentBadge}>
                        <User size={10} />
                        <span>Asignado</span>
                      </span>
                      <span className={styles.leadTime}>{lead.time || "Ahora"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Crear Prospecto</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
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
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Vehículo de Interés *</label>
                <select
                  value={newLeadForm.vehicleId}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  style={{ padding: "0.65rem 0.85rem", border: "1px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-color)", color: "var(--text-color)", cursor: "pointer" }}
                >
                  {vehicles.length === 0 ? (
                    <option value="">Cargando vehículos...</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
                    ))
                  )}
                </select>
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
                  style={{ backgroundColor: "#10b981", border: "none", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", color: "white", cursor: "pointer" }}
                  disabled={isPending}
                >
                  {isPending ? "Creando..." : "Crear Prospecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
