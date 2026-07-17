import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const isMock = searchParams.get("mock") === "true";

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/integrations?status=error&error=no_code", request.url));
  }

  try {
    if (!appId || !secretKey) {
      throw new Error("Faltan credenciales de MercadoLibre en el entorno.");
    }

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
      const errorDetail = data.error ? `${data.error}: ${data.message}` : data.message || "Error intercambiando el código";
      throw new Error(`ML_API_ERROR|${errorDetail}`);
    }

    const token = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresAt = Date.now() + (data.expires_in * 1000);
    let username = `Vendedor ML (ID: ${data.user_id})`;

    try {
      const userRes = await fetch("https://api.mercadolibre.com/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        username = userData.nickname || userData.first_name || username;
      }
    } catch (err) {
      console.error("Error al obtener nickname de MercadoLibre:", err);
    }

    // 2. Guardar las credenciales en Supabase auto_integrations
    const { supabase } = await import("@/lib/supabase");
    const { error: supaError } = await (supabase.from("auto_integrations") as any)
      .upsert({
        channel: "mercadolibre",
        agency_id: "demo-agency-id",
        connected: true,
        username: username,
        token: token,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        mode: "production",
        updated_at: new Date().toISOString()
      }, { onConflict: "channel" });
      
    if (supaError) {
      console.error("Error saving ML integration to Supabase:", supaError);
      throw new Error("Error al guardar integración en base de datos.");
    } else {
      console.log("Integración de ML guardada en Supabase correctamente.");
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
