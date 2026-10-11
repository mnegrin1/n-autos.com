"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./portal.module.css";

interface PortalLogoLinkProps {
  agencySlug: string;
  agencyName: string;
  logoUrl?: string;
}

export default function PortalLogoLink({
  agencySlug,
  agencyName,
  logoUrl,
}: PortalLogoLinkProps) {
  const pathname = usePathname();
  const isDirectPortal = pathname.startsWith("/portal/");
  const homeHref = isDirectPortal ? `/portal/${agencySlug}` : "/";

  return (
    <Link href={homeHref} className={styles.logo}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={agencyName || "Logo"}
          className={styles.logoImg}
        />
      ) : null}
      {agencyName ? (
        <span className={styles.logoText}>{agencyName}</span>
      ) : !logoUrl ? (
        <span className={styles.logoText}>Automotora VIP</span>
      ) : null}
    </Link>
  );
}
