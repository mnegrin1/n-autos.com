import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignedToken, getWorkspaceCode } from "@/lib/sessionToken";
import { isSuperAdmin } from "@/lib/iam/rbac";
import { isAgencyDeleted } from "@/lib/deletedAgenciesStore";

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

// Rutas reservadas dentro de admin para no confundir con workspace codes
const ADMIN_RESERVED_ROUTES = new Set([
  "login",
  "accept-invite",
  "api",
  "_next",
  "admin",
  "superadmin",
  "portal",
  "doc",
  "favicon.ico",
  "icon.png",
  "manifest.webmanifest",
  "sw.js",
]);

// Rutas / páginas conocidas del panel de administración
const ADMIN_KNOWN_ROUTES = new Set([
  "vehicles",
  "crm",
  "inbox",
  "agenda",
  "website",
  "settings",
  "automations",
  "publications",
  "integrations",
  "email",
  "calendar",
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
      const sessionToken = request.cookies.get("admin-session")?.value;
      let decoded: any = null;
      let isValid = false;

      if (sessionToken) {
        try {
          decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.role) {
            const rolesValidos = ["admin", "manager", "agent", "superadmin", "Superadmin"];
            if (rolesValidos.includes(decoded.role) || isSuperAdmin(decoded)) {
              isValid = true;
            }
          }
        } catch {
          isValid = false;
        }
      }

      if (isValid && decoded && !isSuperAdmin(decoded) && isAgencyDeleted(decoded.agency_id, decoded.subdomain, decoded.email)) {
        const loginUrl = new URL("/login?error=org_deleted", request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("admin-session");
        return response;
      }

      const workspaceCode = isValid && decoded
        ? (decoded.workspace_code || await getWorkspaceCode(decoded.agency_id, decoded.id, decoded.email))
        : null;

      const cleanPath = path.replace(/^\/+|\/+$/g, "");
      const segments = cleanPath ? cleanPath.split("/") : [];
      const firstSegment = segments[0] || "";

      // Caso 1: El usuario entra a la raíz de admin.n-autos.com
      if (!cleanPath || cleanPath === "") {
        if (!isValid || !workspaceCode) {
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        } else {
          const wsUrl = new URL(`/${workspaceCode}`, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }
      }

      // Caso 2: El usuario visita /login o /admin/login
      if (cleanPath === "login" || cleanPath === "admin/login") {
        if (isValid && workspaceCode) {
          const wsUrl = new URL(`/${workspaceCode}`, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.rewrite(url);
      }

      // Caso 3: El usuario visita /accept-invite
      if (cleanPath === "accept-invite" || cleanPath.startsWith("accept-invite/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/admin/${cleanPath}`;
        return NextResponse.rewrite(url);
      }

      // Caso 4: Rutas que entran con /admin/... explícito (redirigir al espacio único)
      if (firstSegment === "admin") {
        if (!isValid || !workspaceCode) {
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
        const restPath = segments.slice(1).join("/");
        const target = restPath ? `/${workspaceCode}/${restPath}` : `/${workspaceCode}`;
        const wsUrl = new URL(target, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      }

      // Caso 5: Subruta administrativa conocida accedida sin workspace code (ej: /vehicles o /crm)
      if (ADMIN_KNOWN_ROUTES.has(firstSegment)) {
        if (!isValid || !workspaceCode) {
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
        const wsUrl = new URL(`/${workspaceCode}/${cleanPath}`, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      }

      // Caso 6: Subruta con Workspace Code (ej: /<workspaceCode> o /<workspaceCode>/vehicles)
      if (!ADMIN_RESERVED_ROUTES.has(firstSegment) && !firstSegment.includes(".")) {
        if (!isValid) {
          const loginUrl = new URL("/login", request.url);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete("admin-session");
          return response;
        }

        // Si el usuario no es superadmin y el código de la URL no coincide con su workspace activo,
        // redirigir automáticamente a su código real asegurando la sesión (evita 404 o desincronización)
        if (!isSuperAdmin(decoded) && workspaceCode && firstSegment !== workspaceCode) {
          const subRoute = segments.slice(1).join("/");
          const target = subRoute ? `/${workspaceCode}/${subRoute}` : `/${workspaceCode}`;
          const wsUrl = new URL(target, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }

        const subRoute = segments.slice(1).join("/");
        const internalPath = subRoute ? `/admin/${subRoute}` : `/admin`;

        const url = request.nextUrl.clone();
        url.pathname = internalPath;
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-workspace-code", firstSegment);
        return NextResponse.rewrite(url, {
          request: {
            headers: requestHeaders,
          },
        });
      }

      // Fallback para cualquier otra ruta no reconocida dentro de admin.n-autos.com (previene 404)
      if (isValid && workspaceCode) {
        const wsUrl = new URL(`/${workspaceCode}`, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      } else {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
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
          if (decoded && typeof decoded === "object" && decoded.id) {
            if (isSuperAdmin(decoded)) {
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
          if (decoded && isSuperAdmin(decoded)) {
            isAlreadySuperAdmin = true;
          }
        } catch {}
      }

      if (isAlreadySuperAdmin) {
        const superAdminDashboardUrl = new URL("/superadmin", request.url);
        return NextResponse.redirect(superAdminDashboardUrl);
      }
    }

    // 2. Proteger rutas administrativas (/admin) y soportar URLs únicas con Workspace Code
    if (path.startsWith("/admin")) {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let decoded: any = null;
      let isValid = false;

      if (sessionToken) {
        try {
          decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.role) {
            const rolesValidos = ["admin", "manager", "agent", "superadmin", "Superadmin"];
            if (rolesValidos.includes(decoded.role) || isSuperAdmin(decoded)) {
              isValid = true;
            }
          }
        } catch {
          isValid = false;
        }
      }

      if (isValid && decoded && !isSuperAdmin(decoded) && isAgencyDeleted(decoded.agency_id, decoded.subdomain, decoded.email)) {
        const loginUrl = new URL("/admin/login?error=org_deleted", request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("admin-session");
        return response;
      }

      const workspaceCode = isValid && decoded
        ? (decoded.workspace_code || await getWorkspaceCode(decoded.agency_id, decoded.id, decoded.email))
        : null;

      const subAdmin = path.replace(/^\/admin\/?/, "");
      const segments = subAdmin ? subAdmin.split("/") : [];
      const firstSegment = segments[0] || "";

      // Caso A: /admin raíz
      if (!subAdmin || subAdmin === "") {
        if (!isValid || !workspaceCode) {
          const loginUrl = new URL("/admin/login", request.url);
          return NextResponse.redirect(loginUrl);
        } else {
          const wsUrl = new URL(`/admin/${workspaceCode}`, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }
      }

      // Caso B: /admin/login
      if (subAdmin === "login") {
        if (isValid && workspaceCode) {
          const wsUrl = new URL(`/admin/${workspaceCode}`, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }
        return NextResponse.next();
      }

      // Caso C: /admin/accept-invite
      if (subAdmin === "accept-invite" || subAdmin.startsWith("accept-invite/")) {
        return NextResponse.next();
      }

      // Caso D: subruta conocida accedida directamente sin workspaceCode (ej: /admin/vehicles o /admin/crm)
      if (ADMIN_KNOWN_ROUTES.has(firstSegment)) {
        if (!isValid || !workspaceCode) {
          const loginUrl = new URL("/admin/login", request.url);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete("admin-session");
          return response;
        }
        const wsUrl = new URL(`/admin/${workspaceCode}/${subAdmin}`, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      }

      // Caso E: subruta con Workspace Code (ej: /admin/<workspaceCode> o /admin/<workspaceCode>/vehicles)
      if (!ADMIN_RESERVED_ROUTES.has(firstSegment) && !firstSegment.includes(".")) {
        if (!isValid) {
          const loginUrl = new URL("/admin/login", request.url);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete("admin-session");
          return response;
        }

        // Si el usuario no es superadmin y el código de la URL no coincide con su workspace activo,
        // redirigir automáticamente a su código real asegurando la sesión (evita 404 o desincronización)
        if (!isSuperAdmin(decoded) && workspaceCode && firstSegment !== workspaceCode) {
          const subRoute = segments.slice(1).join("/");
          const target = subRoute ? `/admin/${workspaceCode}/${subRoute}` : `/admin/${workspaceCode}`;
          const wsUrl = new URL(target, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        }

        const subRoute = segments.slice(1).join("/");
        const internalPath = subRoute ? `/admin/${subRoute}` : `/admin`;

        const url = request.nextUrl.clone();
        url.pathname = internalPath;
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-workspace-code", firstSegment);
        return NextResponse.rewrite(url, {
          request: {
            headers: requestHeaders,
          },
        });
      }

      // Fallback para cualquier otra ruta no reconocida dentro de /admin (previene 404)
      if (isValid && workspaceCode) {
        const wsUrl = new URL(`/admin/${workspaceCode}`, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      } else {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // 2b. Manejo de /login global cuando no se está en el subdominio admin (ej: localhost:3000/login o n-autos.com/login)
    if (path === "/login" || path === "/login/") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let decoded: any = null;
      let isValid = false;
      if (sessionToken) {
        try {
          decoded = await verifySignedToken(sessionToken);
          if (decoded && typeof decoded === "object" && decoded.id && decoded.role) {
            isValid = true;
          }
        } catch {}
      }
      const workspaceCode = isValid && decoded
        ? (decoded.workspace_code || await getWorkspaceCode(decoded.agency_id, decoded.id, decoded.email))
        : null;

      if (isValid && workspaceCode) {
        const wsUrl = new URL(`/admin/${workspaceCode}`, request.url);
        wsUrl.search = request.nextUrl.search;
        return NextResponse.redirect(wsUrl);
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.search = request.nextUrl.search;
      return NextResponse.redirect(loginUrl);
    }

    // 2c. En entorno de desarrollo (localhost o 127.0.0.1): si se accede a un workspace code en la raíz
    // (ej: http://localhost:3000/<workspaceCode> o http://localhost:3000/<workspaceCode>/vehicles)
    const isLocalhostHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
    if (isLocalhostHost && !subdomain) {
      const cleanRoot = path.replace(/^\/+|\/+$/g, "");
      const rootSegments = cleanRoot ? cleanRoot.split("/") : [];
      const rootFirst = rootSegments[0] || "";

      const ROOT_RESERVED_ROUTES = new Set([
        "",
        "admin",
        "superadmin",
        "registro",
        "portal",
        "doc",
        "privacidad",
        "terminos",
        "test",
        "api",
        "_next",
        "favicon.ico",
        "icon.png",
        "manifest.webmanifest",
        "sw.js",
      ]);

      if (rootFirst && !ROOT_RESERVED_ROUTES.has(rootFirst) && !rootFirst.includes(".")) {
        const sessionToken = request.cookies.get("admin-session")?.value;
        let decoded: any = null;
        let isValid = false;
        if (sessionToken) {
          try {
            decoded = await verifySignedToken(sessionToken);
            if (decoded && typeof decoded === "object" && decoded.id && decoded.role) {
              isValid = true;
            }
          } catch {}
        }
        const workspaceCode = isValid && decoded
          ? (decoded.workspace_code || await getWorkspaceCode(decoded.agency_id, decoded.id, decoded.email))
          : null;

        if (isValid && workspaceCode) {
          const subRoute = rootSegments.slice(1).join("/");
          const target = subRoute ? `/admin/${workspaceCode}/${subRoute}` : `/admin/${workspaceCode}`;
          const wsUrl = new URL(target, request.url);
          wsUrl.search = request.nextUrl.search;
          return NextResponse.redirect(wsUrl);
        } else {
          const loginUrl = new URL("/admin/login", request.url);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete("admin-session");
          return response;
        }
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
