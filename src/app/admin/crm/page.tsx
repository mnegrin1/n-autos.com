import CRMClient from "./CRMClient";
import { getAutoLeads } from "@/actions/autoActions";
import { getAgents } from "@/actions/otherActions"; // reuse agents list
import { getCurrentUser } from "@/actions/authActions"; // reuse auth session

export const dynamic = "force-dynamic";

export default async function AutoCRMPage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const allLeads = agencyId ? await getAutoLeads(agencyId) : [];
  const allAgents = await getAgents();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <CRMClient initialLeads={allLeads} initialAgents={allAgents} currentUser={currentUser} />
    </div>
  );
}
