import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/localDb";

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
    let username = "Automotora Demo ML";
    let token = "APP_USR-mock-token-123456789";
    let refreshToken = "TG-mock-refresh-token-123456789";
    let expiresAt = Date.now() + 6 * 3600 * 1000;

    const isRealOAuth = appId && secretKey && !isMock;

    if (isRealOAuth) {
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

      token = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = Date.now() + (data.expires_in * 1000);
      username = `Vendedor ML (ID: ${data.user_id})`;

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
    } else {
      console.log("Conexión en modo simulación local. Generando tokens mock...");
    }

    // 2. Guardar las credenciales en la base de datos local (evitando Supabase Cloudflare 1016)
    const db = getDb();
    if (!db.integrations) {
      db.integrations = {
        mercadolibre: { connected: false },
        facebook: { connected: false },
        instagram: { connected: false },
        whatsapp: { connected: false }
      };
    }
    db.integrations.mercadolibre = {
      connected: true,
      username: username,
      token: token,
      ...(isRealOAuth ? { refresh_token: refreshToken, expires_at: expiresAt, mode: "production" } : { mode: "simulation" })
    };
    saveDb(db);

    // 3. Redirigir con éxito
    return NextResponse.redirect(new URL("/admin/integrations?status=success", request.url));
  } catch (error: any) {
    console.error("Error en callback de autenticación:", error);
    return NextResponse.redirect(
      new URL(`/admin/integrations?status=error&error=${encodeURIComponent(error.message || "auth_failed")}`, request.url)
    );
  }
}
