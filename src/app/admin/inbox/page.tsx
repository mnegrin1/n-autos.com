export const runtime = "edge";
export const dynamic = "force-dynamic";

import { getInboxConversations, getVehicles, getIntegrations, getAutoLeads } from "@/actions/autoActions";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
  const conversations = await getInboxConversations();
  const vehicles = await getVehicles("demo-agency-id");
  const integrations = await getIntegrations();
  const leads = await getAutoLeads("demo-agency-id");

  return (
    <InboxClient 
      initialConversations={conversations} 
      vehicles={vehicles} 
      integrations={integrations}
      leads={leads}
    />
  );
}