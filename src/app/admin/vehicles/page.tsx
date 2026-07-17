import { getVehicles } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const vehicles = await getVehicles("demo-agency-id");
  const agency = await getAgencyBySlug("demo");

  return <VehiclesClient initialVehicles={vehicles} initialPublishSold={!!agency?.publish_sold} />;
}
