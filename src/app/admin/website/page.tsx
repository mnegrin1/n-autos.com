import { getVehicles } from "@/actions/autoActions";
import { getPrimaryAgency } from "@/actions/agencyActions";
import WebsiteClient from "./WebsiteClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Página Web | CRM Automotoras",
  description: "Gestión de publicaciones en el portal web y editor visual de la página web de la automotora."
};

export default async function WebsitePage() {
  const agency = await getPrimaryAgency();
  const agencyId = agency?.id || "00000000-0000-0000-0000-000000000000";
  const vehicles = await getVehicles(agencyId);

  return (
    <WebsiteClient
      initialAgency={agency}
      initialVehicles={vehicles}
    />
  );
}
