import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  const targetRedirect = `${origin}/admin/settings`;
  const redirectUri = `${origin}/api/auth/meta/callback`;

  // 1. Si hubo error en el popup de Facebook o el usuario canceló
  if (error) {
    console.error("Facebook devolvió un error en la URL:", error);
    return NextResponse.redirect(`${targetRedirect}?error=${error}`);
  }
  // 2. Verificar credenciales antes de continuar
  if (!appId || !appSecret) {
    console.error("FALTA CONFIGURACIÓN: No se encontró META_APP_ID o META_APP_SECRET en las variables de entorno");
    return NextResponse.redirect(`${targetRedirect}?error=missing_credentials`);
  }

  if (!code) {
    return NextResponse.redirect(`${targetRedirect}?error=no_code`);
  }

  const state = searchParams.get("state") || "facebook";

  try {
    // 3. Intercambiar code por User Access Token corto
    const tokenRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('Error obteniendo token corto de Meta:', err);
      throw new Error(err.error?.message || 'Fallo al intercambiar code por token corto');
    }
    const tokenData = await tokenRes.json();
    
    const shortLivedToken = tokenData.access_token;
    
    // 4. Intercambiar por Long-Lived User Access Token
    const longLivedRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    if (!longLivedRes.ok) {
      const err = await longLivedRes.json();
      console.error('Error obteniendo token de larga duración:', err);
      throw new Error(err.error?.message || 'Fallo al intercambiar por token de larga duración');
    }
    const longLivedData = await longLivedRes.json();
    
    const longLivedToken = longLivedData.access_token || shortLivedToken;

    // 5. Obtener las páginas del usuario
    const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`);
    if (!pagesRes.ok) {
      const err = await pagesRes.json();
      console.error('Error al obtener páginas de Meta:', err);
      throw new Error(err.error?.message || 'Fallo al obtener páginas de Meta');
    }
    const pagesData = await pagesRes.json();
    
    let pageId = "";
    let pageName = "";
    let pageAccessToken = longLivedToken; // Fallback al token de usuario
    let igId = "";
    let igUsername = "";

    // Buscar en las páginas la cuenta de Instagram conectada o la página de Facebook
    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        if (!pageId) {
          pageId = page.id;
          pageName = page.name;
          pageAccessToken = page.access_token || longLivedToken;
        }
        if (page.instagram_business_account) {
          igId = page.instagram_business_account.id;
          pageId = page.id;
          pageName = page.name;
          pageAccessToken = page.access_token || longLivedToken;

          const igProfileRes = await fetch(`https://graph.facebook.com/v20.0/${igId}?fields=username&access_token=${pageAccessToken}`);
          if (igProfileRes.ok) {
            const igProfileData = await igProfileRes.json();
            igUsername = igProfileData.username || igId;
          } else {
            igUsername = igId;
          }
          break; // Encontrada la cuenta IG vinculada
        }
      }
    }

    if (state === "instagram" && !igId) {
      // Intentar /me si no se encontró en las páginas
      try {
        const igRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,username,name&access_token=${longLivedToken}`);
        if (igRes.ok) {
          const igData = await igRes.json();
          if (igData.id) {
            igId = igData.id;
            igUsername = igData.username || igData.name || igId;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!pageId && !igId) {
      console.error("ERROR DE PÁGINAS/IG: No se encontró Página ni cuenta de Instagram válida vinculada.");
      return NextResponse.redirect(`${targetRedirect}?error=no_pages_found`);
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
        return NextResponse.redirect(`${targetRedirect}?error=db_error_fb`);
      }
    } else if (state === "instagram") {
      // 7. Guardar en Supabase para Instagram
      if (igId) {
        const { error: supaIgError } = await (supabaseAdmin as any).from("auto_integrations").upsert({
          channel: "instagram",
          agency_id: "00000000-0000-0000-0000-000000000000",
          connected: true,
          username: igUsername,
          token: pageAccessToken || longLivedToken,
          refresh_token: igId,
          updated_at: new Date().toISOString()
        }, { onConflict: "channel" });
        
        if (supaIgError) {
          console.error("Error al guardar Instagram en la base de datos (Supabase):", supaIgError);
          return NextResponse.redirect(`${targetRedirect}?error=db_error_ig`);
        }
      } else {
        console.error("No se encontró cuenta de Instagram Business válida");
        return NextResponse.redirect(`${targetRedirect}?error=no_ig_found`);
      }
    }

    return NextResponse.redirect(`${targetRedirect}?success=meta_connected`);
    
  } catch (err: any) {
    console.error("Error crítico en el proceso de conexión con Meta:", err);
    const detail = encodeURIComponent(err.message || "desconocido");
    return NextResponse.redirect(`${targetRedirect}?error=meta_callback_failed&detail=${detail}`);
  }
}
