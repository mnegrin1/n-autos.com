import { getVehicleById } from "@/actions/autoActions";
import { getAgencyBySlug } from "@/actions/agencyActions";
import VehicleDetailClient from "./VehicleDetailClient";
import { notFound } from "next/navigation";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ agency: string; vehicleId: string }>;
}) {
  const { agency: agencySlug, vehicleId } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  return (
    <VehicleDetailClient 
      vehicle={vehicle} 
      agencyName={agency?.name || "Automotora"} 
      whatsappPhone={agency?.whatsapp || "+598 99 123 456"} 
    />
  );
}
