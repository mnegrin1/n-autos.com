import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel"); // "facebook" or "instagram"
  
  if (!channel || (channel !== "facebook" && channel !== "instagram")) {
    return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
  }

  try {
    // 1. Obtener la integración desde Supabase
    const { data: integrationData, error } = await (supabase as any)
      .from("auto_integrations")
      .select("*")
      .eq("agency_id", "00000000-0000-0000-0000-000000000000")
      .eq("channel", channel)
      .single();

    if (error || !integrationData || !integrationData.connected) {
      return NextResponse.json({ error: `Integración con ${channel} no conectada` }, { status: 404 });
    }

    const token = integrationData.token; // Page Access Token
    const targetId = integrationData.refresh_token; // FB Page ID or IG User ID

    if (!token || !targetId) {
       return NextResponse.json({ error: "Faltan credenciales de conexión" }, { status: 400 });
    }

    let posts = [];

    // 2. Hacer fetch a Graph API dependiendo del canal
    if (channel === "facebook") {
      // Obtenemos los posts de la página. 
      // Usamos el endpoint /{page_id}/published_posts o /{page_id}/feed
      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/published_posts?fields=id,message,full_picture,created_time,permalink_url&access_token=${token}&limit=10`);
      const fbData = await fbRes.json();

      if (fbData.error) {
        throw new Error(fbData.error.message);
      }

      posts = (fbData.data || []).map((p: any) => ({
        id: p.id,
        description: p.message || "",
        images: p.full_picture ? [p.full_picture] : [],
        date: p.created_time,
        external_url: p.permalink_url,
        brand: "", // Para que el usuario lo complete luego o lo saquemos por IA
        model: "Post de Facebook",
        year: new Date().getFullYear(),
        price: 0,
        kms: 0
      }));

    } else if (channel === "instagram") {
      // Obtenemos los media de Instagram
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${targetId}/media?fields=id,caption,media_url,media_type,timestamp,permalink,thumbnail_url&access_token=${token}&limit=10`);
      const igData = await igRes.json();

      if (igData.error) {
        throw new Error(igData.error.message);
      }

      posts = (igData.data || []).map((p: any) => {
        // Para videos, la imagen es thumbnail_url si existe, sino no mostramos
        const imageUrl = p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url;
        
        return {
          id: p.id,
          description: p.caption || "",
          images: imageUrl ? [imageUrl] : [],
          date: p.timestamp,
          external_url: p.permalink,
          brand: "",
          model: "Post de Instagram",
          year: new Date().getFullYear(),
          price: 0,
          kms: 0
        };
      });
    }

    return NextResponse.json({ success: true, posts });
  } catch (err: any) {
    console.error(`Error obteniendo posts de ${channel}:`, err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
