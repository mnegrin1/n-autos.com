import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    return NextResponse.redirect(`${appUrl}/admin/settings?error=${error}`);
  }
  // 2. Verificar credenciales antes de continuar (¡muy importante!)
  if (!appId || !appSecret) {
    console.error("FALTA CONFIGURACIÓN: No se encontró META_APP_ID o META_APP_SECRET en el archivo .env.local");
    return NextResponse.redirect(`${appUrl}/admin/settings?error=missing_credentials`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin/settings?error=no_code`);
  }

  const state = searchParams.get("state") || "facebook";

  try {
    // 3. Intercambiar code por User Access Token corto
    const tokenRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error("Error en Graph API al pedir el token de acceso:", tokenData.error);
      throw new Error(tokenData.error.message);
    }
    
    const shortLivedToken = tokenData.access_token;
    
    // 4. Intercambiar por Long-Lived User Access Token
    const longLivedRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    const longLivedData = await longLivedRes.json();
    
    const longLivedToken = longLivedData.access_token || shortLivedToken;
    // 5. Obtener las páginas del usuario
    const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();
    
    let pageId = "";
    let pageName = "";
    let pageAccessToken = longLivedToken; // Fallback al token de usuario
    let igId = "";
    let igUsername = "";
    
    if (pagesData.data && pagesData.data.length > 0) {
      const page = pagesData.data[0];
      pageId = page.id;
      pageName = page.name;
      pageAccessToken = page.access_token || longLivedToken;
      if (page.instagram_business_account) {
        igId = page.instagram_business_account.id;
        
        // Obtener el username de Instagram usando el Page Access Token
        const igProfileRes = await fetch(`https://graph.facebook.com/v20.0/${igId}?fields=username&access_token=${pageAccessToken}`);
        if (igProfileRes.ok) {
          const igProfileData = await igProfileRes.json();
          igUsername = igProfileData.username || igId;
        } else {
          igUsername = igId;
        }
      }
    } else if (state === "instagram") {
      // Si usamos Business Login for Instagram puramente (sin página retornada)
      const igRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,username,name&access_token=${longLivedToken}`);
      const igData = await igRes.json();
      if (igData.id) {
        igId = igData.id;
        igUsername = igData.username || igData.name || igId;
      }
    }

    if (!pageId && !igId) {
      console.error("ERROR DE PÁGINAS/IG: No se encontró Página ni cuenta de Instagram válida vinculada.");
      return NextResponse.redirect(`${appUrl}/admin/settings?error=no_pages_found`);
    }
    
    if (state === "facebook") {
      // 6. Guardar en Supabase para Facebook
      const { error: supaFbError } = await (supabaseAdmin as any).from("auto_integrations").upsert({
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
        return NextResponse.redirect(`${appUrl}/admin/settings?error=db_error_fb`);
      }
    } else if (state === "instagram") {
      // 7. Guardar en Supabase para Instagram
      if (igId) {
        const { error: supaIgError } = await (supabaseAdmin as any).from("auto_integrations").upsert({
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
          return NextResponse.redirect(`${appUrl}/admin/settings?error=db_error_ig`);
        }
      } else {
        console.error("No se encontró cuenta de Instagram Business válida");
        return NextResponse.redirect(`${appUrl}/admin/settings?error=no_ig_found`);
      }
    }

    return NextResponse.redirect(`${appUrl}/admin/settings?success=meta_connected`);
    
  } catch (err: any) {
    console.error("Error crítico en el proceso de conexión con Meta:", err);
    return NextResponse.redirect(`${appUrl}/admin/settings?error=meta_callback_failed`);
  }
}
