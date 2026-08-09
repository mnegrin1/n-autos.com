import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    const { data: config } = await (supabase.from("google_config") as any).select("*").single();
    if (config?.clientId) {
      clientId = config.clientId;
    }
  }

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/admin/login?error=google_not_configured", request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google-login/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    }).toString();

  return NextResponse.redirect(authUrl);
}
