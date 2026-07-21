import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (!appId || appId === "your_meta_app_id") {
    return NextResponse.json({ error: "META_APP_ID no está configurado en .env.local" }, { status: 400 });
  }

  const redirectUri = `${appUrl}/api/auth/meta/callback`;
  const state = "instagram";

  // Permisos para Instagram Business Login (nueva API "Instagram API with Instagram login")
  // Estos son los permisos del nuevo sistema, distintos a los de Facebook Login clásico
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
  ].join(",");

  // Usar facebook.com/dialog/oauth con los scopes de Instagram Business
  // Meta unificó el OAuth endpoint — el configId determina qué producto/permisos se usan
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;

  return NextResponse.redirect(authUrl);
}
