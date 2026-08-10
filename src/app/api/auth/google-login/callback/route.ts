import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { registerUserSession } from "@/actions/authActions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${error || "no_code"}`, request.url)
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
      new URL("/admin/login?error=google_not_configured", request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google-login/callback`;

  try {
    // Intercambiar código por tokens de Google
    const res = await fetch("https://oauth2.googleapis.com/token", {
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

    const tokenData = await res.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Error exchanging token:", tokenData.error_description || tokenData.error);
      return NextResponse.redirect(
        new URL(`/admin/login?error=${tokenData.error || "token_error"}`, request.url)
      );
    }

    // Obtener perfil del usuario desde Google UserInfo API
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.email) {
      return NextResponse.redirect(
        new URL("/admin/login?error=google_user_not_found", request.url)
      );
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const emailPrefix = cleanEmail.split("@")[0].replace(/[^a-z0-9]/g, "-");
    const userSlug = emailPrefix || "user-" + Date.now();
    const userAgencyId = "agency-google-" + userSlug;

    // Buscar el usuario en Supabase por email o crearlo
    let dbUser = null;
    try {
      const { data: existingUser } = await (supabaseAdmin.from("users") as any)
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      dbUser = existingUser;

      if (!dbUser) {
        // Registrar la nueva organización / automotora para la cuenta de Google
        let createdAgencyId = userAgencyId;
        const agencyName = `Automotora ${googleUser.name || emailPrefix}`;

        try {
          const { data: newAgency } = await (supabaseAdmin.from("agencies") as any)
            .insert({
              name: agencyName,
              subdomain: userSlug,
              primary_color: "#10b981",
            })
            .select()
            .single();

          if (newAgency && newAgency.id) {
            createdAgencyId = newAgency.id;
          }
        } catch (agencyErr) {
          console.warn("No se pudo insertar la agencia en DB (usando fallback id):", agencyErr);
        }

        const { data: newUser } = await (supabaseAdmin.from("users") as any)
          .insert({
            email: cleanEmail,
            name: googleUser.name || cleanEmail.split("@")[0],
            role: "admin",
            agency_id: createdAgencyId,
          })
          .select()
          .single();

        dbUser = newUser;
      }
    } catch (e) {
      console.error("Error looking up/creating user in DB:", e);
    }

    // Fallback si no está en DB o falla la conexión DB
    if (!dbUser) {
      dbUser = {
        id: googleUser.id || "google-" + userSlug,
        email: cleanEmail,
        name: googleUser.name || cleanEmail,
        role: "admin",
        agency_id: userAgencyId,
      };
    }

    const finalAgencyId = (dbUser.agency_id && dbUser.agency_id !== "00000000-0000-0000-0000-000000000000") 
      ? dbUser.agency_id 
      : userAgencyId;

    // Establecer la cookie de sesión del panel
    await registerUserSession({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role || "admin",
      agency_id: finalAgencyId,
    });

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch (err) {
    console.error("Google login callback error:", err);
    return NextResponse.redirect(
      new URL("/admin/login?error=auth_failed", request.url)
    );
  }
}
