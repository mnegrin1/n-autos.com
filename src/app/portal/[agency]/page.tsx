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
  const agencyId = agency?.id || "00000000-0000-0000-0000-000000000000";
  const vehicles = await getVehicles(agencyId);

  return (
    <PortalShowroomClient 
      initialVehicles={vehicles} 
      agencySlug={agencySlug} 
      agencyName={agency?.name || "Automotora"} 
      publishSold={!!agency?.publish_sold}
      webTemplate={agency?.web_template || "standard"}
      heroEyebrow={agency?.hero_eyebrow || "AUTOMOTORA OFICIAL"}
      heroTitle={agency?.hero_title || "Encuentra tu próximo vehículo"}
      heroSubtitle={agency?.hero_subtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro."}
    />
  );
}
