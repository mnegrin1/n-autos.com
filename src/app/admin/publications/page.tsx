import { getCurrentUser } from "@/actions/authActions";
import { getVehicles, getVehiclePublications } from "@/actions/autoActions";
import PublicationsClient from "./PublicationsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Publicaciones Activas",
};

export default async function PublicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const agencyId = user.agency_id || "00000000-0000-0000-0000-000000000000";

  const initialVehicles = await getVehicles(agencyId);
  const publications = await getVehiclePublications(agencyId);

  // Filter only active (published) publications as per user request
  const activePublications = publications.filter((p: any) => p.status === 'published');

  return (
    <PublicationsClient 
      vehicles={initialVehicles}
      publications={activePublications}
    />
  );
}
