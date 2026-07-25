"use client";

import { useState, useEffect } from "react";
import { 
  getPlans, 
  savePlans, 
  subscribePlans, 
  togglePlanActive, 
  PaymentPlan 
} from "@/lib/plansStore";
import { 
  CreditCard, 
  Check, 
  Edit3, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  Eye, 
  EyeOff,
  Trash2,
  X
} from "lucide-react";

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");

  useEffect(() => {
    setPlans(getPlans());
    const unsubscribe = subscribePlans(updated => {
      setPlans(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (plan: PaymentPlan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPlan({
      id: `plan-${Date.now()}`,
      name: "",
      priceMonthly: 19,
      priceYearly: 15,
      description: "",
      badge: "Nuevo",
      features: ["Soporte estándar", "Acceso al CRM"],
      maxVehicles: "10",
      maxUsers: "2",
      active: true
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name) return;

    const existingIndex = plans.findIndex(p => p.id === editingPlan.id);
    let updated: PaymentPlan[];
    if (existingIndex !== -1) {
      updated = [...plans];
      updated[existingIndex] = editingPlan;
    } else {
      updated = [...plans, editingPlan];
    }
    savePlans(updated);
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeatureText.trim()]
    });
    setNewFeatureText("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    const updatedFeatures = [...editingPlan.features];
    updatedFeatures.splice(index, 1);
    setEditingPlan({
      ...editingPlan,
      features: updatedFeatures
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Planes de Pago</h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7 }}>
            Administra los planes de suscripción (Gratis, Pro, Ultra) que se visualizan en la Landing Page y definen los límites de las cuentas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            backgroundColor: "var(--primary)",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
          }}
        >
          <Plus size={18} /> Crear Nuevo Plan
        </button>
      </div>

      {/* Tarjetas de Planes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: "var(--surface-color)",
              borderRadius: "16px",
              border: plan.isPopular ? "2px solid var(--primary)" : "1px solid var(--border-color)",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              opacity: plan.active ? 1 : 0.6,
              boxShadow: plan.isPopular ? "0 10px 25px rgba(37, 99, 235, 0.15)" : "0 4px 12px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease"
            }}
          >
            {plan.badge && (
              <span
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  backgroundColor: plan.isPopular ? "var(--primary)" : "rgba(128,128,128,0.15)",
                  color: plan.isPopular ? "#fff" : "var(--text-color)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.03em"
                }}
              >
                {plan.badge}
              </span>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>{plan.name}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-color)", opacity: 0.75, minHeight: "2.5rem" }}>
                {plan.description}
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
              <span style={{ fontSize: "2.25rem", fontWeight: 900 }}>${plan.priceMonthly}</span>
              <span style={{ fontSize: "0.9rem", color: "var(--text-color)", opacity: 0.7 }}>/ mes</span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginBottom: "1.5rem", flex: 1 }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-color)", opacity: 0.6, marginBottom: "0.75rem" }}>
                Características Incluidas
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
              <button
                onClick={() => handleOpenEdit(plan)}
                style={{
                  flex: 1,
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "rgba(128,128,128,0.06)",
                  color: "var(--text-color)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem"
                }}
              >
                <Edit3 size={15} /> Editar Plan
              </button>

              <button
                onClick={() => togglePlanActive(plan.id)}
                title={plan.active ? "Desactivar de la landing" : "Activar en la landing"}
                style={{
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: plan.active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  color: plan.active ? "#10b981" : "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {plan.active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición / Creación */}
      {isModalOpen && editingPlan && (
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
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "1.75rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                {editingPlan.id ? `Editar Plan: ${editingPlan.name || "Nuevo Plan"}` : "Crear Nuevo Plan"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-color)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                    Nombre del Plan
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="Ej. Pro, Ultra, Gratis..."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                    Etiqueta / Badge
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    placeholder="Ej. Más Popular, Recomendado"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                    Precio Mensual ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceMonthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                    Precio Anual ($ / mes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceYearly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Descripción resumida del plan"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editingPlan.isPopular}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                  />
                  Destacar como Plan Más Popular
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingPlan.active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.checked })}
                  />
                  Plan Activo en Landing
                </label>
              </div>

              {/* Editor de Características */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, display: "block", marginBottom: "0.35rem" }}>
                  Lista de Funcionalidades / Beneficios
                </label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Agregar nueva característica..."
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      outline: "none"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Agregar
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "150px", overflowY: "auto" }}>
                  {editingPlan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.4rem 0.75rem",
                        backgroundColor: "rgba(128,128,128,0.06)",
                        borderRadius: "6px",
                        fontSize: "0.85rem"
                      }}
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-color)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
