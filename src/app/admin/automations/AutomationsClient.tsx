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
  UserCheck,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  AutomationRule, 
  RuleActionItem,
  AutomationWorkflow, 
  WorkflowStep,
  createAutomationRuleAction, 
  toggleAutomationRuleAction, 
  deleteAutomationRuleAction,
  saveWorkflowAction,
  deleteWorkflowAction 
} from "@/actions/automationActions";

export interface StackedAction {
  id: string;
  type: "send_email" | "send_message" | "add_tag" | "notify_agent";
  value: string;
  details: {
    subject?: string;
    body?: string;
    channel?: "WhatsApp" | "SMS";
    tag?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AutomationsClientProps {
  initialRules: AutomationRule[];
  initialWorkflows: AutomationWorkflow[];
  availableTags: string[];
  initialAgents: Agent[];
  currentUser: any;
}

export default function AutomationsClient({ 
  initialRules, 
  initialWorkflows, 
  availableTags, 
  initialAgents,
  currentUser 
}: AutomationsClientProps) {
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "workflows">("rules");
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(initialWorkflows);

  // Estados para Modal de Nueva Regla (Friendly + Stacked + Side Drawer)
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleTrigger, setNewRuleTrigger] = useState("tag_added");
  const [newRuleTriggerVal, setNewRuleTriggerVal] = useState(availableTags[0] || "Inversor");
  
  // Lista apilada de acciones de la regla
  const [stackedActions, setStackedActions] = useState<StackedAction[]>([
    {
      id: "action-1",
      type: "send_email",
      value: "Correo de bienvenida",
      details: {
        subject: "¡Gracias por contactarnos!",
        body: "Hola {{nombre}}, recibimos tu solicitud y te enviamos la información."
      }
    }
  ]);

  // ID de la acción que se está editando en la barra lateral derecha (para send_email o send_message)
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // Estados para el Editor de Flujo (Workflow Visual Builder)
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");
  const [newFlowTag, setNewFlowTag] = useState(availableTags[0] || "Lead Nuevo");

  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Handlers para Acciones Apilables
  const handleAddAction = () => {
    const newId = `action-${Date.now()}`;
    const newAction: StackedAction = {
      id: newId,
      type: "send_email",
      value: "Correo de bienvenida",
      details: {
        subject: "Información adicional",
        body: "Hola {{nombre}}, te adjuntamos los detalles requeridos."
      }
    };
    setStackedActions(prev => [...prev, newAction]);
    setEditingActionId(newId);
  };

  const handleRemoveAction = (actionId: string) => {
    if (stackedActions.length <= 1) {
      alert("La regla debe contener al menos una acción.");
      return;
    }
    setStackedActions(prev => prev.filter(a => a.id !== actionId));
    if (editingActionId === actionId) {
      setEditingActionId(null);
    }
  };

  const handleActionTypeChange = (actionId: string, newType: StackedAction['type']) => {
    setStackedActions(prev => prev.map(a => {
      if (a.id !== actionId) return a;
      const details = { ...a.details };
      let value = a.value;

      if (newType === 'send_email') {
        if (!details.subject) details.subject = "Correo de seguimiento";
        if (!details.body) details.body = "Hola {{nombre}}, enviamos esta información.";
        value = `Correo: ${details.subject}`;
      } else if (newType === 'send_message') {
        if (!details.channel) details.channel = "WhatsApp";
        if (!details.body) details.body = "Hola {{nombre}}, ¿cómo estás? Te contactamos de la automotora.";
        value = `Mensaje ${details.channel}`;
      } else if (newType === 'add_tag') {
        details.tag = availableTags[0] || 'Interesado';
        value = `Etiqueta '${details.tag}'`;
      } else if (newType === 'notify_agent') {
        value = "Notificar vendedor";
      }

      return { ...a, type: newType, value, details };
    }));

    if (newType === 'send_email' || newType === 'send_message') {
      setEditingActionId(actionId);
    } else if (editingActionId === actionId) {
      setEditingActionId(null);
    }
  };

  const handleUpdateActionDetails = (actionId: string, updatedDetails: Partial<StackedAction['details']>, customVal?: string) => {
    setStackedActions(prev => prev.map(a => {
      if (a.id !== actionId) return a;
      const details = { ...a.details, ...updatedDetails };
      let value = customVal || a.value;

      if (a.type === 'send_email' && details.subject) {
        value = `Correo: ${details.subject}`;
      } else if (a.type === 'send_message') {
        value = `Mensaje ${details.channel || 'WhatsApp'}`;
      } else if (a.type === 'add_tag' && details.tag) {
        value = `Etiqueta '${details.tag}'`;
      }

      return { ...a, details, value };
    }));
  };

  // Handlers para Reglas
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      alert("Por favor ingresa un nombre para la regla.");
      return;
    }
    if (stackedActions.length === 0) {
      alert("Agrega al menos una acción a la regla.");
      return;
    }

