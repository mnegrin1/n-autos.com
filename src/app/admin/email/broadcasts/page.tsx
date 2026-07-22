import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBroadcastsAction } from "@/actions/broadcastActions";
import BroadcastsClient from "./BroadcastsClient";

export const dynamic = "force-dynamic";

export default async function BroadcastsPage() {
  const agencyId = "00000000-0000-0000-0000-000000000000";

  // 1. Obtener todos los leads de la agencia para calcular segmentos de tags y destinatarios
  const { data: leadsData } = await (supabaseAdmin.from('auto_leads') as any)
    .select('id, name, email, tags')
    .eq('agency_id', agencyId);

  const leads = (leadsData || []).map((l: any) => ({
    id: l.id,
    name: l.name || "Cliente",
    email: l.email || "",
    tags: Array.isArray(l.tags) ? l.tags : []
  }));

  // 2. Obtener historial de Broadcasts
  const broadcasts = await getBroadcastsAction(agencyId);

  const currentUser = { agency_id: agencyId, name: "Mauricio Negrin", role: "admin" };

  return (
    <BroadcastsClient
      initialBroadcasts={broadcasts}
      allLeads={leads}
      currentUser={currentUser}
    />
  );
}
