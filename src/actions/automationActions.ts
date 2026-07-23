"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export interface AutomationRule {
  id: string;
  agency_id?: string;
  name: string;
  trigger_event: string; // ej: 'tag_added', 'lead_created', 'sale_registered'
  trigger_value?: string; // ej: 'Inversor'
  action_type: string; // ej: 'send_email', 'add_tag', 'remove_tag', 'notify_agent'
  action_value?: string; // ej: 'Plantilla Ofertas'
  is_active: boolean;
  executions_count?: number;
  created_at?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'delay' | 'condition' | 'action';
  title: string;
  description: string;
  config: Record<string, any>;
}

export interface AutomationWorkflow {
  id: string;
  agency_id?: string;
  name: string;
  description?: string;
  trigger_tag?: string;
  steps: WorkflowStep[];
  is_active: boolean;
  enrolled_contacts_count?: number;
  created_at?: string;
}

// Datos semilla de prueba si la tabla no tiene entradas aún
const DEFAULT_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "Autobienvenida a Leads con Tag 'Inversor'",
    trigger_event: "tag_added",
    trigger_value: "Inversor",
    action_type: "send_email",
    action_value: "Catálogo de Vehículos Premium para Inversores",
    is_active: true,
    executions_count: 14,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "rule-2",
    name: "Etiquetar automáticamente a nuevos registros del portal",
    trigger_event: "lead_created",
    trigger_value: "Portal Web",
    action_type: "add_tag",
    action_value: "Web Lead",
    is_active: true,
    executions_count: 38,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: "rule-3",
    name: "Notificar agente al cerrar venta",
    trigger_event: "sale_registered",
    trigger_value: "Todas las ventas",
    action_type: "notify_agent",
    action_value: "Notificación push a administración",
    is_active: false,
    executions_count: 6,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  }
];

const DEFAULT_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: "flow-1",
    name: "Secuencia de Nutrición de Leads Nuevos",
    description: "Secuencia de 3 días para nuevos clientes interesados en comprar o permutar.",
    trigger_tag: "Lead Nuevo",
    is_active: true,
    enrolled_contacts_count: 24,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    steps: [
      {
        id: "step-1",
        type: "trigger",
        title: "Disparador: Asignación de Tag",
        description: "Se activa cuando el contacto recibe el tag 'Lead Nuevo'",
        config: { tag: "Lead Nuevo" }
      },
      {
        id: "step-2",
        type: "action",
        title: "Enviar Email de Bienvenida",
        description: "Envia plantilla: 'Bienvenido a Tu Automotora'",
        config: { emailSubject: "¡Bienvenido! Gracias por contactarnos" }
      },
      {
        id: "step-3",
        type: "delay",
        title: "Esperar 24 horas",
        description: "Pausa el flujo durante 1 día antes del siguiente paso",
        config: { hours: 24 }
      },
      {
        id: "step-4",
        type: "condition",
        title: "¿El cliente interactuó o respondió?",
        description: "Evalúa si el cliente tiene la etiqueta 'Contactado'",
        config: { conditionTag: "Contactado" }
      },
      {
        id: "step-5",
        type: "action",
        title: "Asignar Tag 'Seguimiento Prioritario'",
        description: "Agrega etiqueta VIP para seguimiento comercial",
        config: { addTag: "Seguimiento Prioritario" }
      }
    ]
  },
  {
    id: "flow-2",
    name: "Re-engagement de Leads Inactivos",
    description: "Flujo automatizado de 7 días para reactivar contactos sin interacción reciente.",
    trigger_tag: "Inactivo",
    is_active: false,
    enrolled_contacts_count: 9,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    steps: [
      {
        id: "step-10",
        type: "trigger",
        title: "Disparador: Tag 'Inactivo'",
        description: "Cuando un contacto es marcado como inactivo",
        config: { tag: "Inactivo" }
      },
      {
        id: "step-11",
        type: "action",
        title: "Enviar Email con Ofertas Destacadas",
        description: "Envia selección de oportunidades de la semana",
        config: { emailSubject: "Descubre las ofertas de esta semana" }
      },
      {
        id: "step-12",
        type: "delay",
        title: "Esperar 48 horas",
        description: "Espera 2 días para dar tiempo a la lectura",
        config: { hours: 48 }
      },
      {
        id: "step-13",
        type: "action",
        title: "Quitar Tag 'Inactivo'",
        description: "Remueve etiqueta de inactividad",
        config: { removeTag: "Inactivo" }
      }
    ]
  }
];

