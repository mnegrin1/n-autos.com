export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getVehicles, getIntegrations, getVehiclePublications } from "@/actions/autoActions";
import { getUsersByAgency } from "@/actions/userActions";
import SettingsForm from "./SettingsForm";

import { getCurrentUser } from "@/actions/authActions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentUser = await getCurrentUser();
  const agencyId = currentUser?.agency_id || "00000000-0000-0000-0000-000000000000";

  const agency = await getPrimaryAgency(agencyId);
  const stockVehicles = await getVehicles(agencyId);
  const integrations = await getIntegrations();
  const publications = await getVehiclePublications(agencyId);
  
  let users = [];
  if (agency?.id) {
    users = await getUsersByAgency(agency.id);
  }

  if (!agency) {
    return <div>Agencia no encontrada</div>;
  }

  return (
    <Suspense fallback={<div style={{ padding: "2rem", opacity: 0.6 }}>Cargando configuración...</div>}>
      <SettingsForm 
        initialAgency={agency as any} 
        initialVehicles={stockVehicles}
        initialIntegrations={integrations as any}
        initialPublications={publications}
        initialUsers={users}
        appId={process.env.MERCADOLIBRE_APP_ID}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
        errorMsg={searchParams.error as string}
        successMsg={searchParams.success as string}
      />
    </Suspense>
  );
}
