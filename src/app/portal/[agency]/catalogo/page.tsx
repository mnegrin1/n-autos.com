import { getVehicles } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import PortalCatalogClient from "./PortalCatalogClient";
import SubdomainUnavailableView from "../SubdomainUnavailableView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CatalogPage({
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
      <SubdomainUnavailableView oldSubdomain={agencySlug} isNotFound={true} />
    );
  }

  const agencyId = agency?.id || null;
  const vehicles = agencyId ? await getVehicles(agencyId) : [];

  return (
    <PortalCatalogClient
      initialVehicles={vehicles}
      agencySlug={agencySlug}
      agencyName={agency?.name || "Automotora VIP"}
      whatsappPhone={agency?.whatsapp || "+598 99 123 456"}
      publishSold={!!agency?.publish_sold}
    />
  );
}
