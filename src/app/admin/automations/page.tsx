import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAutomationRulesAction } from "@/actions/automationActions";
import { getAgents } from "@/actions/otherActions";
import { getCurrentUser } from "@/actions/authActions";
import AutomationsClient from "./AutomationsClient";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  // 1. Obtener reglas y agentes
  const rules = agencyId ? await getAutomationRulesAction(agencyId) : [];
  const agents = await getAgents();

  // 2. Obtener etiquetas únicas disponibles en los contactos
  const { data: leadsData } = await (supabaseAdmin.from('auto_leads') as any)
    .select('tags')
    .eq('agency_id', agencyId);

  const rawTags = (leadsData || []).flatMap((l: any) => Array.isArray(l.tags) ? l.tags : []);
  const availableTags = Array.from(new Set([...rawTags, "Inversor", "Web Lead", "VIP", "Lead Nuevo", "Interesado", "Contactado"])).sort();

  const userPayload = { agency_id: agencyId, name: currentUser?.name || "Administrador", role: currentUser?.role || "admin" };

  return (
    <AutomationsClient
      initialRules={rules}
      availableTags={availableTags}
      initialAgents={agents}
      currentUser={userPayload}
    />
  );
}
