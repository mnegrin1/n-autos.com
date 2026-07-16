import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/localDb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/calendar?error=${error || "no_code"}`, request.url)
    );
  }

  const db = getDb();
  const config = db.google_config;

  if (!config || !config.clientId || !config.clientSecret) {
    return NextResponse.redirect(
      new URL("/admin/calendar?error=config_missing", request.url)
    );
  }

  const redirectUri = "http://localhost:3000/api/auth/google/callback";

  try {
    // Intercambiar código por Token de Acceso y Refresh Token
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error("Error exchanging token:", data.error_description || data.error);
      return NextResponse.redirect(
        new URL(`/admin/calendar?error=${data.error}`, request.url)
      );
    }

    // Actualizar configuración en base de datos local
    config.accessToken = data.access_token;
    config.refreshToken = data.refresh_token || config.refreshToken; // A veces no devuelve refresh token si no es la primera vez
    config.tokenExpiry = Date.now() + data.expires_in * 1000;

    db.google_config = config;
    saveDb(db);

    return NextResponse.redirect(
      new URL("/admin/calendar?success=google_connected", request.url)
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/admin/calendar?error=auth_failed`, request.url)
    );
  }
}
