
import { getInboxConversations, getVehicles, getIntegrations, getAutoLeads } from "@/actions/autoActions";
import { getCurrentUser } from "@/actions/authActions";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getCurrentUser();
  const isDemoUser = !user || user.email === "mauricio@automotora.com";
  const agencyId = user?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const conversations = agencyId ? await getInboxConversations(agencyId) : [];
  const vehicles = agencyId ? await getVehicles(agencyId) : [];
  const integrations = await getIntegrations(agencyId || undefined);
  const leads = agencyId ? await getAutoLeads(agencyId) : [];

  return (
    <InboxClient 
      initialConversations={conversations} 
      vehicles={vehicles} 
      integrations={integrations}
      leads={leads}
    />
  );
}
