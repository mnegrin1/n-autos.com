
import { getVehicles, getIntegrations, getVehiclePublications } from "@/actions/autoActions";
import { getCurrentUser } from "@/actions/authActions";
import IntegrationsClient from "./IntegrationsClient";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  const isDemoUser = !user || user.email === "mauricio@automotora.com";
  const agencyId = user?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : "");

  const stockVehicles = agencyId ? await getVehicles(agencyId) : [];
  const integrations = (agencyId ? await getIntegrations(agencyId) : {}) as any;
  const publications = agencyId ? await getVehiclePublications(agencyId) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <IntegrationsClient 
        initialVehicles={stockVehicles} 
        initialIntegrations={integrations} 
        initialPublications={publications} 
        agencyId={agencyId}
        appId={process.env.MERCADOLIBRE_APP_ID}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
        errorMsg={searchParams.error as string}
        successMsg={searchParams.success as string}
      />
    </div>
  );
}
