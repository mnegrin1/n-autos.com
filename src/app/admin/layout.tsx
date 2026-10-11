import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getCurrentUser, logout } from "@/actions/authActions";
import { isSuperAdmin } from "@/lib/iam/rbac";
import { isAgencyDeleted } from "@/lib/deletedAgenciesStore";
import AdminClientLayout from "./AdminClientLayout";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  const agency = await getPrimaryAgency(user?.agency_id);
  const agencyName = agency?.name || "Automotora VIP";
  const logoUrl = agency?.logo_url;

  return {
    title: agencyName,
    icons: logoUrl ? {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
    } : undefined,
  };
}

export default async function AutoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // 1. Verificación de revocación por eliminación de organización
  if (user && !isSuperAdmin(user)) {
    if (isAgencyDeleted(user.agency_id, user.subdomain, user.email)) {
      await logout();
      redirect("/admin/login?error=org_deleted");
    }
  }

  let enrichedUser: any = user;
  if (user && (!user.agency_name || !user.subdomain) && user.agency_id) {
    try {
      const agency = await getPrimaryAgency(user.agency_id);
      if (agency) {
        enrichedUser = {
          ...user,
          agency_name: agency.name || user.agency_name,
          subdomain: agency.subdomain || user.subdomain,
        };
      } else if (!isSuperAdmin(user)) {
        // La organización ya no existe en el sistema
        await logout();
        redirect("/admin/login?error=org_deleted");
      }
    } catch (_) {}
  }

  // 2. Si el Superadmin accede con ID global, aprovisionar contexto de automotora por defecto
  if (user && isSuperAdmin(user) && enrichedUser) {
    if (!enrichedUser.agency_name || !enrichedUser.subdomain || enrichedUser.agency_id === "00000000-0000-0000-0000-000000000000") {
      try {
        const fallbackAgency = await getPrimaryAgency();
        if (fallbackAgency) {
          enrichedUser = {
            ...enrichedUser,
            agency_name: fallbackAgency.name || "Automotora VIP",
            subdomain: fallbackAgency.subdomain || "demo",
            agency_id: fallbackAgency.id || enrichedUser.agency_id,
          };
        }
      } catch (_) {}
    }
  }

  return <AdminClientLayout initialUser={enrichedUser}>{children}</AdminClientLayout>;
}
