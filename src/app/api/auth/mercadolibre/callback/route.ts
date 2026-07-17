
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const isMock = searchParams.get("mock") === "true";

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Si no se encuentra el código de autorización
  if (!code) {
    return NextResponse.redirect(new URL("/admin/integrations?status=error&error=no_code", request.url));
  }

  try {
    let username = "Automotora Demo ML";
    let token = "APP_USR-mock-token-123456789";
    let refreshToken = "TG-mock-refresh-token-123456789";
    let expiresAt = Date.now() + 6 * 3600 * 1000; // 6 horas

    const isRealOAuth = appId && secretKey && !isMock;

    if (isRealOAuth) {
      // 1. Intercambio de código real con la API de MercadoLibre
      const response = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: appId,
          client_secret: secretKey,
          code: code,
          redirect_uri: `${appUrl}/api/auth/mercadolibre/callback`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error exchanging OAuth code on ML:", data);
        throw new Error(data.message || "Error intercambiando el código de autorización");
      }

      token = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = Date.now() + (data.expires_in * 1000);
      username = `Vendedor ML (ID: ${data.user_id})`;
    } else {
      console.log("Conexión en modo simulación local. Generando tokens mock...");
    }

    // 2. Guardar las credenciales en la base de datos de Supabase
    const { error: dbError } = await (supabase as any)
      .from("auto_integrations")
      .upsert({
        agency_id: "demo-agency-id",
        channel: "mercadolibre",
        connected: true,
        username: username,
        token: token,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        mode: isRealOAuth ? "production" : "simulation",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "channel"
      });

    if (dbError) {
      console.error("Error saving integration to Supabase:", dbError);
      throw new Error(dbError.message || "Error al persistir la integración en base de datos");
    }

    // 3. Redirigir con éxito
    return NextResponse.redirect(new URL("/admin/integrations?status=success", request.url));
  } catch (error: any) {
    console.error("Error en callback de autenticación:", error);
    return NextResponse.redirect(
      new URL(`/admin/integrations?status=error&error=${encodeURIComponent(error.message || "auth_failed")}`, request.url)
    );
  }
}
