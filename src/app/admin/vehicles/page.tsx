import { getVehicles } from "@/actions/autoActions";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getCurrentUser } from "@/actions/authActions";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const vehicles = agencyId ? await getVehicles(agencyId) : [];
  const agency = await getPrimaryAgency(agencyId || undefined);

  return <VehiclesClient initialVehicles={vehicles} initialPublishSold={!!agency?.publish_sold} />;
}
