export const runtime = "edge";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/localDb";

export async function GET() {
  const db = getDb();
  const config = db.google_config;

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