
import { getInboxConversations, getVehicles, getIntegrations, getAutoLeads } from "@/actions/autoActions";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const conversations = await getInboxConversations();
  const vehicles = await getVehicles("00000000-0000-0000-0000-000000000000");
  const integrations = await getIntegrations();
  const leads = await getAutoLeads("00000000-0000-0000-0000-000000000000");

  return (
    <InboxClient 
      initialConversations={conversations} 
      vehicles={vehicles} 
      integrations={integrations}
      leads={leads}
    />
  );
}
