import { getVehicles } from "@/actions/autoActions";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getCurrentUser } from "@/actions/authActions";
import WebsiteClient from "./WebsiteClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Página Web | CRM Automotoras",
  description: "Gestión de publicaciones en el portal web y editor visual de la página web de la automotora."
};

export default async function WebsitePage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const agency = await getPrimaryAgency(agencyId || undefined);
  const targetVehiclesAgencyId = agency?.id || agencyId;
  const vehicles = targetVehiclesAgencyId ? await getVehicles(targetVehiclesAgencyId) : [];

  return (
    <WebsiteClient
      initialAgency={agency}
      initialVehicles={vehicles}
    />
  );
}
