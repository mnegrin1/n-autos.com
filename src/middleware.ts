import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    // Proteger rutas administrativas
    if (path.startsWith("/admin") && path !== "/admin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let isValid = false;

      if (sessionToken) {
        try {
          // En entorno local de desarrollo, decodificamos el token base64 y validamos su estructura.
          // NOTA DE SEGURIDAD PARA PRODUCCIÓN:
          // En producción (con Supabase o JWT), se debe validar la firma criptográfica del token 
          // usando una librería como 'jose' o llamando a supabase.auth.getUser() para evitar spoofing.
          const decodedString = atob(sessionToken);
          const decoded = JSON.parse(decodedString);

          if (decoded && typeof decoded === "object" && decoded.id && decoded.email && decoded.role) {
            const rolesValidos = ["admin", "manager", "agent"];
            if (rolesValidos.includes(decoded.role)) {
              isValid = true;
            }
          }
        } catch {
          // El token no es base64 válido o no es un JSON estructurado correcto
          isValid = false;
        }
      }

      if (!isValid) {
        const loginUrl = new URL("/admin/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        // Borrar la cookie corrupta o inválida
        response.cookies.delete("admin-session");
        return response;
      }
    }

    // Redirigir si ya está autenticado e intenta ir a login
    if (path === "/admin/login") {
      const sessionToken = request.cookies.get("admin-session")?.value;
      let hasSession = false;

      if (sessionToken) {
        try {
          const decodedString = atob(sessionToken);
          const decoded = JSON.parse(decodedString);
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

    return NextResponse.next();
  } catch (err: any) {
    console.error("CRITICAL MIDDLEWARE ERROR:", err);
    if (err && err.stack) {
      console.error(err.stack);
    }
    return new Response("Internal Middleware Error: " + (err?.message || err), { status: 500 });
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
