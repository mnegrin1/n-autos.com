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
  title: "n-autos.com por n-sistemas.com | Plataforma Premium para Automotoras",
  description: "Plataforma de gestión automotriz n-autos.com, desarrollada por n-sistemas.com. Automatizá tu seguimiento, respondé al instante y organizá a tu equipo de ventas.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} theme-dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600;1,700&family=Newsreader:ital,opsz,wght@1,6..72,600;1,6..72,700;1,6..72,800&family=Playfair+Display:ital,wght@1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;900&family=Plus+Jakarta+Sans:wght@700;800&family=Space+Grotesk:ital,wght@0,500;0,700;1,700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var path = window.location.pathname;
                var isAdmin = path.startsWith('/admin') || path.startsWith('/superadmin');
                var classes = ['${inter.variable}', '${outfit.variable}'];
                if (isAdmin) {
                  var theme = localStorage.getItem('crm-theme') || 'light';
                  if (theme === 'dark') theme = 'dark-dim';
                  var pattern = localStorage.getItem('crm-bg-pattern') || 'topography';
                  if (theme && theme !== 'system') {
                    classes.push('theme-' + theme);
                  } else {
                    classes.push('theme-light');
                  }
                  if (path.startsWith('/superadmin') || pattern === 'topography' || !pattern) {
                    classes.push('bg-pattern-topography');
                  } else if (pattern === 'gradient' || pattern === 'emerald') {
                    classes.push('bg-pattern-gradient');
                  }
                } else {
                  classes.push('theme-dark');
                }
                document.documentElement.className = classes.join(' ');
              } catch (e) {}
            })()
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
