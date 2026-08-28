"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, PlusCircle, Car, Share2 } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // No mostrar la barra flotante en pantallas de login/invitación
  if (pathname === "/admin/login" || pathname === "/admin/accept-invite") {
    return null;
  }

  const items = [
    {
      label: "Mensajes",
      href: "/admin/inbox",
      icon: MessageSquare,
      active: pathname.startsWith("/admin/inbox")
    },
    {
      label: "+ Cargar",
      href: "/admin/vehicles?action=new",
      icon: PlusCircle,
      active: false,
      highlight: true
    },
    {
      label: "Inventario",
      href: "/admin/vehicles",
      icon: Car,
      active: pathname === "/admin/vehicles"
    },
    {
      label: "Publicaciones",
      href: "/admin/publications",
      icon: Share2,
      active: pathname.startsWith("/admin/publications")
    }
  ];

  return (
    <div 
      className="pwa-mobile-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "var(--surface-color, #0f172a)",
        borderTop: "1px solid var(--border-color, #1e293b)",
        display: "none", // Se habilita mediante CSS en pantallas móviles (<768px)
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 999,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.25)"
      }}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        if (item.highlight) {
          return (
            <Link
              key={idx}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                marginTop: "-14px"
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary, #2563eb)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.45)",
                  border: "3px solid var(--surface-color, #0f172a)"
                }}
              >
                <Icon size={24} />
              </div>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary, #2563eb)", marginTop: "2px" }}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={idx}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              color: item.active ? "var(--primary, #2563eb)" : "var(--text-color, #94a3b8)",
              gap: "2px",
              flex: 1,
              height: "100%"
            }}
          >
            <Icon size={20} style={{ opacity: item.active ? 1 : 0.7 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: item.active ? 700 : 500 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