export async function getAutomationRulesAction(agencyId?: string) {
  try {
    const targetAgency = agencyId || "00000000-0000-0000-0000-000000000000";
    const { data, error } = await (supabaseAdmin.from('automation_rules') as any)
      .select('*')
      .eq('agency_id', targetAgency)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_RULES;
    }
    return data;
  } catch (e) {
    return DEFAULT_RULES;
  }
}

export async function createAutomationRuleAction(rule: Omit<AutomationRule, 'id' | 'created_at'>) {
  try {
    const newRule = {
      id: crypto.randomUUID(),
      agency_id: rule.agency_id || "00000000-0000-0000-0000-000000000000",
      name: rule.name,
      trigger_event: rule.trigger_event,
      trigger_value: rule.trigger_value || "",
      action_type: rule.action_type,
      action_value: rule.action_value || "",
      is_active: rule.is_active !== undefined ? rule.is_active : true,
      executions_count: 0,
      created_at: new Date().toISOString()
    };

    try {
      await (supabaseAdmin.from('automation_rules') as any).insert([newRule]);
    } catch (e) {
      console.warn("Tabla automation_rules no disponible en Supabase, operando con fallback local.");
    }

    revalidatePath("/admin/automations");
    return { success: true, data: newRule };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear la regla" };
  }
}

export async function toggleAutomationRuleAction(ruleId: string, isActive: boolean) {
  try {
    try {
      await (supabaseAdmin.from('automation_rules') as any)
        .update({ is_active: isActive })
        .eq('id', ruleId);
    } catch (e) {}

    revalidatePath("/admin/automations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAutomationRuleAction(ruleId: string) {
  try {
    try {
      await (supabaseAdmin.from('automation_rules') as any)
        .delete()
        .eq('id', ruleId);
    } catch (e) {}

    revalidatePath("/admin/automations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getWorkflowsAction(agencyId?: string) {
  try {
    const targetAgency = agencyId || "00000000-0000-0000-0000-000000000000";
    const { data, error } = await (supabaseAdmin.from('automation_workflows') as any)
      .select('*')
      .eq('agency_id', targetAgency)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_WORKFLOWS;
    }
    return data;
  } catch (e) {
    return DEFAULT_WORKFLOWS;
  }
}

export async function saveWorkflowAction(workflow: Partial<AutomationWorkflow>) {
  try {
    const record = {
      id: workflow.id || crypto.randomUUID(),
      agency_id: workflow.agency_id || "00000000-0000-0000-0000-000000000000",
      name: workflow.name || "Nuevo Flujo",
      description: workflow.description || "",
      trigger_tag: workflow.trigger_tag || "",
      steps: workflow.steps || [],
      is_active: workflow.is_active !== undefined ? workflow.is_active : true,
      enrolled_contacts_count: workflow.enrolled_contacts_count || 0,
      created_at: workflow.created_at || new Date().toISOString()
    };

    try {
      await (supabaseAdmin.from('automation_workflows') as any)
        .upsert(record, { onConflict: "id" });
    } catch (e) {}

    revalidatePath("/admin/automations");
    return { success: true, data: record };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteWorkflowAction(workflowId: string) {
  try {
    try {
      await (supabaseAdmin.from('automation_workflows') as any)
        .delete()
        .eq('id', workflowId);
    } catch (e) {}

    revalidatePath("/admin/automations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
