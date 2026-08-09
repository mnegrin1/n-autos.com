import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "n-sistemas | Plataforma Premium para Automotoras",
  description: "Automatizá tu seguimiento, respondé al instante y organizá a tu equipo de ventas sin depender de sistemas rígidos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;900&family=Plus+Jakarta+Sans:wght@700;800&family=Space+Grotesk:ital,wght@0,500;0,700;1,700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="beforeInteractive" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('crm-theme') || 'system';
              if (theme !== 'system') {
                document.documentElement.className = '${inter.variable} ${outfit.variable} theme-' + theme;
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
