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

  // TODO: we should get agency_id from user context ideally, but keeping it generic as per other pages for now
  const agencyId = "00000000-0000-0000-0000-000000000000";

  const initialVehicles = await getVehicles(agencyId);
  const publications = await getVehiclePublications();

  // Filter only active (published) publications as per user request
  const activePublications = publications.filter(p => p.status === 'published');

  return (
    <PublicationsClient 
      vehicles={initialVehicles}
      publications={activePublications}
    />
  );
}
