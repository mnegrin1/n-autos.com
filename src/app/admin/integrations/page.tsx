import { getVehicles, getIntegrations, getVehiclePublications } from "@/actions/autoActions";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const stockVehicles = await getVehicles("demo-agency-id");
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
      />
    </div>
  );
}
