import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Negocio Todo en Uno - CRM Inmobiliario y Automotriz",
  description: "Gestión unificada para inmobiliarias y automotoras en una sola plataforma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="beforeInteractive" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('crm-theme') || 'system';
              if (theme !== 'system') {
                document.documentElement.className = '${inter.variable} theme-' + theme;
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
