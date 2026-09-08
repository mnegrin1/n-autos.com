import { NextRequest, NextResponse } from "next/server";
import { saveSuperadminGoogleAuthAsync } from "@/lib/superadminCalendarStore";
import { syncGoogleEventsAction } from "@/actions/superadminCalendarActions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/superadmin/calendar?error=${error || "no_code"}`, request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/superadmin/calendar?error=google_credentials_missing", request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google-calendar/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Error exchanging code for Google Calendar token:", tokenData);
      return NextResponse.redirect(
        new URL(
          `/superadmin/calendar?error=${encodeURIComponent(tokenData.error_description || tokenData.error || "token_error")}`,
          request.url
        )
      );
    }

    // Obtener email del usuario para mostrarlo en el panel
    let userEmail = "";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        userEmail = userData.email || "";
      }
    } catch (e) {
      console.warn("No se pudo obtener el email de Google userinfo:", e);
    }

    // Guardar tokens y estado en el store persistente del Superadmin (Supabase auto_integrations)
    await saveSuperadminGoogleAuthAsync({
      connected: true,
      email: userEmail,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: Date.now() + (tokenData.expires_in || 3600) * 1000,
    });

    // Sincronizar automáticamente eventos de Google Calendar de inmediato
    let importedCount = 0;
    try {
      const syncRes = await syncGoogleEventsAction();
      if (syncRes.success && typeof syncRes.count === "number") {
        importedCount = syncRes.count;
      }
    } catch (syncErr) {
      console.warn("Aviso en auto-sincronización tras conectar Google:", syncErr);
    }

    return NextResponse.redirect(
      new URL(
        `/superadmin/calendar?success=google_connected&synced=true&count=${importedCount}`,
        request.url
      )
    );
  } catch (err: any) {
    console.error("Error en callback de Google Calendar:", err);
    return NextResponse.redirect(
      new URL("/superadmin/calendar?error=auth_exception", request.url)
    );
  }
}
