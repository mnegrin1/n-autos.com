import { Metadata } from "next";
import styles from "./portal.module.css";
import { getAgencyBySlug } from "@/actions/agencyActions";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import ZoomScript from "./ZoomScript";
import PortalFaviconScript from "./PortalFaviconScript";
import SubdomainUnavailableView from "./SubdomainUnavailableView";
import PortalLogoLink from "./PortalLogoLink";
import PortalNavbarLinks from "./PortalNavbarLinks";
import PortalFooter from "./PortalFooter";
import { generateAccessibleThemeTokens } from "@/lib/portalThemeHelper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agency: string }>;
}): Promise<Metadata> {
  const { agency: agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);

  if (agency?.isUnavailable || agency?.isNotFound) {
    return {
      title: agency?.isNotFound
        ? "Sitio No Encontrado | CRM Automotora"
        : "Subdominio Actualizado | CRM Automotora",
    };
  }

  const agencyName = agency?.name || agencySlug.replace(/-/g, " ").toUpperCase();
  const logoUrl = agency?.logo_url;

  return {
    title: agencyName,
    icons: logoUrl
      ? {
          icon: logoUrl,
          shortcut: logoUrl,
          apple: logoUrl,
        }
      : undefined,
  };
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agency: string }>;
}) {
  const { agency: agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);

  // Si el subdominio fue cambiado o no existe, mostrar la vista de Subdominio No Disponible
  if (agency?.isUnavailable) {
    return (
      <SubdomainUnavailableView
        oldSubdomain={agency.oldSubdomain || agencySlug}
        newSubdomain={agency.newSubdomain}
        isNotFound={false}
      />
    );
  }

  if (agency?.isNotFound) {
    return (
      <SubdomainUnavailableView oldSubdomain={agencySlug} isNotFound={true} />
    );
  }

  const agencyName = agency?.name || agencySlug.replace(/-/g, " ").toUpperCase();
  const whatsappPhone = agency?.whatsapp || "+598 99 123 456";

  const activePrimary = agency?.primary_color || "#10b981";
  const fontFamilyName = agency?.font_family || "Inter";

  const fontCssMap: Record<string, string> = {
    Inter: "'Inter', sans-serif",
    "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
    Manrope: "'Manrope', sans-serif",
    Outfit: "'Outfit', sans-serif",
    "Playfair Display": "'Playfair Display', serif",
    Roboto: "'Roboto', sans-serif",
  };
  const fontCss = fontCssMap[fontFamilyName] || "'Inter', sans-serif";

  // Calcular tokens de color con contraste accesible garantizado
  const tokens = generateAccessibleThemeTokens(activePrimary);

  return (
    <div className={styles.portalWrapper} style={{ fontFamily: fontCss }}>
      {/* Dynamic Favicon & Title Script */}
      <PortalFaviconScript
        logoUrl={agency?.logo_url || ""}
        agencyName={agencyName}
      />

      {/* Google Fonts para la selección del cliente */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Roboto:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* Client component to apply zoom */}
      <ZoomScript />

      {/* Dynamic Styling para Branding, Colores Accesibles y Fuentes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --portal-primary: ${tokens.primary};
          --portal-primary-contrast: ${tokens.primaryContrast};
          --portal-primary-hover: ${tokens.primaryHover};
          --portal-primary-light: ${tokens.primaryLight};
          --portal-primary-border: ${tokens.primaryBorder};
          --portal-accent: ${tokens.accentDark};
          --portal-accent-dark: ${tokens.accentDark};
          --portal-accent-light: ${tokens.accentLight};
          --portal-font-family: ${fontCss};

          --primary: ${tokens.primary};
          --primary-hover: ${tokens.primaryHover};
          --primary-contrast: ${tokens.primaryContrast};
          --primary-light: ${tokens.primaryLight};

          --portal-bg: #0b0f17;
          --portal-surface: #111726;
          --portal-surface-card: #151d2a;
          --portal-surface-hover: #1c2637;
          --portal-border: rgba(255, 255, 255, 0.09);
          --portal-border-subtle: rgba(255, 255, 255, 0.05);
          --portal-text: #f8fafc;
          --portal-text-muted: #94a3b8;
          --portal-text-faint: #64748b;

          --portal-navbar-bg: rgba(11, 15, 23, 0.88);
          --portal-navbar-border: rgba(255, 255, 255, 0.08);
          --portal-navbar-text: #ffffff;
          --portal-navbar-link: rgba(255, 255, 255, 0.82);
          --portal-navbar-link-hover: #ffffff;

          --portal-input-bg: #0f1523;
          --portal-input-border: rgba(255, 255, 255, 0.14);
          --portal-input-text: #ffffff;
          --portal-input-placeholder: #64748b;

          --portal-footer-bg: #070a10;
          --portal-footer-text: #94a3b8;
        }

        .visitorLightMode,
        :global(.visitorLightMode) {
          --portal-bg: #f8fafc;
          --portal-surface: #ffffff;
          --portal-surface-card: #ffffff;
          --portal-surface-hover: #f1f5f9;
          --portal-border: #e2e8f0;
          --portal-border-subtle: #f1f5f9;
          --portal-text: #0f172a;
          --portal-text-muted: #475569;
          --portal-text-faint: #94a3b8;

          --portal-navbar-bg: rgba(255, 255, 255, 0.95);
          --portal-navbar-border: #e2e8f0;
          --portal-navbar-text: #0f172a;
          --portal-navbar-link: #334155;
          --portal-navbar-link-hover: ${tokens.accentLight};

          --portal-input-bg: #ffffff;
          --portal-input-border: #cbd5e1;
          --portal-input-text: #0f172a;
          --portal-input-placeholder: #94a3b8;

          --portal-footer-bg: #f1f5f9;
          --portal-footer-text: #475569;

          --portal-accent: ${tokens.accentLight};
        }

        body {
          font-family: ${fontCss};
        }
      `,
        }}
      />

      {/* Header Banner de la Automotora */}
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <PortalLogoLink
            agencySlug={agencySlug}
            agencyName={agencyName}
            logoUrl={agency?.logo_url}
          />

          <PortalNavbarLinks
            agencySlug={agencySlug}
            agencyName={agencyName}
            whatsappPhone={whatsappPhone}
          />
        </div>
      </header>

      <main className={styles.mainContent}>{children}</main>

      <PortalFooter
        agencySlug={agencySlug}
        agencyName={agencyName}
        footerText={agency?.footer_text}
      />

      <WhatsAppFloatingButton
        phone={whatsappPhone}
        agencyName={agencyName}
      />
    </div>
  );
}
