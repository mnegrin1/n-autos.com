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
    const hostHeader = request.headers.get("host")?.split(",")[0].trim();
    const forwardedHostHeader = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
    const originalHostHeader = request.headers.get("x-original-host")?.split(",")[0].trim();
    const nextHostname = request.nextUrl.hostname;

    const candidates = [forwardedHostHeader, originalHostHeader, hostHeader, nextHostname].filter(Boolean) as string[];

    // Priorizar cualquier candidato que contenga explícitamente un subdominio (.n-autos.com o .localhost)
    const subdominantCandidate = candidates.find((c) => {
      const h = c.split(":")[0].toLowerCase();
      return h.endsWith(".n-autos.com") || h.endsWith(".localhost");
    });

    const rawHost = subdominantCandidate || candidates[0] || "";
    const hostname = rawHost.split(":")[0].toLowerCase();

    // Extraer subdominio si estamos en *.n-autos.com o *.localhost
    let subdomain: string | null = null;
    if (hostname.endsWith(".n-autos.com")) {
      const prefix = hostname.slice(0, -".n-autos.com".length);
      const parts = prefix.split(".");
      subdomain = parts[parts.length - 1] || null;
    } else if (hostname.endsWith(".localhost")) {
      const prefix = hostname.slice(0, -".localhost".length);
      const parts = prefix.split(".");
      subdomain = parts[parts.length - 1] || null;
    }

    const isReserved = !subdomain || RESERVED_SUBDOMAINS.has(subdomain);

    // 0. Manejo de subdominio admin (admin.n-autos.com o admin.localhost)
    if (subdomain === "admin") {
      let targetPath = path;
      if (path === "/") {
        targetPath = "/admin";
      } else if (!path.startsWith("/admin") && !path.startsWith("/api") && !path.startsWith("/_next") && !path.includes(".")) {
        targetPath = `/admin${path}`;
      }

      // Verificación de autenticación para admin
      if (targetPath.startsWith("/admin") && targetPath !== "/admin/login" && targetPath !== "/admin/accept-invite") {
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

      // Redirigir si ya tiene sesión e intenta ir a login
      if (targetPath === "/admin/login") {
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

      if (targetPath !== path) {
        const url = request.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.rewrite(url);
      }
    }

    // 0b. Manejo de subdominio superadmin (superadmin.n-autos.com o superadmin.localhost)
    if (subdomain === "superadmin") {
      let targetPath = path;
      if (path === "/") {
        targetPath = "/superadmin";
      } else if (!path.startsWith("/superadmin") && !path.startsWith("/api") && !path.startsWith("/_next") && !path.includes(".")) {
        targetPath = `/superadmin${path}`;
      }

      if (targetPath !== path) {
        const url = request.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.rewrite(url);
      }
    }


    // 1. Proteger rutas globales de Superadmin (/superadmin) excepto /superadmin/login
    if (path.startsWith("/superadmin") && path !== "/superadmin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let isSuperAdminValid = false;

      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.email && decoded.role) {
            const isSuperAdminRole = decoded.role === "superadmin" || decoded.role === "Superadmin";
            const isSuperAdminEmail = decoded.email.toLowerCase() === "mauricio.negrin@n-sistemas.com";
            if (isSuperAdminRole || isSuperAdminEmail) {
              isSuperAdminValid = true;
            }
          }
        } catch {
          isSuperAdminValid = false;
        }
      }

      if (!isSuperAdminValid) {
        const loginUrl = new URL("/superadmin/login?error=superadmin_required", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // 1b. Redirigir a /superadmin si el Superadmin ya tiene sesión e intenta entrar a /superadmin/login
    if (path === "/superadmin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let isAlreadySuperAdmin = false;
      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && (decoded.role === "superadmin" || decoded.role === "Superadmin" || decoded.email?.toLowerCase() === "mauricio.negrin@n-sistemas.com")) {
            isAlreadySuperAdmin = true;
          }
        } catch {}
      }

      if (isAlreadySuperAdmin) {
        const superAdminDashboardUrl = new URL("/superadmin", request.url);
        return NextResponse.redirect(superAdminDashboardUrl);
      }
    }

    // 2. Proteger rutas administrativas (/admin) excepto login y accept-invite
    if (path.startsWith("/admin") && path !== "/admin/login" && path !== "/admin/accept-invite") {

      const sessionToken = request.cookies.get("admin-session")?.value;
      let isValid = false;

      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.email && decoded.role) {
            const rolesValidos = ["admin", "manager", "agent", "superadmin", "Superadmin"];
            if (rolesValidos.includes(decoded.role) || decoded.email.toLowerCase() === "mauricio.negrin@n-sistemas.com") {
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

    // 3. Redirigir si ya está autenticado e intenta ir a login
    if (path === "/admin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let hasSession = false;
      let isSuperAdmin = false;

      if (sessionToken) {
        try {
          const decoded = await verifySignedToken(sessionToken);
          if (decoded && decoded.id && decoded.role) {
            hasSession = true;
            if (decoded.role === "superadmin" || decoded.role === "Superadmin" || decoded.email?.toLowerCase() === "mauricio.negrin@n-sistemas.com") {
              isSuperAdmin = true;
            }
          }
        } catch {}
      }

      if (hasSession) {
        const targetUrl = new URL(isSuperAdmin ? "/superadmin" : "/admin", request.url);
        return NextResponse.redirect(targetUrl);
      }
    }

    // 3. Enrutamiento dinámico para subdominios y dominios personalizados (ej: carmax.n-autos.com o www.automotoracarmax.com)
    let effectiveTenant: string | null = null;

    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      effectiveTenant = subdomain;
    } else if (!subdomain && hostname.includes(".") && !hostname.endsWith("n-autos.com") && !hostname.endsWith("localhost") && hostname !== "127.0.0.1") {
      // Es un dominio personalizado de un cliente (Fase 2)
      effectiveTenant = await resolveCustomDomain(hostname);
    }

    if (effectiveTenant) {
      // Redirigir a URL limpia si se intenta ingresar con /portal/[tenant] explícito en el navegador
      if (path.startsWith(`/portal/${effectiveTenant}`)) {
        const cleanPath = path.replace(new RegExp(`^/portal/${effectiveTenant}`), "") || "/";
        const cleanUrl = new URL(cleanPath, request.url);
        return NextResponse.redirect(cleanUrl);
      }

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
