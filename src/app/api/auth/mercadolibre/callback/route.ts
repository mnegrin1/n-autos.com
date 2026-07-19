import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const isMock = searchParams.get("mock") === "true";

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/integrations?status=error&error=no_code", request.url));
  }

  try {
    if (!appId || !secretKey) {
      throw new Error("Faltan credenciales de MercadoLibre en el entorno.");
    }

    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: appId,
        client_secret: secretKey,
        code: code,
        redirect_uri: `${appUrl}/api/auth/mercadolibre/callback`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error exchanging OAuth code on ML:", data);
      const errorDetail = data.error ? `${data.error}: ${data.message}` : data.message || "Error intercambiando el código";
      throw new Error(`ML_API_ERROR|${errorDetail}`);
    }

    const token = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresAt = Date.now() + (data.expires_in * 1000);
    let username = `Vendedor ML (ID: ${data.user_id})`;

    try {
      const userRes = await fetch("https://api.mercadolibre.com/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        username = userData.nickname || userData.first_name || username;
      }
    } catch (err) {
      console.error("Error al obtener nickname de MercadoLibre:", err);
    }

    // 2. Guardar las credenciales en Supabase auto_integrations
    const { supabase } = await import("@/lib/supabase");
    
    // Primero intentamos buscar si ya existe la integración
    const { data: existing } = await (supabase.from("auto_integrations") as any)
      .select("id")
      .eq("channel", "mercadolibre")
      .eq("agency_id", "00000000-0000-0000-0000-000000000000")
      .single();

    const payload = {
      channel: "mercadolibre",
      agency_id: "00000000-0000-0000-0000-000000000000",
      connected: true,
      username: username,
      token: token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      mode: "production",
      updated_at: new Date().toISOString()
    };

    let supaError;
    if (existing) {
      const { error } = await (supabase.from("auto_integrations") as any)
        .update(payload)
        .eq("id", existing.id);
      supaError = error;
    } else {
      const { error } = await (supabase.from("auto_integrations") as any)
        .insert([payload]);
      supaError = error;
    }

    if (supaError) {
      console.error("Error saving ML integration to Supabase:", supaError);
      throw new Error("Error al guardar integración en base de datos.");
    } else {
      console.log("Integración de ML guardada en Supabase correctamente.");

      // Fetch historial de mensajes sin responder
      try {
        const qRes = await fetch("https://api.mercadolibre.com/my/received_questions/search?status=UNANSWERED", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (qRes.ok) {
           const qData = await qRes.json();
           const questions = qData.questions || [];
           
           for (const q of questions) {
              const text = q.text;
              const senderId = q.from.id.toString();
              const channel = "mercadolibre";
              const msgDate = q.date_created ? new Date(q.date_created) : new Date();
              const timeStr = msgDate.toISOString();
              
              let senderName = `Usuario ML (${senderId})`;
              try {
                const userRes = await fetch(`https://api.mercadolibre.com/users/${senderId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  senderName = userData.nickname || senderName;
                }
              } catch (e) {
                 console.error("Error al obtener nombre del usuario de ML en historial:", e);
              }

              if (q.item_id) {
                 const pubId = `pub-${q.item_id}`;
                 const { data: pubData } = await (supabase.from("auto_vehicle_publications") as any)
                    .select("id, questions_count")
                    .eq("id", pubId)
                    .single();
                 if (pubData) {
                    await (supabase.from("auto_vehicle_publications") as any)
                       .update({ questions_count: (pubData.questions_count || 0) + 1 })
                       .eq("id", pubId);
                 }
              }
              
              const { data: existingConvs } = await (supabase.from("inbox_conversations") as any)
                .select("id")
                .eq("channel", channel)
                .eq("channel_sender_id", senderId)
                .limit(1);
                
              if (!existingConvs || existingConvs.length === 0) {
                 const newConv = {
                    id: `conv-ml-${Date.now()}-${senderId}`,
                    agency_id: "00000000-0000-0000-0000-000000000000",
                    lead_name: senderName,
                    lead_avatar: "ML",
                    channel: channel,
                    last_message: text,
                    last_message_time: timeStr,
                    unread: true,
                    messages: [{
                      id: `msg-${Date.now()}-${q.id}`,
                      sender: 'lead',
                      text: text,
                      time: timeStr,
                      status: 'read'
                    }],
                    channel_sender_id: senderId
                 };
                 await (supabase.from("inbox_conversations") as any).insert([newConv]);
              }
           }
           console.log(`Se importaron ${questions.length} preguntas sin responder de MercadoLibre.`);
        } else {
           const errData = await qRes.json().catch(() => null);
           console.error("Error al importar preguntas:", errData);
        }
      } catch (err) {
         console.error("Excepción al importar preguntas del historial de ML:", err);
      }
    }

    // 3. Redirigir con éxito
    return NextResponse.redirect(new URL("/admin/integrations?status=success", request.url));
  } catch (error: any) {
    console.error("Error en callback de autenticación:", error);
    return NextResponse.redirect(
      new URL(`/admin/integrations?status=error&error=${encodeURIComponent(error.message || "auth_failed")}`, request.url)
    );
  }
}
