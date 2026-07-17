import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/meta/callback`;

  if (error) {
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=no_code`);
  }

  try {
    // 1. Intercambiar code por User Access Token corto
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }
    
    const shortLivedToken = tokenData.access_token;

    // 2. Intercambiar por Long-Lived User Access Token
    const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    const longLivedData = await longLivedRes.json();
    
    const longLivedToken = longLivedData.access_token || shortLivedToken;

    // 3. Obtener las páginas del usuario (para obtener el Page Access Token y el ID de Instagram)
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=no_pages_found`);
    }

    // Por defecto tomamos la primera página (en un sistema robusto, deberíamos dejar al usuario elegir si tiene varias)
    const page = pagesData.data[0];
    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;
    
    // Guardar en Supabase para Facebook
    await (supabase as any).from("auto_integrations").upsert({
      channel: "facebook",
      agency_id: "demo-agency-id",
      connected: true,
      username: pageName, // Usamos username para el nombre
      token: pageAccessToken, // Importante: Guardamos el Page Access Token, no el User Token
      refresh_token: pageId, // Hack temporal: guardamos el pageId aquí para poder usarlo luego si lo necesitamos
      updated_at: new Date().toISOString()
    }, { onConflict: "channel" });

    // Si la página tiene una cuenta de Instagram vinculada, la conectamos también
    if (page.instagram_business_account) {
      const igId = page.instagram_business_account.id;
      
      // Obtener el handle de Instagram
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=username&access_token=${pageAccessToken}`);
      const igData = await igRes.json();
      const igUsername = igData.username || igId;

      await (supabase as any).from("auto_integrations").upsert({
        channel: "instagram",
        agency_id: "demo-agency-id",
        connected: true,
        username: igUsername,
        token: pageAccessToken, // IG Graph API usa el Page Access Token
        refresh_token: igId, // Guardamos el IG Account ID
        updated_at: new Date().toISOString()
      }, { onConflict: "channel" });
    }

    return NextResponse.redirect(`${appUrl}/admin/integrations?success=meta_connected`);
    
  } catch (err: any) {
    console.error("Error en Meta Callback:", err);
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=meta_callback_failed`);
  }
}
