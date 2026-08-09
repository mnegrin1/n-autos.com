import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignedToken } from "@/lib/sessionToken";

// Subdominios reservados que no se consideran clientes / automotoras
const RESERVED_SUBDOMAINS = new Set([
  "prueba",
  "www",
  "admin",
  "superadmin",
  "api",
  "app",
  "portal",
  "doc",
  "n-sistemas",
  "n-autos",
  "localhost",
]);

export default async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const host = request.headers.get("host") || request.nextUrl.hostname || "";
    const hostname = host.split(":")[0].toLowerCase();

    // Extraer subdominio si estamos en *.n-sistemas.com o *.localhost
    let subdomain: string | null = null;
    if (hostname.endsWith(".n-sistemas.com")) {
      const parts = hostname.split(".n-sistemas.com")[0].split(".");
      subdomain = parts[parts.length - 1];
    } else if (hostname.endsWith(".localhost")) {
      const parts = hostname.split(".localhost")[0].split(".");
      subdomain = parts[parts.length - 1];
    }

    const isReserved = !subdomain || RESERVED_SUBDOMAINS.has(subdomain);

    // 1. Proteger rutas administrativas (/admin)
    if (path.startsWith("/admin") && path !== "/admin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let isValid = false;

      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.email && decoded.role) {
            const rolesValidos = ["admin", "manager", "agent"];
            if (rolesValidos.includes(decoded.role)) {
              isValid = true;
            }
          }
        } catch {
          isValid = false;
        }
      }

      if (!isValid) {
        const loginUrl = new URL("/admin/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("admin-session");
        return response;
      }
    }

    // 2. Redirigir si ya está autenticado e intenta ir a login
    if (path === "/admin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let hasSession = false;

      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && decoded.id && decoded.role) {
            hasSession = true;
          }
        } catch {}
      }

      if (hasSession) {
        const adminUrl = new URL("/admin", request.url);
        return NextResponse.redirect(adminUrl);
      }
    }

    // 3. Enrutamiento dinámico para subdominios y dominios personalizados (ej: carmax.n-sistemas.com o www.automotoracarmax.com)
    let effectiveTenant: string | null = null;

    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      effectiveTenant = subdomain;
    } else if (!subdomain && hostname.includes(".") && !hostname.endsWith("n-sistemas.com") && !hostname.endsWith("localhost") && hostname !== "127.0.0.1") {
      // Es un dominio personalizado de un cliente (Fase 2)
      effectiveTenant = await resolveCustomDomain(hostname);
    }

    if (effectiveTenant) {
      // Ignorar llamadas a admin, superadmin, api, portal o doc
      if (
        !path.startsWith("/admin") &&
        !path.startsWith("/superadmin") &&
        !path.startsWith("/api") &&
        !path.startsWith("/portal") &&
        !path.startsWith("/doc")
      ) {
        const url = request.nextUrl.clone();
        url.pathname = `/portal/${effectiveTenant}${path === "/" ? "" : path}`;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-tenant-subdomain", effectiveTenant);

        return NextResponse.rewrite(url, {
          request: {
            headers: requestHeaders,
          },
        });
      }
    }

    const response = NextResponse.next();
    if (effectiveTenant) {
      response.headers.set("x-tenant-subdomain", effectiveTenant);
    }
    return response;
  } catch (err: any) {
    console.error("CRITICAL MIDDLEWARE ERROR:", err);
    if (err && err.stack) {
      console.error(err.stack);
    }
    return new Response("Internal Middleware Error: " + (err?.message || err), { status: 500 });
  }
}

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const domainVariants = [
    hostname,
    hostname.startsWith("www.") ? hostname.replace(/^www\./, "") : `www.${hostname}`
  ];

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/agencies?select=subdomain&custom_domain=in.(${domainVariants.join(",")})&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].subdomain) {
      return data[0].subdomain;
    }
  } catch (e) {
    console.error("Error resolving custom domain in middleware:", e);
  }
  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
