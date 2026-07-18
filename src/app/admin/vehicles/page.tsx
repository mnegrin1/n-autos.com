import { getVehicles } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const vehicles = await getVehicles("00000000-0000-0000-0000-000000000000");
  const agency = await getAgencyBySlug("demo");

  return <VehiclesClient initialVehicles={vehicles} initialPublishSold={!!agency?.publish_sold} />;
}
