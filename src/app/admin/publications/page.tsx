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

  const isDemoUser = user.email === "mauricio@automotora.com";
  const agencyId = user.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : null);

  const initialVehicles = agencyId ? await getVehicles(agencyId) : [];
  const publications = agencyId ? await getVehiclePublications(agencyId) : [];

  // Filter only active (published) publications as per user request
  const activePublications = publications.filter((p: any) => p.status === 'published');

  return (
    <PublicationsClient 
      vehicles={initialVehicles}
      publications={activePublications}
    />
  );
}
