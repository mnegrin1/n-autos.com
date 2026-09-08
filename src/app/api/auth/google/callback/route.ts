import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { saveSuperadminGoogleAuth } from "@/lib/superadminCalendarStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state") || "admin";

  const isSuperadmin = state === "superadmin";
  const errorRedirectBase = isSuperadmin ? "/superadmin/calendar" : "/admin/calendar";

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}?error=${error || "no_code"}`, request.url)
    );
  }

  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const { data: config } = await (supabase.from("google_config") as any).select("*").single();
    if (config?.clientId && config?.clientSecret) {
      clientId = clientId || config.clientId;
      clientSecret = clientSecret || config.clientSecret;
    }
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}?error=config_missing`, request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = origin.includes("localhost")
    ? "http://localhost:3000/api/auth/google/callback"
    : `${origin}/api/auth/google/callback`;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error("Error intercambiando token en callback:", data);
      return NextResponse.redirect(
        new URL(`${errorRedirectBase}?error=${data.error}`, request.url)
      );
    }

    // Obtener email del usuario conectado
    let userEmail = "";
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const uData = await userRes.json();
        userEmail = uData.email || "";
      }
    } catch (e) {}

    if (isSuperadmin) {
      // Guardar en el store del Superadmin
      saveSuperadminGoogleAuth({
        connected: true,
        email: userEmail,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
      });

      return NextResponse.redirect(
        new URL("/superadmin/calendar?success=google_connected", request.url)
      );
    }

    // Guardar para admin de agencia en supabase google_config
    try {
      const { data: existingConfig } = await (supabase.from("google_config") as any).select("id").single();
      if (existingConfig?.id) {
        await (supabase.from("google_config") as any).update({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpiry: Date.now() + data.expires_in * 1000,
        }).eq("id", existingConfig.id);
      }
    } catch (dbErr) {
      console.warn("Aviso actualizando google_config en DB:", dbErr);
    }

    return NextResponse.redirect(
      new URL("/admin/calendar?success=google_connected", request.url)
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}?error=auth_failed`, request.url)
    );
  }
}
