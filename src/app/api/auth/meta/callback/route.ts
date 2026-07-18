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

  // 1. Si hubo error en el popup de Facebook o el usuario canceló
  if (error) {
    console.error("Facebook devolvió un error en la URL:", error);
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=${error}`);
  }
  // 2. Verificar credenciales antes de continuar (¡muy importante!)
  if (!appId || !appSecret) {
    console.error("FALTA CONFIGURACIÓN: No se encontró META_APP_ID o META_APP_SECRET en el archivo .env.local");
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=missing_credentials`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=no_code`);
  }

  try {
    // 3. Intercambiar code por User Access Token corto
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error("Error en Graph API al pedir el token de acceso:", tokenData.error);
      throw new Error(tokenData.error.message);
    }
    
    const shortLivedToken = tokenData.access_token;
    
    // 4. Intercambiar por Long-Lived User Access Token
    const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    const longLivedData = await longLivedRes.json();
    
    const longLivedToken = longLivedData.access_token || shortLivedToken;
    // 5. Obtener las páginas del usuario
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();
    if (!pagesData.data || pagesData.data.length === 0) {
      console.error("ERROR DE PÁGINAS: El usuario inició sesión correctamente, pero Facebook dice que no tiene ninguna Página asociada o no le dio permisos a la aplicación para verlas.");
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=no_pages_found`);
    }
    // Por defecto tomamos la primera página
    const page = pagesData.data[0];
    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;
    
    // 6. Guardar en Supabase para Facebook capturando los errores de Base de Datos
    const { error: supaFbError } = await (supabase as any).from("auto_integrations").upsert({
      channel: "facebook",
      agency_id: "00000000-0000-0000-0000-000000000000",
      connected: true,
      username: pageName,
      token: pageAccessToken,
      refresh_token: pageId, 
      updated_at: new Date().toISOString()
    }, { onConflict: "channel" });
    if (supaFbError) {
      console.error("Error al guardar Facebook en la base de datos (Supabase):", supaFbError);
      return NextResponse.redirect(`${appUrl}/admin/integrations?error=db_error_fb`);
    }
    // 7. Si la página tiene una cuenta de Instagram vinculada, la conectamos también
    if (page.instagram_business_account) {
      const igId = page.instagram_business_account.id;
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=username&access_token=${pageAccessToken}`);
      const igData = await igRes.json();
      const igUsername = igData.username || igId;
      const { error: supaIgError } = await (supabase as any).from("auto_integrations").upsert({
        channel: "instagram",
        agency_id: "00000000-0000-0000-0000-000000000000",
        connected: true,
        username: igUsername,
        token: pageAccessToken,
        refresh_token: igId,
        updated_at: new Date().toISOString()
      }, { onConflict: "channel" });
      if (supaIgError) {
        console.error("Error al guardar Instagram en la base de datos (Supabase):", supaIgError);
      }
    }
    return NextResponse.redirect(`${appUrl}/admin/integrations?success=meta_connected`);
    
  } catch (err: any) {
    console.error("Error crítico en el proceso de conexión con Meta:", err);
    return NextResponse.redirect(`${appUrl}/admin/integrations?error=meta_callback_failed`);
  }
}
