import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAutomationRulesAction, getWorkflowsAction } from "@/actions/automationActions";
import AutomationsClient from "./AutomationsClient";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const agencyId = "00000000-0000-0000-0000-000000000000";

  // 1. Obtener reglas y flujos
  const rules = await getAutomationRulesAction(agencyId);
  const workflows = await getWorkflowsAction(agencyId);

  // 2. Obtener etiquetas únicas disponibles en los contactos
  const { data: leadsData } = await (supabaseAdmin.from('auto_leads') as any)
    .select('tags')
    .eq('agency_id', agencyId);

  const rawTags = (leadsData || []).flatMap((l: any) => Array.isArray(l.tags) ? l.tags : []);
  const availableTags = Array.from(new Set([...rawTags, "Inversor", "Web Lead", "VIP", "Lead Nuevo", "Interesado", "Contactado"])).sort();

  const currentUser = { agency_id: agencyId, name: "Mauricio Negrin", role: "admin" };

  return (
    <AutomationsClient
      initialRules={rules}
      initialWorkflows={workflows}
      availableTags={availableTags}
      currentUser={currentUser}
    />
  );
}