    const primaryAction = stackedActions[0];
    const summaryValue = stackedActions.map(a => {
      if (a.type === 'send_email') return `Correo: ${a.details.subject || a.value}`;
      if (a.type === 'send_message') return `Mensaje (${a.details.channel || 'WhatsApp'})`;
      if (a.type === 'add_tag') return `Tag '${a.details.tag || a.value}'`;
      if (a.type === 'notify_agent') return `Notificar vendedor`;
      return a.value;
    }).join(" + ");

    startTransition(async () => {
      const res = await createAutomationRuleAction({
        agency_id: currentUser?.agency_id,
        name: newRuleName.trim(),
        trigger_event: newRuleTrigger,
        trigger_value: newRuleTriggerVal,
        action_type: primaryAction.type,
        action_value: summaryValue,
        actions: stackedActions.map(a => ({
          id: a.id,
          type: a.type,
          value: a.value,
          details: a.details
        })),
        is_active: true
      });

      if (res.success && res.data) {
        const createdRule: AutomationRule = {
          ...(res.data as AutomationRule),
          actions: stackedActions.map(a => ({
            id: a.id,
            type: a.type,
            value: a.value,
            details: a.details
          }))
        };
        setRules(prev => [createdRule, ...prev]);
        setShowRuleModal(false);
        setNewRuleName("");
        setEditingActionId(null);
        setStackedActions([
          {
            id: `action-${Date.now()}`,
            type: "send_email",
            value: "Correo de bienvenida",
            details: {
              subject: "¡Gracias por contactarnos!",
              body: "Hola {{nombre}}, recibimos tu solicitud y te enviamos la información."
            }
          }
        ]);
        showToast("Regla creada exitosamente.");
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
        description: `Se activa cuando un contacto recibe la etiqueta '${newFlowTag}'`,
        config: { trigger_type: "tag_added", tag: newFlowTag }
      },
      {
        id: `step-${Date.now()}-2`,
        type: "action",
        title: "Enviar Email de Saludo",
        description: "Envia mensaje de bienvenida automático",
        config: { 
          action_kind: "send_email", 
          subject: "¡Hola! Gracias por contactarnos", 
          body: "Hola {{nombre}}, nos alegramos de saludarte..." 
        }
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

  // Agregar nuevo paso dinámico al flujo con configuración básica predeterminada
  const handleAddStepToWorkflow = (kind: 'send_email' | 'send_message' | 'assign_tag' | 'remove_tag' | 'assign_agent' | 'delay' | 'condition') => {
    if (!editingWorkflow) return;

    let newStep: WorkflowStep;
    const stepNum = editingWorkflow.steps.length + 1;
    const newId = `step-${Date.now()}`;

    switch (kind) {
      case 'send_email':
        newStep = {
          id: newId,
          type: 'action',
          title: `Paso ${stepNum}: Enviar Email`,
          description: "Envia correo automático personalizado",
          config: { 
            action_kind: 'send_email', 
            subject: "Catálogo e Información de Interés", 
            body: "Hola {{nombre}}, adjunto la información solicitada." 
          }
        };
        break;
      case 'send_message':
        newStep = {
          id: newId,
          type: 'action',
          title: `Paso ${stepNum}: Enviar Mensaje WhatsApp`,
          description: "Envia mensaje rápido al cliente",
          config: { 
            action_kind: 'send_message', 
            message_type: 'whatsapp',
            body: "Hola {{nombre}}, ¿cómo estás? Te escribimos para darte seguimiento." 
          }
        };
        break;
      case 'assign_tag':
        newStep = {
          id: newId,
          type: 'action',
          title: `Paso ${stepNum}: Asignar Tag '${availableTags[0] || 'Interesado'}'`,
          description: "Agrega etiqueta al contacto",
          config: { 
            action_kind: 'assign_tag', 
            tag: availableTags[0] || 'Interesado' 
          }
        };
        break;
      case 'remove_tag':
        newStep = {
          id: newId,
          type: 'action',
          title: `Paso ${stepNum}: Quitar Tag '${availableTags[0] || 'Inactivo'}'`,
          description: "Remueve etiqueta del contacto",
          config: { 
            action_kind: 'remove_tag', 
            tag: availableTags[0] || 'Inactivo' 
          }
        };
        break;
      case 'assign_agent':
        const defaultAgent = initialAgents[0] || { id: 'agent-1', name: 'Mauricio Negrin' };
        newStep = {
          id: newId,
          type: 'action',
          title: `Paso ${stepNum}: Asignar a ${defaultAgent.name}`,
          description: "Asigna agente comercial responsable del lead",
          config: { 
            action_kind: 'assign_agent', 
            agent_id: defaultAgent.id,
            agent_name: defaultAgent.name 
          }
        };
        break;
      case 'delay':
        newStep = {
          id: newId,
          type: 'delay',
          title: `Paso ${stepNum}: Esperar 24 Horas`,
          description: "Pausa el flujo durante un período de tiempo",
          config: { 
            delay_amount: 24, 
            delay_unit: 'hours' 
          }
        };
        break;
      case 'condition':
        newStep = {
          id: newId,
          type: 'condition',
          title: `Paso ${stepNum}: Condición ¿Tiene tag '${availableTags[0] || 'VIP'}'?`,
          description: "Evalúa condición para bifurcar el recorrido",
          config: { 
            condition_type: 'has_tag', 
            tag: availableTags[0] || 'VIP',
            yes_label: "Cumple la condición",
            no_label: "No cumple"
          }
        };
        break;
    }

    const updated = {
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep]
    };

    setEditingWorkflow(updated);
    setEditingStepId(newId);
  };

  const handleUpdateStepConfig = (stepId: string, updatedConfig: Record<string, any>, customTitle?: string, customDesc?: string) => {
    if (!editingWorkflow) return;

    const updatedSteps = editingWorkflow.steps.map(s => {
      if (s.id !== stepId) return s;

      let title = customTitle || s.title;
      let description = customDesc || s.description;

      // Generación dinámica de títulos según la configuración
      if (s.type === 'trigger') {
        title = `Disparador: Tag '${updatedConfig.tag || 'Lead Nuevo'}'`;
        description = `Se activa cuando un contacto recibe el tag '${updatedConfig.tag || 'Lead Nuevo'}'`;
      } else if (s.type === 'delay') {
        const unit = updatedConfig.delay_unit === 'days' ? 'Días' : updatedConfig.delay_unit === 'minutes' ? 'Minutos' : 'Horas';
        title = `Esperar ${updatedConfig.delay_amount || 1} ${unit}`;
        description = `Pausa el flujo durante ${updatedConfig.delay_amount || 1} ${unit.toLowerCase()}`;
      } else if (s.type === 'condition') {
        title = `Condición: ¿Tiene tag '${updatedConfig.tag || 'VIP'}'?`;
        description = `Bifurca si el contacto tiene la etiqueta '${updatedConfig.tag || 'VIP'}'`;
      } else if (s.type === 'action') {
        const kind = updatedConfig.action_kind;
        if (kind === 'send_email') {
          title = `Enviar Email: ${updatedConfig.subject || 'Sin asunto'}`;
          description = `Correo: "${updatedConfig.subject || ''}"`;
        } else if (kind === 'send_message') {
          title = `Enviar Mensaje WhatsApp`;
          description = `WhatsApp: "${(updatedConfig.body || '').substring(0, 35)}..."`;
        } else if (kind === 'assign_tag') {
          title = `Asignar Tag '${updatedConfig.tag || ''}'`;
          description = `Agrega la etiqueta '${updatedConfig.tag || ''}' al contacto`;
        } else if (kind === 'remove_tag') {
          title = `Quitar Tag '${updatedConfig.tag || ''}'`;
          description = `Remueve la etiqueta '${updatedConfig.tag || ''}' del contacto`;
        } else if (kind === 'assign_agent') {
          title = `Asignar Agente: ${updatedConfig.agent_name || 'Vendedor'}`;
          description = `Asigna el prospecto al vendedor ${updatedConfig.agent_name || ''}`;
        }
      }

      return {
        ...s,
        title,
        description,
        config: { ...s.config, ...updatedConfig }
      };
    });

    setEditingWorkflow({
      ...editingWorkflow,
      steps: updatedSteps
    });
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    if (!editingWorkflow) return;
    const steps = [...editingWorkflow.steps];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx <= 0 || targetIdx >= steps.length) return; // No mover antes del Trigger (índice 0)

    const temp = steps[idx];
    steps[idx] = steps[targetIdx];
    steps[targetIdx] = temp;

    setEditingWorkflow({
      ...editingWorkflow,
      steps
    });
  };

  const handleDeleteStepFromWorkflow = (stepId: string) => {
    if (!editingWorkflow) return;
    const updated = {
      ...editingWorkflow,
      steps: editingWorkflow.steps.filter(s => s.id !== stepId)
    };
    setEditingWorkflow(updated);
    if (editingStepId === stepId) setEditingStepId(null);
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
      {/* Banner Superior Unificado sin esquinas redondeadas */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.5rem",
        backgroundColor: "var(--surface-color)",
        border: "1px solid var(--border-color)",
        borderRadius: 0,
        boxShadow: "var(--shadow-sm)",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Zap size={24} style={{ color: "var(--primary)" }} /> Motor de Automatizaciones
            </h1>
            <p style={{ marginTop: "0.25rem", opacity: 0.75, fontSize: "0.88rem" }}>
              Crea reglas automáticas y flujos de trabajo interactivos paso a paso para potenciar tus ventas.
            </p>
          </div>

          {activeSubTab === "rules" ? (
            <button
              onClick={() => setShowRuleModal(true)}
              className="btn-primary"
              style={{
                padding: "0.6rem 1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Plus size={18} /> Nueva Regla
            </button>
          ) : (
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="btn-primary"
              style={{
                padding: "0.6rem 1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Plus size={18} /> Nuevo Flujo
            </button>
          )}
        </div>

        {/* Subpestañas de Automatización */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => {
              setActiveSubTab("rules");
              setSelectedWorkflow(null);
            }}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeSubTab === "rules" ? "var(--primary)" : "var(--border-color)",
              backgroundColor: activeSubTab === "rules" ? "var(--bg-color)" : "transparent",
              color: activeSubTab === "rules" ? "var(--primary)" : "var(--text-color)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Zap size={14} /> Reglas ({rules.length})
          </button>
          <button
            onClick={() => setActiveSubTab("workflows")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeSubTab === "workflows" ? "var(--primary)" : "var(--border-color)",
              backgroundColor: activeSubTab === "workflows" ? "var(--bg-color)" : "transparent",
              color: activeSubTab === "workflows" ? "var(--primary)" : "var(--text-color)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <GitFork size={14} /> Flujos ({workflows.length})
          </button>
        </div>
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

                  {/* Diagrama Bloque DISPARADOR -> ACCIONES */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    <div style={{
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      padding: "0.4rem 0.75rem",
                      borderRadius: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontWeight: 600
                    }}>
                      <span style={{ color: "var(--primary)", fontWeight: 800 }}>SI:</span>
                      <TagIcon size={14} /> {rule.trigger_event === 'tag_added' ? `Tag '${rule.trigger_value}'` : rule.trigger_value || rule.trigger_event}
                    </div>

                    <ArrowRight size={16} style={{ opacity: 0.5 }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.85rem" }}>ENTONCES:</span>
                      {rule.actions && rule.actions.length > 0 ? (
                        rule.actions.map((act, i) => (
                          <div key={i} style={{
                            backgroundColor: "var(--bg-color)",
                            border: "1px solid var(--border-color)",
                            padding: "0.35rem 0.65rem",
                            borderRadius: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.82rem",
                            fontWeight: 600
                          }}>
                            {act.type === 'send_email' && <Mail size={13} style={{ color: "var(--primary)" }} />}
                            {act.type === 'send_message' && <MessageSquare size={13} style={{ color: "#25D366" }} />}
                            {act.type === 'add_tag' && <TagIcon size={13} style={{ color: "#eab308" }} />}
                            {act.type === 'notify_agent' && <UserCheck size={13} style={{ color: "#3b82f6" }} />}
                            <span>
                              {act.type === 'send_email' ? (act.details?.subject || act.value || "Email") :
                               act.type === 'send_message' ? (`Mensaje (${act.details?.channel || 'WhatsApp'})`) :
                               act.type === 'add_tag' ? (`Tag '${act.details?.tag || act.value}'`) :
                               (act.value || "Acción")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{
                          backgroundColor: "var(--bg-color)",
                          border: "1px solid var(--border-color)",
                          padding: "0.35rem 0.65rem",
                          borderRadius: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontWeight: 600
                        }}>
                          {rule.action_type === 'send_email' ? <Mail size={14} /> :
                           rule.action_type === 'send_message' ? <MessageSquare size={14} /> :
                           rule.action_type === 'add_tag' ? <TagIcon size={14} /> : <UserCheck size={14} />}
                          {rule.action_value || rule.action_type}
                        </div>
                      )}
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
                    setEditingStepId(null);
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
                    <button
                      onClick={() => setEditingWorkflow({ ...editingWorkflow, is_active: !editingWorkflow.is_active })}
                      style={{
                        backgroundColor: editingWorkflow.is_active ? "rgba(34, 197, 94, 0.15)" : "rgba(128,128,128,0.15)",
                        color: editingWorkflow.is_active ? "#15803d" : "var(--text-color)",
                        border: `1px solid ${editingWorkflow.is_active ? "#22c55e" : "var(--border-color)"}`,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {editingWorkflow.is_active ? "Activo" : "Pausado"}
                    </button>
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
                  const isAction = step.type === 'action';
                  const actionKind = step.config?.action_kind || 'send_email';
                  const isEditingThisStep = editingStepId === step.id;

                  return (
                    <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "560px" }}>
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
                          borderRadius: "12px",
                          padding: "1.1rem 1.25rem",
                          position: "relative",
                          boxShadow: isEditingThisStep ? "0 0 0 2px var(--primary)" : "var(--shadow-sm)",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {isTrigger && <Zap size={17} style={{ color: "var(--primary)" }} />}
                            {isDelay && <Clock size={17} style={{ color: "#a855f7" }} />}
                            {isCondition && <GitFork size={17} style={{ color: "#eab308" }} />}
                            {isAction && actionKind === 'send_email' && <Mail size={17} style={{ color: "#16a34a" }} />}
                            {isAction && actionKind === 'send_message' && <MessageSquare size={17} style={{ color: "#25d366" }} />}
                            {isAction && (actionKind === 'assign_tag' || actionKind === 'remove_tag') && <TagIcon size={17} style={{ color: "#3b82f6" }} />}
                            {isAction && actionKind === 'assign_agent' && <UserCheck size={17} style={{ color: "#ec4899" }} />}

                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{step.title}</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            {/* Botones de Reordenamiento UP/DOWN */}
                            {!isTrigger && idx > 1 && (
                              <button
                                onClick={() => handleMoveStep(idx, 'up')}
                                style={{ background: "none", border: "none", color: "var(--text-color)", cursor: "pointer", opacity: 0.6, padding: "0.2rem" }}
                                title="Mover arriba"
                              >
                                <ArrowUp size={14} />
                              </button>
                            )}
                            {!isTrigger && idx < editingWorkflow.steps.length - 1 && (
                              <button
                                onClick={() => handleMoveStep(idx, 'down')}
                                style={{ background: "none", border: "none", color: "var(--text-color)", cursor: "pointer", opacity: 0.6, padding: "0.2rem" }}
                                title="Mover abajo"
                              >
                                <ArrowDown size={14} />
                              </button>
                            )}

                            {/* Botón Editar Parámetros */}
                            <button
                              onClick={() => setEditingStepId(isEditingThisStep ? null : step.id)}
                              style={{
                                backgroundColor: isEditingThisStep ? "var(--primary)" : "rgba(128,128,128,0.12)",
                                color: isEditingThisStep ? "#ffffff" : "var(--text-color)",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                            >
                              <Edit3 size={13} /> {isEditingThisStep ? "Cerrar" : "Editar"}
                            </button>

                            {!isTrigger && (
                              <button
                                onClick={() => handleDeleteStepFromWorkflow(step.id)}
                                style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer", opacity: 0.7, padding: "0.25rem" }}
                                title="Remover paso"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.82rem", opacity: 0.75 }}>
                          {step.description}
                        </p>

                        {/* PANEL DE CONFIGURACIÓN INLINE (Formulario de Parámetros del Paso) */}
                        {isEditingThisStep && (
                          <div style={{
                            marginTop: "1rem",
                            paddingTop: "0.85rem",
                            borderTop: "1px dashed var(--border-color)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem"
                          }}>
                            {/* Editor para TRIGGER */}
                            {isTrigger && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Tag Inicial de Disparo:</label>
                                <select
                                  value={step.config?.tag || availableTags[0]}
                                  onChange={(e) => handleUpdateStepConfig(step.id, { tag: e.target.value })}
                                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                >
                                  {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            )}

                            {/* Editor para ACTION */}
                            {isAction && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Tipo de Acción:</label>
                                  <select
                                    value={actionKind}
                                    onChange={(e) => handleUpdateStepConfig(step.id, { action_kind: e.target.value })}
                                    style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                  >
                                    <option value="send_email">📧 Enviar Email</option>
                                    <option value="send_message">💬 Enviar Mensaje WhatsApp</option>
                                    <option value="assign_tag">🏷️ Asignar Tag</option>
                                    <option value="remove_tag">🚫 Quitar Tag</option>
                                    <option value="assign_agent">👤 Asignar Agente Comercial</option>
                                  </select>
                                </div>

                                {actionKind === 'send_email' && (
                                  <>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                      <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Asunto del Correo:</label>
                                      <input
                                        type="text"
                                        value={step.config?.subject || ''}
                                        placeholder="Ej: Catálogo de Vehículos"
                                        onChange={(e) => handleUpdateStepConfig(step.id, { subject: e.target.value })}
                                        style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)", fontSize: "0.85rem" }}
                                      />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                      <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Cuerpo del Mensaje (Soporta {"{{nombre}}"}):</label>
                                      <textarea
                                        rows={3}
                                        value={step.config?.body || ''}
                                        placeholder="Hola {{nombre}}, queríamos informarte..."
                                        onChange={(e) => handleUpdateStepConfig(step.id, { body: e.target.value })}
                                        style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)", fontSize: "0.85rem" }}
                                      />
                                    </div>
                                  </>
                                )}

                                {actionKind === 'send_message' && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Texto del Mensaje WhatsApp:</label>
                                    <textarea
                                      rows={3}
                                      value={step.config?.body || ''}
                                      placeholder="Hola {{nombre}}, te contactamos desde Tu Automotora..."
                                      onChange={(e) => handleUpdateStepConfig(step.id, { body: e.target.value })}
                                      style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)", fontSize: "0.85rem" }}
                                    />
                                  </div>
                                )}

                                {(actionKind === 'assign_tag' || actionKind === 'remove_tag') && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Seleccionar Tag:</label>
                                    <select
                                      value={step.config?.tag || availableTags[0]}
                                      onChange={(e) => handleUpdateStepConfig(step.id, { tag: e.target.value })}
                                      style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                    >
                                      {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                )}

                                {actionKind === 'assign_agent' && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Seleccionar Agente Comercial:</label>
                                    <select
                                      value={step.config?.agent_id || (initialAgents[0]?.id || '')}
                                      onChange={(e) => {
                                        const selectedAgent = initialAgents.find(a => a.id === e.target.value);
                                        handleUpdateStepConfig(step.id, { 
                                          agent_id: e.target.value,
                                          agent_name: selectedAgent ? selectedAgent.name : 'Agente'
                                        });
                                      }}
                                      style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                    >
                                      {initialAgents.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Editor para DELAY */}
                            {isDelay && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                  <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Tiempo de Espera:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={step.config?.delay_amount || 24}
                                    onChange={(e) => handleUpdateStepConfig(step.id, { delay_amount: parseInt(e.target.value) || 1 })}
                                    style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                  />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                  <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Unidad de Tiempo:</label>
                                  <select
                                    value={step.config?.delay_unit || 'hours'}
                                    onChange={(e) => handleUpdateStepConfig(step.id, { delay_unit: e.target.value })}
                                    style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                  >
                                    <option value="hours">Horas</option>
                                    <option value="days">Días</option>
                                    <option value="minutes">Minutos</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Editor para CONDITION */}
                            {isCondition && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label style={{ fontSize: "0.78rem", fontWeight: 600 }}>Evaluar si el contacto tiene la etiqueta:</label>
                                <select
                                  value={step.config?.tag || availableTags[0]}
                                  onChange={(e) => handleUpdateStepConfig(step.id, { tag: e.target.value })}
                                  style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-color)" }}
                                >
                                  {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Botones para Agregar Nuevos Pasos al Diagrama */}
                <div style={{
                  marginTop: "1.25rem",
                  padding: "1.25rem",
                  border: "2px dashed var(--border-color)",
                  borderRadius: "12px",
                  width: "100%",
                  maxWidth: "560px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  backgroundColor: "rgba(128,128,128,0.03)"
                }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.8, letterSpacing: "0.05em" }}>
                    + AGREGAR SIGUIENTE PASO AL FLUJO
                  </span>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      onClick={() => handleAddStepToWorkflow('send_email')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <Mail size={14} style={{ color: "#16a34a" }} /> + Email
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('send_message')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <MessageSquare size={14} style={{ color: "#25d366" }} /> + Mensaje (WhatsApp)
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('assign_tag')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <TagIcon size={14} style={{ color: "#3b82f6" }} /> + Tag
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('assign_agent')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <UserCheck size={14} style={{ color: "#ec4899" }} /> + Asignar Agente
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('delay')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <Clock size={14} style={{ color: "#a855f7" }} /> + Pausa / Delay
                    </button>

                    <button
                      onClick={() => handleAddStepToWorkflow('condition')}
                      style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <GitFork size={14} style={{ color: "#eab308" }} /> + Condición (If/Else)
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
      {/* MODAL 1: NUEVA REGLA (FRIENDLY + ESQUINAS RECTAS + ARROW + STACKED + DRAWER) */}
      {/* ========================================================================= */}
      {showRuleModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          {(() => {
            const activeEditingAction = stackedActions.find(a => a.id === editingActionId);

            return (
              <div style={{
                backgroundColor: "var(--surface-color)",
                border: "none",
                borderRadius: 0,
                padding: "1.75rem",
                width: "95%",
                maxWidth: activeEditingAction ? "980px" : "680px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                transition: "all 0.25s ease-in-out",
                maxHeight: "90vh",
                overflowY: "auto"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.85rem", marginBottom: "1.25rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Zap size={20} style={{ color: "var(--primary)" }} /> Nueva Regla
                  </h3>
                  <button
                    onClick={() => {
                      setShowRuleModal(false);
                      setEditingActionId(null);
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.7 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Nombre de la Regla */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Nombre de la regla</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Bienvenida a nuevo lead"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: 0,
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                        fontSize: "0.9rem"
                      }}
                    />
                  </div>

                  {/* Disparador -> Flecha -> Acciones Stackeadas -> Drawer Lateral */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: activeEditingAction ? "1fr auto 1.1fr 310px" : "1fr auto 1.1fr",
                    gap: "1.1rem",
                    alignItems: "start"
                  }}>
                    {/* 1. DISPARADOR (IZQUIERDA) */}
                    <div style={{
                      backgroundColor: "var(--bg-color)",
                      padding: "1.1rem",
                      borderRadius: 0,
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem"
                    }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Disparador
                      </label>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7, fontWeight: 600 }}>Evento</span>
                        <select
                          value={newRuleTrigger}
                          onChange={(e) => setNewRuleTrigger(e.target.value)}
                          style={{
                            padding: "0.55rem 0.75rem",
                            borderRadius: 0,
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--surface-color)",
                            color: "var(--text-color)",
                            fontSize: "0.85rem"
                          }}
                        >
                          <option value="tag_added">Etiqueta agregada</option>
                          <option value="lead_created">Nuevo lead</option>
                          <option value="sale_registered">Venta realizada</option>
                        </select>
                      </div>

                      {newRuleTrigger === 'tag_added' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <span style={{ fontSize: "0.78rem", opacity: 0.7, fontWeight: 600 }}>Etiqueta</span>
                          <select
                            value={newRuleTriggerVal}
                            onChange={(e) => setNewRuleTriggerVal(e.target.value)}
                            style={{
                              padding: "0.55rem 0.75rem",
                              borderRadius: 0,
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--surface-color)",
                              color: "var(--text-color)",
                              fontSize: "0.85rem"
                            }}
                          >
                            {availableTags.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* 2. FLECHA AL MEDIO -> */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      alignSelf: "center",
                      padding: "0.4rem"
                    }}>
                      <ArrowRight size={26} style={{ color: "var(--primary)" }} />
                    </div>

                    {/* 3. ACCIONES APILADAS (DERECHA) */}
                    <div style={{
                      backgroundColor: "var(--bg-color)",
                      padding: "1.1rem",
                      borderRadius: 0,
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Acciones
                        </label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{stackedActions.length} apilada(s)</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
                        {stackedActions.map((act) => {
                          const isEditingThis = editingActionId === act.id;
                          const isMessageOrEmail = act.type === 'send_email' || act.type === 'send_message';

                          return (
                            <div
                              key={act.id}
                              style={{
                                backgroundColor: "var(--surface-color)",
                                border: isEditingThis ? "1px solid var(--primary)" : "none",
                                borderRadius: 0,
                                padding: "0.75rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <select
                                  value={act.type}
                                  onChange={(e) => handleActionTypeChange(act.id, e.target.value as any)}
                                  style={{
                                    flex: 1,
                                    padding: "0.45rem",
                                    borderRadius: 0,
                                    border: "1px solid var(--border-color)",
                                    backgroundColor: "var(--bg-color)",
                                    color: "var(--text-color)",
                                    fontSize: "0.83rem",
                                    fontWeight: 600
                                  }}
                                >
                                  <option value="send_email">Correo electrónico</option>
                                  <option value="send_message">Mensaje (WhatsApp/SMS)</option>
                                  <option value="add_tag">Agregar etiqueta</option>
                                  <option value="notify_agent">Notificar vendedor</option>
                                </select>

                                {stackedActions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAction(act.id)}
                                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.2rem" }}
                                    title="Eliminar acción"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>

                              {/* Si es tag */}
                              {act.type === 'add_tag' && (
                                <select
                                  value={act.details.tag || availableTags[0]}
                                  onChange={(e) => handleUpdateActionDetails(act.id, { tag: e.target.value }, `Etiqueta '${e.target.value}'`)}
                                  style={{
                                    padding: "0.45rem",
                                    borderRadius: 0,
                                    border: "1px solid var(--border-color)",
                                    backgroundColor: "var(--bg-color)",
                                    color: "var(--text-color)",
                                    fontSize: "0.8rem"
                                  }}
                                >
                                  {availableTags.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              )}

                              {/* Si es email o mensaje, botón para desplegar barra a la derecha */}
                              {isMessageOrEmail && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.2rem" }}>
                                  <div style={{ fontSize: "0.78rem", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {act.type === 'send_email' ? (
                                      <span><Mail size={12} style={{ display: "inline", marginRight: 4 }} />{act.details.subject || "Sin asunto"}</span>
                                    ) : (
                                      <span><MessageSquare size={12} style={{ display: "inline", marginRight: 4, color: "#25D366" }} />{act.details.channel || "WhatsApp"}</span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setEditingActionId(isEditingThis ? null : act.id)}
                                    style={{
                                      backgroundColor: isEditingThis ? "var(--primary)" : "transparent",
                                      color: isEditingThis ? "#ffffff" : "var(--primary)",
                                      border: "1px solid var(--primary)",
                                      borderRadius: 0,
                                      padding: "0.25rem 0.65rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.3rem"
                                    }}
                                  >
                                    <Sliders size={12} /> {isEditingThis ? "Editando..." : "Editar"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddAction}
                        style={{
                          backgroundColor: "transparent",
                          border: "1px dashed var(--border-color)",
                          borderRadius: 0,
                          padding: "0.55rem",
                          color: "var(--text-color)",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem"
                        }}
                      >
                        <Plus size={15} /> Añadir acción
                      </button>
                    </div>

                    {/* 4. BARRA A LA DERECHA PARA EDITAR EMAIL O MENSAJE */}
                    {activeEditingAction && (
                      <div style={{
                        backgroundColor: "var(--bg-color)",
                        border: "none",
                        padding: "1.1rem",
                        borderRadius: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            {activeEditingAction.type === 'send_email' ? (
                              <><Mail size={16} style={{ color: "var(--primary)" }} /> Correo</>
                            ) : (
                              <><MessageSquare size={16} style={{ color: "#25D366" }} /> Mensaje</>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingActionId(null)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)", opacity: 0.7 }}
                          >
                            <X size={15} />
                          </button>
                        </div>

                        {activeEditingAction.type === 'send_email' ? (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Asunto</span>
                              <input
                                type="text"
                                value={activeEditingAction.details.subject || ""}
                                onChange={(e) => handleUpdateActionDetails(activeEditingAction.id, { subject: e.target.value })}
                                placeholder="Ej: Catálogo de Vehículos"
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: 0,
                                  border: "1px solid var(--border-color)",
                                  backgroundColor: "var(--surface-color)",
                                  color: "var(--text-color)",
                                  fontSize: "0.82rem"
                                }}
                              />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Mensaje</span>
                              <textarea
                                rows={4}
                                value={activeEditingAction.details.body || ""}
                                onChange={(e) => handleUpdateActionDetails(activeEditingAction.id, { body: e.target.value })}
                                placeholder="Hola {{nombre}}, te adjuntamos la información..."
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: 0,
                                  border: "1px solid var(--border-color)",
                                  backgroundColor: "var(--surface-color)",
                                  color: "var(--text-color)",
                                  fontSize: "0.82rem",
                                  resize: "vertical"
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Canal</span>
                              <select
                                value={activeEditingAction.details.channel || "WhatsApp"}
                                onChange={(e) => handleUpdateActionDetails(activeEditingAction.id, { channel: e.target.value as any })}
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: 0,
                                  border: "1px solid var(--border-color)",
                                  backgroundColor: "var(--surface-color)",
                                  color: "var(--text-color)",
                                  fontSize: "0.82rem"
                                }}
                              >
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="SMS">SMS</option>
                              </select>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Mensaje</span>
                              <textarea
                                rows={4}
                                value={activeEditingAction.details.body || ""}
                                onChange={(e) => handleUpdateActionDetails(activeEditingAction.id, { body: e.target.value })}
                                placeholder="Hola {{nombre}}, ¿cómo estás? Te escribimos de la automotora..."
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: 0,
                                  border: "1px solid var(--border-color)",
                                  backgroundColor: "var(--surface-color)",
                                  color: "var(--text-color)",
                                  fontSize: "0.82rem",
                                  resize: "vertical"
                                }}
                              />
                            </div>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingActionId(null)}
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 0,
                            padding: "0.5rem",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            marginTop: "0.25rem"
                          }}
                        >
                          Listo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTONES INFERIORES */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRuleModal(false);
                        setEditingActionId(null);
                      }}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid var(--border-color)",
                        padding: "0.6rem 1.1rem",
                        borderRadius: 0,
                        fontWeight: 600,
                        color: "var(--text-color)",
                        cursor: "pointer"
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.6rem 1.3rem",
                        borderRadius: 0,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                      disabled={isPending}
                    >
                      Guardar Regla
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}
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
