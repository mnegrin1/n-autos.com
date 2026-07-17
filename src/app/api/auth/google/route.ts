import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: config } = await (supabase.from("google_config") as any).select("*").single();

  if (!config || !config.clientId) {
    return NextResponse.redirect(
      new URL("/admin/calendar?error=config_missing", "http://localhost:3000")
    );
  }

  const redirectUri = "http://localhost:3000/api/auth/google/callback";
  
  // URL de autorización de Google para OAuth 2.0
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent"
    }).toString();

  return NextResponse.redirect(authUrl);
}
