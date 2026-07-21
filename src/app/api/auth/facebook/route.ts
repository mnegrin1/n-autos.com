import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (!appId || appId === "your_meta_app_id") {
    return NextResponse.json({ error: "META_APP_ID no está configurado en .env.local" }, { status: 400 });
  }

  const redirectUri = `${appUrl}/api/auth/meta/callback`;
  const state = "facebook";
  
  // Permisos para Facebook
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_messaging"
  ].join(",");

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;

  return NextResponse.redirect(authUrl);
}
