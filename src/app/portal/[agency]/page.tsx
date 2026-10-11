import { getVehicles } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import PortalShowroomClient from "./PortalShowroomClient";
import SubdomainUnavailableView from "./SubdomainUnavailableView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalPage({
  params,
}: {
  params: Promise<{ agency: string }>;
}) {
  const { agency: agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);

  if (agency?.isUnavailable) {
    return (
      <SubdomainUnavailableView
        oldSubdomain={agency.oldSubdomain || agencySlug}
        newSubdomain={agency.newSubdomain}
        isNotFound={false}
      />
    );
  }

  if (agency?.isNotFound && agencySlug !== "demo" && agencySlug !== "hola") {
    return (
      <SubdomainUnavailableView
        oldSubdomain={agencySlug}
        isNotFound={true}
      />
    );
  }

  const agencyId = agency?.id || null;
  const vehicles = agencyId ? await getVehicles(agencyId) : [];

  return (
    <PortalShowroomClient 
      initialVehicles={vehicles} 
      agencyId={agencyId || "00000000-0000-0000-0000-000000000000"}
      agencySlug={agencySlug} 
      agencyName={agency?.name || "Automotora VIP"} 
      whatsappPhone={agency?.whatsapp || "+598 99 123 456"}
      logoUrl={agency?.logo_url || ""}
      coverUrl={agency?.cover_url || ""}
      publishSold={!!agency?.publish_sold}
      webTemplate={agency?.web_template || "standard"}
      primaryColor={agency?.primary_color}
      heroEyebrow={agency?.hero_eyebrow || "AUTOMOTORA OFICIAL"}
      heroTitle={agency?.hero_title || "Encuentra tu próximo vehículo"}
      heroSubtitle={agency?.hero_subtitle || "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro."}
      footerText={agency?.footer_text}
      locationAddress={agency?.location_address}
      businessHours={agency?.business_hours}
      contactDescription={agency?.contact_description}
      aboutText={agency?.about_text}
      showTrustSection={agency?.show_trust_section}
      trustPillar1Title={agency?.trust_pillar1_title}
      trustPillar1Desc={agency?.trust_pillar1_desc}
      trustPillar2Title={agency?.trust_pillar2_title}
      trustPillar2Desc={agency?.trust_pillar2_desc}
      trustPillar3Title={agency?.trust_pillar3_title}
      trustPillar3Desc={agency?.trust_pillar3_desc}
      trustPillar4Title={agency?.trust_pillar4_title}
      trustPillar4Desc={agency?.trust_pillar4_desc}
      contactEmail={agency?.contact_email}
      latitude={agency?.latitude}
      longitude={agency?.longitude}
    />
  );
}
