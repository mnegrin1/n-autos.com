
import Link from "next/link";
import styles from "./portal.module.css";
import { getAgencyBySlug } from "@/actions/agencyActions";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import ZoomScript from "./ZoomScript";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agency: string }>;
}) {
  const { agency: agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  const agencyName = agency?.name || agencySlug.replace(/-/g, " ").toUpperCase();
  const primaryColor = agency?.primary_color || "#10b981"; // default emerald green for auto
  const secondaryColor = agency?.secondary_color || "#059669";
  const whatsappPhone = agency?.whatsapp || "+598 99 123 456";
  const cleanWhatsappPhone = whatsappPhone.replace(/[\s+]/g, "");
  
  return (
    <div className={styles.portalWrapper}>
      {/* Google Fonts Preconnect and Links */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Client component to apply zoom */}
      <ZoomScript />

      {/* Dynamic Styling for Branding Colors */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: ${primaryColor} !important;
          --primary-hover: ${secondaryColor} !important;
          --secondary: ${secondaryColor} !important;
          --primary-light: ${secondaryColor}15 !important;
          --font-family: 'Inter', sans-serif !important;
        }
        body, button, html, input, select, textarea, h1, h2, h3, h4, h5, h6, .logo {
          font-family: 'Inter', sans-serif !important;
        }
      `}} />

      {/* Public Navbar (styled like real estate) */}
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href={`/portal/${agencySlug}`} className={styles.logo}>
            {agency?.logo_url ? (
              <img src={agency.logo_url} alt={agencyName} style={{ height: "45px", objectFit: "contain" }} />
            ) : (
              <span>🚗 {agencyName}</span>
            )}
          </Link>
          <nav className={styles.navLinks}>
            <Link href={`/portal/${agencySlug}`}>Inicio</Link>
            <a href={`https://wa.me/${cleanWhatsappPhone}`} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
              <svg className={styles.whatsappIcon} viewBox="0 0 448 512" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              <span className={styles.whatsappNumber}>{whatsappPhone}</span>
            </a>
          </nav>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>{agencyName}</h3>
            <p>Catálogo virtual de vehículos seleccionados. Calidad, confianza y tranquilidad garantizadas en tu próxima compra.</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href={`/portal/${agencySlug}`}>Inicio</Link>
            <a href={`https://wa.me/${cleanWhatsappPhone}`} target="_blank" rel="noopener noreferrer">Contacto</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} {agencyName}. Todos los derechos reservados. Desarrollado por CRM Automotores.</p>
        </div>
      </footer>
      
      <WhatsAppFloatingButton 
        phone={whatsappPhone} 
        agencyName={agencyName} 
      />
    </div>
  );
}
