
import { getVehicles, getIntegrations, getVehiclePublications } from "@/actions/autoActions";
import IntegrationsClient from "./IntegrationsClient";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const stockVehicles = await getVehicles("00000000-0000-0000-0000-000000000000");
  const integrations = await getIntegrations();
  const publications = await getVehiclePublications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <IntegrationsClient 
        initialVehicles={stockVehicles} 
        initialIntegrations={integrations} 
        initialPublications={publications} 
        appId={process.env.MERCADOLIBRE_APP_ID}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
        errorMsg={searchParams.error as string}
        successMsg={searchParams.success as string}
      />
    </div>
  );
}
