export const dynamic = "force-dynamic";

import { getAgencyBySlug } from "@/actions/agencyActions";
import { getVehicles, getIntegrations, getVehiclePublications } from "@/actions/autoActions";
import { getUsersByAgency } from "@/actions/userActions";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const agency = await getAgencyBySlug("demo");
  const stockVehicles = await getVehicles("00000000-0000-0000-0000-000000000000");
  const integrations = await getIntegrations();
  const publications = await getVehiclePublications();
  
  let users = [];
  if (agency?.id) {
    users = await getUsersByAgency(agency.id);
  }

  if (!agency) {
    return <div>Agencia no encontrada</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SettingsForm 
        initialAgency={agency as any} 
        initialVehicles={stockVehicles}
        initialIntegrations={integrations}
        initialPublications={publications}
        initialUsers={users}
        appId={process.env.MERCADOLIBRE_APP_ID}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
        errorMsg={searchParams.error as string}
        successMsg={searchParams.success as string}
      />
    </div>
  );
}
