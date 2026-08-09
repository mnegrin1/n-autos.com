
import { getInboxConversations, getVehicles, getIntegrations, getAutoLeads } from "@/actions/autoActions";
import { getCurrentUser } from "@/actions/authActions";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getCurrentUser();
  const agencyId = user?.agency_id || "00000000-0000-0000-0000-000000000000";

  const conversations = await getInboxConversations(agencyId);
  const vehicles = await getVehicles(agencyId);
  const integrations = await getIntegrations();
  const leads = await getAutoLeads(agencyId);

  return (
    <InboxClient 
      initialConversations={conversations} 
      vehicles={vehicles} 
      integrations={integrations}
      leads={leads}
    />
  );
}
