"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./portal.module.css";

interface PortalFooterProps {
  agencySlug: string;
  agencyName: string;
  footerText?: string;
}

export default function PortalFooter({
  agencySlug,
  agencyName,
  footerText,
}: PortalFooterProps) {
  const pathname = usePathname();
  const isDirectPortal = pathname.startsWith("/portal/");
  const basePath = isDirectPortal ? `/portal/${agencySlug}` : "";

  const homeHref = basePath ? `${basePath}` : "/";
  const catalogHref = `${basePath}/catalogo`;
  const aboutHref = `${homeHref}#nosotros`;
  const contactHref = `${homeHref}#contacto`;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <h3>{agencyName}</h3>
          <p>
            {footerText ||
              "Tu concesionario de confianza. Vehículos seleccionados con certificación de origen, garantía y la mejor atención personalizada."}
          </p>
        </div>
        <div className={styles.footerLinks}>
          <Link href={homeHref}>Inicio</Link>
          <Link href={catalogHref}>Catálogo</Link>
          <Link href={aboutHref}>Nosotros</Link>
          <Link href={contactHref}>Contacto</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>
          &copy; {new Date().getFullYear()} {agencyName}. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
