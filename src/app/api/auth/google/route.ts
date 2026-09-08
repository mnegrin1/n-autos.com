import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target") || "admin";

  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    const { data: config } = await (supabase.from("google_config") as any).select("*").single();
    if (config?.clientId) {
      clientId = config.clientId;
    }
  }

  if (!clientId) {
    const redirectErrorUrl = target === "superadmin" ? "/superadmin/calendar?error=config_missing" : "/admin/calendar?error=config_missing";
    return NextResponse.redirect(new URL(redirectErrorUrl, request.url));
  }

  // Usar el origin actual o fallback a localhost:3000
  const origin = request.nextUrl.origin;
  const redirectUri = origin.includes("localhost")
    ? "http://localhost:3000/api/auth/google/callback"
    : `${origin}/api/auth/google/callback`;

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: target,
    }).toString();

  return NextResponse.redirect(authUrl);
}
