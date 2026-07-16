export const dynamic = "force-dynamic";

import { getAgencyBySlug } from "@/actions/agencyActions";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const agency = await getAgencyBySlug("demo");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SettingsForm initialAgency={agency} />
    </div>
  );
}
