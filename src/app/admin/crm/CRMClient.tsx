"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./crm.module.css";
import { updateAutoLeadStatus, deleteAutoLead, createAutoLead, bulkCreateAutoLeads } from "@/actions/autoActions";
import { getVehicles } from "@/actions/autoActions";
import { Phone, Mail, User, Plus, Trash2, Calendar, MessageSquare, X, Search, Upload } from "lucide-react";
import * as xlsx from "xlsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef } from "react";

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
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = xlsx.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (data.length < 2) {
          alert("El archivo no contiene suficientes datos.");
          return;
        }

        const headers = data[0].map((h: string) => h ? h.toString().toLowerCase().trim() : "");
        const rows = data.slice(1);
        
        const nameIdx = headers.findIndex((h: string) => h.includes("nombre") || h.includes("name") || h.includes("cliente"));
        const emailIdx = headers.findIndex((h: string) => h.includes("correo") || h.includes("email"));
        const phoneIdx = headers.findIndex((h: string) => h.includes("telefono") || h.includes("teléfono") || h.includes("phone") || h.includes("celular"));
        const vehicleIdx = headers.findIndex((h: string) => h.includes("vehiculo") || h.includes("vehículo") || h.includes("vehicle") || h.includes("auto"));
        
        if (nameIdx === -1) {
          alert("No se encontró una columna válida para el 'Nombre'.");
          return;
        }

        const newLeadsData = rows.map((row) => {
          if (!row[nameIdx]) return null;
          return {
            agencyId: currentUser.agency_id,
            name: String(row[nameIdx] || ""),
            email: emailIdx !== -1 ? String(row[emailIdx] || "") : "",
            phone: phoneIdx !== -1 ? String(row[phoneIdx] || "") : "",
            vehicle: vehicleIdx !== -1 ? String(row[vehicleIdx] || "Sin vehículo") : "Sin vehículo",
            message: "Importado desde archivo",
            tags: ["Importado"]
          };
        }).filter(Boolean) as any[];

        if (newLeadsData.length === 0) {
          alert("No se encontraron contactos válidos en el archivo.");
          return;
        }

        const res = await bulkCreateAutoLeads(newLeadsData);
        if (res.success) {
          alert(`Se importaron ${newLeadsData.length} contactos exitosamente.`);
          window.location.reload();
        } else {
          alert("Ocurrió un error al importar los contactos.");
        }
      } catch (err) {
        console.error("Error parsing file:", err);
        alert("Hubo un error al procesar el archivo.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

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

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(prev => prev.filter(l => l !== id));
    } else {
      setSelectedLeads(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar ${selectedLeads.length} contactos?`)) {
      for (const id of selectedLeads) {
        await deleteAutoLead(id);
      }
      setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
    }
  };

  return (
    <div className={styles.crmContainer}>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0 }}>Contactos CRM</h1>
            <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
              {filteredLeads.length} {filteredLeads.length === 1 ? 'contacto' : 'contactos'}
            </span>
          </div>
          <p style={{ marginTop: '0.25rem' }}>Gestión de clientes y seguimiento de embudo en tiempo real.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={handleFileUpload} 
          />
          <button 
            type="button"
            className="btn-secondary" 
            style={{ backgroundColor: "transparent", border: "1px solid var(--text-color)", color: "var(--text-color)", display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }} 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload size={16} /> {isImporting ? "Importando..." : "Import contacts"}
          </button>
          <button className="btn-primary" style={{ backgroundColor: "var(--text-color)", borderColor: "var(--text-color)", color: "var(--bg-color)", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={handleOpenAddModal}>
            <Plus size={16} /> Nuevo Contacto
          </button>
        </div>
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

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <input 
            type="checkbox" 
            className={styles.checkbox} 
            checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
            onChange={toggleSelectAll}
          />
          <span>Date registered</span>
          <span>Contact Info</span>
          <span>Tags</span>
          <span></span>
        </div>
        
        <div className={styles.contactsList} style={{ paddingBottom: 0, gap: 0 }}>
          {filteredLeads.map((lead) => {
            const date = lead.created_at ? new Date(lead.created_at) : new Date();
            const formattedDate = date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div key={lead.id} className={styles.tableRow} style={{ backgroundColor: selectedLeads.includes(lead.id) ? 'var(--primary-light)' : undefined }}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox}
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => toggleSelectLead(lead.id)}
                />
                <div className={styles.dateText}>
                  <span>{formattedDate}</span>
                  <small>{formattedTime}</small>
                </div>
                
                <div className={styles.avatarCell}>
                  <div className={styles.avatar}>
                    <User size={16} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className={styles.emailText}>{lead.email || "Sin email"}</span>
                    <span className={styles.nameText}>{lead.name} {lead.phone ? `• ${lead.phone}` : ""}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {lead.tags && lead.tags.length > 0 ? lead.tags.map(tag => (
                    <span key={tag} className={styles.tagPill}>{tag}</span>
                  )) : <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>-</span>}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => handleDeleteLead(lead.id)}
                    style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer", opacity: 0.7 }}
                    title="Eliminar lead"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredLeads.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", opacity: 0.5 }}>
              No se encontraron contactos.
            </div>
          )}
        </div>
      </div>

      {selectedLeads.length > 0 && (
        <div className={styles.actionBar}>
          <div className={styles.selectedText}>
            Selected contacts: {selectedLeads.length}
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={handleBulkDelete}
              style={{ backgroundColor: "var(--danger, #ef4444)", color: "white", padding: "0.5rem 1.5rem", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

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
