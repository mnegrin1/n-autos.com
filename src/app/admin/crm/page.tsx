export const runtime = "edge";
import CRMClient from "./CRMClient";
import { getAutoLeads } from "@/actions/autoActions";
import { getAgents } from "@/actions/otherActions"; // reuse agents list
import { getCurrentUser } from "@/actions/authActions"; // reuse auth session

export const dynamic = "force-dynamic";

export default async function AutoCRMPage() {
  const allLeads = await getAutoLeads("demo-agency-id");
  const allAgents = await getAgents();
  const currentUser = await getCurrentUser();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <CRMClient initialLeads={allLeads} initialAgents={allAgents} currentUser={currentUser} />
    </div>
  );
}