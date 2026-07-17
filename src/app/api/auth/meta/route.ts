import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (!appId || appId === "your_meta_app_id") {
    // Si no está configurado, simulamos o avisamos
    return NextResponse.json({ error: "META_APP_ID no está configurado en .env.local" }, { status: 400 });
  }

  const redirectUri = `${appUrl}/api/auth/meta/callback`;
  
  // Permisos requeridos para leer posts, publicar, y acceder a Instagram
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_messages",
    "pages_messaging"
  ].join(",");

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
