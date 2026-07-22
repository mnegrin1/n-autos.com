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
  title: "n-autos | Plataforma Premium para Automotoras",
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
