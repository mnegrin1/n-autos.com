import { Metadata } from "next";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getCurrentUser } from "@/actions/authActions";
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
  return <AdminClientLayout initialUser={user}>{children}</AdminClientLayout>;
}
