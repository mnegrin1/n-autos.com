"use client";

import { useState, useTransition } from "react";
import { 
  Zap, 
  GitFork, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Mail, 
  Tag as TagIcon, 
  ArrowRight, 
  Sliders, 
  ChevronRight, 
  Sparkles,
  Layers,
  HelpCircle,
  Settings,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  AutomationRule, 
  AutomationWorkflow, 
  WorkflowStep,
  createAutomationRuleAction, 
  toggleAutomationRuleAction, 
  deleteAutomationRuleAction,
  saveWorkflowAction,
  deleteWorkflowAction 
} from "@/actions/automationActions";

interface AutomationsClientProps {
  initialRules: AutomationRule[];
  initialWorkflows: AutomationWorkflow[];
  availableTags: string[];
  currentUser: any;
}

export default function AutomationsClient({ 
  initialRules, 
  initialWorkflows, 
  availableTags, 
  currentUser 
}: AutomationsClientProps) {
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "workflows">("rules");
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(initialWorkflows);

  // Estados para Modal de Nueva Regla
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleTrigger, setNewRuleTrigger] = useState("tag_added");
  const [newRuleTriggerVal, setNewRuleTriggerVal] = useState(availableTags[0] || "Inversor");
  const [newRuleAction, setNewRuleAction] = useState("send_email");
  const [newRuleActionVal, setNewRuleActionVal] = useState("");

  // Estados para el Editor de Flujo (Workflow Visual Builder)
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");
  const [newFlowTag, setNewFlowTag] = useState(availableTags[0] || "Lead Nuevo");

  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Handlers para Reglas
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      alert("Por favor ingresa un nombre para la regla.");
      return;
    }

    startTransition(async () => {
      const res = await createAutomationRuleAction({
        agency_id: currentUser?.agency_id,
        name: newRuleName.trim(),
        trigger_event: newRuleTrigger,
        trigger_value: newRuleTriggerVal,
        action_type: newRuleAction,
        action_value: newRuleActionVal || "Acción Automática",
        is_active: true
      });

      if (res.success && res.data) {
        setRules(prev => [res.data as AutomationRule, ...prev]);
        setShowRuleModal(false);
        setNewRuleName("");
        setNewRuleActionVal("");
        showToast("Regla de automatización creada exitosamente.");
      }
    });
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: nextActive } : r));
    await toggleAutomationRuleAction(ruleId, nextActive);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta regla de automatización?")) return;
    setRules(prev => prev.filter(r => r.id !== ruleId));
    await deleteAutomationRuleAction(ruleId);
    showToast("Regla eliminada.");
  };

  // Handlers para Flujos / Workflows
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    const initialSteps: WorkflowStep[] = [
      {
        id: `step-${Date.now()}-1`,
        type: "trigger",
        title: `Disparador: Tag '${newFlowTag}'`,
        description: `Se activa cuando un contacto recibe el tag '${newFlowTag}'`,
        config: { tag: newFlowTag }
      },
      {
        id: `step-${Date.now()}-2`,
        type: "action",
        title: "Enviar Email de Saludo",
        description: "Envia mensaje de bienvenida automático",
        config: { emailSubject: "¡Hola! Gracias por contactarnos" }
      }
    ];

    const newFlow: AutomationWorkflow = {
      id: `flow-${Date.now()}`,
      agency_id: currentUser?.agency_id,
      name: newFlowName.trim(),
      description: newFlowDesc.trim() || "Flujo automático personalizado",
      trigger_tag: newFlowTag,
      steps: initialSteps,
      is_active: true,
      enrolled_contacts_count: 0,
      created_at: new Date().toISOString()
    };

    startTransition(async () => {
      const res = await saveWorkflowAction(newFlow);
      if (res.success) {
        setWorkflows(prev => [newFlow, ...prev]);
        setSelectedWorkflow(newFlow);
        setEditingWorkflow(JSON.parse(JSON.stringify(newFlow)));
        setShowWorkflowModal(false);
        setNewFlowName("");
        setNewFlowDesc("");
        showToast("Nuevo Flujo creado exitosamente.");
      }
    });
  };

  const handleAddStepToWorkflow = (type: 'action' | 'delay' | 'condition') => {
    if (!editingWorkflow) return;

    let newStep: WorkflowStep;
    const stepNum = editingWorkflow.steps.length + 1;

    if (type === 'action') {
      newStep = {
        id: `step-${Date.now()}`,
        type: 'action',
        title: `Paso ${stepNum}: Enviar Email o Asignar Tag`,
        description: "Ejecuta una acción automatizada en el CRM",
        config: { emailSubject: "Novedades de la Semana", addTag: "Contactado" }
      };
    } else if (type === 'delay') {
      newStep = {
        id: `step-${Date.now()}`,
        type: 'delay',
        title: `Paso ${stepNum}: Esperar 24 Horas`,
        description: "Pausa el recorrido antes de continuar",
        config: { hours: 24 }
      };
    } else {
      newStep = {
        id: `step-${Date.now()}`,
        type: 'condition',
        title: `Paso ${stepNum}: Condición ¿Abrió correo?`,
        description: "Bifurca el camino según interacción del contacto",
        config: { conditionTag: "Interesado" }
      };
    }

    const updated = {
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep]
    };

    setEditingWorkflow(updated);
  };

  const handleDeleteStepFromWorkflow = (stepId: string) => {
    if (!editingWorkflow) return;
    const updated = {
      ...editingWorkflow,
      steps: editingWorkflow.steps.filter(s => s.id !== stepId)
    };
    setEditingWorkflow(updated);
  };

  const handleSaveWorkflowEdits = async () => {
    if (!editingWorkflow) return;
    startTransition(async () => {
      const res = await saveWorkflowAction(editingWorkflow);
      if (res.success) {
        setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? editingWorkflow : w));
        setSelectedWorkflow(editingWorkflow);
        showToast("Flujo guardado con éxito.");
      }
    });
  };

  const handleDeleteWorkflow = async (flowId: string) => {
    if (!confirm("¿Estás seguro de eliminar este Flujo de Trabajo?")) return;
    setWorkflows(prev => prev.filter(w => w.id !== flowId));
    if (selectedWorkflow?.id === flowId) {
      setSelectedWorkflow(null);
      setEditingWorkflow(null);
    }
    await deleteWorkflowAction(flowId);
    showToast("Flujo eliminado.");
  };

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1250px", margin: "0 auto" }}>
      {/* Header General */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Zap size={26} style={{ color: "var(--primary)" }} /> Motor de Automatizaciones
          </h1>
          <p style={{ marginTop: "0.35rem", opacity: 0.75, fontSize: "0.9rem" }}>
            Crea reglas automáticas y flujos de trabajo interactivos para potenciar tus ventas sin esfuerzo.
          </p>
        </div>

        {/* Botón de Acción según SubPestaña */}
        {activeSubTab === "rules" ? (
          <button
            onClick={() => setShowRuleModal(true)}
            style={{
              backgroundColor: "var(--text-color)",
              color: "var(--bg-color)",
              border: "none",
              padding: "0.7rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            <Plus size={18} /> Nueva Regla
          </button>
        ) : (
          <button
            onClick={() => setShowWorkflowModal(true)}
            style={{
              backgroundColor: "var(--text-color)",
              color: "var(--bg-color)",
              border: "none",
              padding: "0.7rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            <Plus size={18} /> Nuevo Flujo
          </button>
        )}
      </div>

      {statusNotice && (
        <div style={{
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          border: "1px solid #22c55e",
          color: "#15803d",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          marginBottom: "1.25rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem"
        }}>
          <CheckCircle2 size={18} /> {statusNotice}
        </div>
      )}

      {/* Sub Sub-pestañas: Reglas | Flujos */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("rules")}
          style={{
            backgroundColor: activeSubTab === "rules" ? "var(--surface-color)" : "transparent",
            color: activeSubTab === "rules" ? "var(--primary)" : "var(--text-color)",
            border: "1px solid",
            borderColor: activeSubTab === "rules" ? "var(--primary)" : "var(--border-color)",
            padding: "0.6rem 1.3rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: activeSubTab === "rules" ? "var(--shadow-sm)" : "none",
            transition: "all 0.2s"
          }}
        >
          <Sliders size={17} /> Reglas ({rules.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab("workflows");
            if (!selectedWorkflow && workflows.length > 0) {
              setSelectedWorkflow(workflows[0]);
              setEditingWorkflow(JSON.parse(JSON.stringify(workflows[0])));
            }
          }}
          style={{
            backgroundColor: activeSubTab === "workflows" ? "var(--surface-color)" : "transparent",
            color: activeSubTab === "workflows" ? "var(--primary)" : "var(--text-color)",
            border: "1px solid",
            borderColor: activeSubTab === "workflows" ? "var(--primary)" : "var(--border-color)",
            padding: "0.6rem 1.3rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: activeSubTab === "workflows" ? "var(--shadow-sm)" : "none",
            transition: "all 0.2s"
          }}
        >
          <GitFork size={17} /> Flujos ({workflows.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: REGLAS (Rules) */}
      {/* ========================================================================= */}
      {activeSubTab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Tarjeta Informativa / Métricas de Reglas */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "0.5rem"
          }}>
            <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.8rem", opacity: 0.75, fontWeight: 600, textTransform: "uppercase" }}>Reglas Activas</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem", color: "var(--primary)" }}>
                {rules.filter(r => r.is_active).length} / {rules.length}
              </div>
            </div>

            <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.8rem", opacity: 0.75, fontWeight: 600, textTransform: "uppercase" }}>Ejecuciones Totales</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem" }}>
                {rules.reduce((acc, r) => acc + (r.executions_count || 0), 0)}
              </div>
            </div>
          </div>

          {/* Lista de Reglas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  boxShadow: "var(--shadow-sm)",
                  opacity: rule.is_active ? 1 : 0.65,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>{rule.name}</span>
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      style={{
                        backgroundColor: rule.is_active ? "rgba(34, 197, 94, 0.15)" : "rgba(128,128,128,0.15)",
                        color: rule.is_active ? "#15803d" : "var(--text-color)",
                        border: `1px solid ${rule.is_active ? "#22c55e" : "var(--border-color)"}`,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                    >
                      {rule.is_active ? <Play size={10} /> : <Pause size={10} />}
                      {rule.is_active ? "Activa" : "Pausada"}
                    </button>
                  </div>

                  {/* Diagrama Bloque IF -> THEN */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    <div style={{
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontWeight: 600
                    }}>
                      <span style={{ color: "var(--primary)", fontWeight: 800 }}>SI (If):</span>
                      <TagIcon size={14} /> {rule.trigger_event === 'tag_added' ? `Tag agregado '${rule.trigger_value}'` : rule.trigger_value || rule.trigger_event}
                    </div>

                    <ArrowRight size={16} style={{ opacity: 0.5 }} />

                    <div style={{
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontWeight: 600
                    }}>
                      <span style={{ color: "#16a34a", fontWeight: 800 }}>ENTONCES (Then):</span>
                      <Mail size={14} /> {rule.action_value || rule.action_type}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <div style={{ textAlign: "right", fontSize: "0.8rem", opacity: 0.7 }}>
                    <div><strong>{rule.executions_count || 0}</strong> ejecuciones</div>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--danger, #ef4444)",
                      cursor: "pointer",
                      padding: "0.4rem",
                      borderRadius: "6px",
                      opacity: 0.7
                    }}
                    title="Eliminar regla"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--surface-color)", borderRadius: "12px", border: "1px solid var(--border-color)", opacity: 0.6 }}>
                No tienes reglas de automatización configuradas. Haz clic en <strong>"Nueva Regla"</strong> para crear tu primera regla IF/THEN.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: FLUJOS / WORKFLOWS (Flow) */}
      {/* ========================================================================= */}
      {activeSubTab === "workflows" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem", alignItems: "start" }}>
          {/* Columna Izquierda: Lista de Flujos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", opacity: 0.7 }}>
              Tus Flujos ({workflows.length})
            </span>

            {workflows.map((flow) => {
              const isSelected = selectedWorkflow?.id === flow.id;

              return (
                <div
                  key={flow.id}
                  onClick={() => {
                    setSelectedWorkflow(flow);
                    setEditingWorkflow(JSON.parse(JSON.stringify(flow)));
                  }}
                  style={{
                    backgroundColor: isSelected ? "var(--surface-color)" : "var(--bg-color)",
                    border: "1px solid",
                    borderColor: isSelected ? "var(--primary)" : "var(--border-color)",
                    borderRadius: "10px",
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? "var(--shadow-sm)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isSelected ? "var(--primary)" : "var(--text-color)" }}>
                      {flow.name}
                    </span>
                    <ChevronRight size={16} style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? "var(--primary)" : "inherit" }} />
                  </div>

                  <p style={{ margin: "0.35rem 0 0.5rem 0", fontSize: "0.78rem", opacity: 0.75, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {flow.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                    <span style={{ backgroundColor: "rgba(128,128,128,0.15)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                      {flow.steps.length} pasos
                    </span>
                    <span style={{ color: flow.is_active ? "#16a34a" : "inherit", fontWeight: 600 }}>
                      {flow.is_active ? "● Activo" : "○ Inactivo"}
                    </span>
                  </div>
                </div>
              );
            })}

            {workflows.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.85rem", opacity: 0.6 }}>
                No hay flujos creados.
              </div>
            )}
          </div>

          {/* Columna Derecha: Diagramador / Builder Interactivo del Flujo Seleccionado */}
          {editingWorkflow ? (
            <div style={{
              backgroundColor: "var(--surface-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
            }}>
              {/* Header del Editor de Flujo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="text"
                      value={editingWorkflow.name}
                      onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-color)",
                        outline: "none",
                        borderBottom: "1px dashed var(--primary)"
                      }}
                    />
                    <span style={{
                      backgroundColor: editingWorkflow.is_active ? "rgba(34, 197, 94, 0.15)" : "rgba(128,128,128,0.15)",
                      color: editingWorkflow.is_active ? "#15803d" : "var(--text-color)",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>
                      {editingWorkflow.is_active ? "Activo" : "Pausado"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editingWorkflow.description || ""}
                    placeholder="Descripción corta del flujo..."
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.75,
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--text-color)",
                      outline: "none",
                      width: "100%",
                      marginTop: "0.25rem"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleDeleteWorkflow(editingWorkflow.id)}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid var(--danger, #ef4444)",
                      color: "var(--danger, #ef4444)",
                      padding: "0.5rem 0.85rem",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Eliminar
                  </button>

                  <button
                    onClick={handleSaveWorkflowEdits}
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "6px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                    disabled={isPending}
                  >
                    <Check size={16} /> Guardar Cambios
                  </button>
                </div>
              </div>

              {/* Diagrama Visual de Pasos (Paso 1 -> Paso 2 -> Paso 3) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem 0" }}>
                {editingWorkflow.steps.map((step, idx) => {
                  const isTrigger = step.type === 'trigger';
                  const isDelay = step.type === 'delay';
                  const isCondition = step.type === 'condition';

                  return (
                    <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "520px" }}>
                      {/* Línea conectora vertical entre pasos */}
                      {idx > 0 && (
                        <div style={{ width: "2px", height: "24px", backgroundColor: "var(--primary)", opacity: 0.5, margin: "2px 0" }} />
                      )}

                      {/* Tarjeta del Paso en el Flujo */}
                      <div
                        style={{
                          width: "100%",
                          backgroundColor: isTrigger ? "var(--primary-light)" : "var(--bg-color)",
                          border: `1.5px solid ${isTrigger ? "var(--primary)" : isCondition ? "#eab308" : isDelay ? "#a855f7" : "var(--border-color)"}`,
                          borderRadius: "10px",
                          padding: "1rem 1.25rem",
                          position: "relative",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {isTrigger && <Zap size={16} style={{ color: "var(--primary)" }} />}
                            {isDelay && <Clock size={16} style={{ color: "#a855f7" }} />}
                            {isCondition && <GitFork size={16} style={{ color: "#eab308" }} />}
                            {!isTrigger && !isDelay && !isCondition && <Mail size={16} style={{ color: "#16a34a" }} />}
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{step.title}</span>
                          </div>

                          {!isTrigger && (
                            <button
                              onClick={() => handleDeleteStepFromWorkflow(step.id)}
                              style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer", opacity: 0.6, padding: 0 }}
                              title="Remover paso"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.8rem", opacity: 0.75 }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Botones para Agregar Nuevos Pasos al Diagrama */}
                <div style={{
                  marginTop: "1.25rem",
                  padding: "1rem",
                  border: "2px dashed var(--border-color)",
                  borderRadius: "10px",
                  width: "100%",
                  maxWidth: "520px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.6rem"
                }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>+ AGREGAR SIGUIENTE PASO AL FLUJO</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      onClick={() => handleAddStepToWorkflow('action')}
                      style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Mail size={13} style={{ color: "#16a34a" }} /> + Acción Email / Tag
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('delay')}
                      style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Clock size={13} style={{ color: "#a855f7" }} /> + Espera (Delay)
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('condition')}
                      style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <GitFork size={13} style={{ color: "#eab308" }} /> + Condición (If/Else)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--surface-color)", borderRadius: "12px", border: "1px solid var(--border-color)", opacity: 0.6 }}>
              Selecciona o crea un flujo de la izquierda para diagramar y editar sus pasos.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NUEVA REGLA (IF/THEN) */}
      {/* ========================================================================= */}
      {showRuleModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "2rem",
            width: "90%",
            maxWidth: "520px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sliders size={20} style={{ color: "var(--primary)" }} /> Crear Nueva Regla
              </h3>
              <button onClick={() => setShowRuleModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Nombre de la Regla *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Saludar a nuevos inversores"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              {/* Disparador (Trigger) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>1. SI OCURRE ESTO (Disparador) *</label>
                <select
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="tag_added">Cuando se agrega una etiqueta al contacto</option>
                  <option value="lead_created">Cuando se registra un nuevo cliente / lead</option>
                  <option value="sale_registered">Cuando se registra la venta de un auto</option>
                </select>
              </div>

              {newRuleTrigger === 'tag_added' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Etiqueta Específica:</label>
                  <select
                    value={newRuleTriggerVal}
                    onChange={(e) => setNewRuleTriggerVal(e.target.value)}
                    style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  >
                    {availableTags.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Acción (Then) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>2. EJECUTAR ESTA ACCIÓN (Acción) *</label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  <option value="send_email">Enviar Correo Electrónico</option>
                  <option value="add_tag">Agregar Etiqueta Secundaria</option>
                  <option value="notify_agent">Notificar al Agente Comercial</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Detalle o Asunto de la Acción:</label>
                <input
                  type="text"
                  placeholder="Ej: Asunto del correo o nombre de etiqueta..."
                  value={newRuleActionVal}
                  onChange={(e) => setNewRuleActionVal(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", padding: "0.65rem 1.1rem", borderRadius: "8px", fontWeight: 600, color: "var(--text-color)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "var(--primary)", color: "#ffffff", border: "none", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  disabled={isPending}
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NUEVO FLUJO (WORKFLOW) */}
      {/* ========================================================================= */}
      {showWorkflowModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "2rem",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GitFork size={20} style={{ color: "var(--primary)" }} /> Crear Nuevo Flujo de Trabajo
              </h3>
              <button onClick={() => setShowWorkflowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Nombre del Flujo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Secuencia de Bienvenida y Seguimiento"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Descripción Lógica</label>
                <input
                  type="text"
                  placeholder="Ej: Envía 2 correos con 24h de diferencia..."
                  value={newFlowDesc}
                  onChange={(e) => setNewFlowDesc(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Tag Inicial de Disparo (Trigger Tag)</label>
                <select
                  value={newFlowTag}
                  onChange={(e) => setNewFlowTag(e.target.value)}
                  style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                >
                  {availableTags.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", padding: "0.65rem 1.1rem", borderRadius: "8px", fontWeight: 600, color: "var(--text-color)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "var(--primary)", color: "#ffffff", border: "none", padding: "0.65rem 1.25rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  disabled={isPending}
                >
                  Crear y Diseñar Flujo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
