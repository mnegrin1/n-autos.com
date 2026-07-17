export const runtime = "edge";
import { getVehicles } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import PortalShowroomClient from "./PortalShowroomClient";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ agency: string }>;
}) {
  const { agency: agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  const agencyId = agency?.id || "demo-agency-id";
  const vehicles = await getVehicles(agencyId);

  return (
    <PortalShowroomClient 
      initialVehicles={vehicles} 
      agencySlug={agencySlug} 
      agencyName={agency?.name || "Automotora"} 
      publishSold={!!agency?.publish_sold}
    />
  );
}