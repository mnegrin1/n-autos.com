import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Webhook MercadoLibre recibido:", payload);

    // MercadoLibre manda un recurso, ej: /questions/123456
    const resource = payload.resource;
    const topic = payload.topic;
    const userId = payload.user_id;

    if ((topic === "questions" || topic === "messages" || topic === "created_orders" || topic === "vis_leads" || topic === "leads") && resource) {
      // 1. Obtener todas las integraciones activas de ML en producción
      const { data: integrations } = await (supabase as any)
        .from("auto_integrations")
        .select("*")
        .eq("channel", "mercadolibre");

      // Buscamos la integración que corresponda a este user_id (seller_id)
      // Como el user_id puede estar guardado en username como "Vendedor ML (ID: xxxx)" o en otro formato, 
      // y MercadoLibre usa el user_id como identificador de la cuenta
      let integration = integrations?.find(int => int.username?.includes(userId?.toString()) || int.settings?.user_id === userId);
      
      // Si no la encontramos por ID estricto pero hay una sola integración, la usamos (fallback para demo/MVP)
      if (!integration && integrations && integrations.length > 0) {
        integration = integrations[0];
      }

      const token = integration?.token || integration?.settings?.token;
      const agencyId = integration?.agency_id || "00000000-0000-0000-0000-000000000000";

      if (token) {
        // 2. Traer el texto de la pregunta o mensaje desde ML
        const fetchRes = await fetch(`https://api.mercadolibre.com${resource}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (fetchRes.ok) {
          const data = await fetchRes.json();
          const text = topic === "questions" ? data.text : (data.text || data.text_plain || "Mensaje recibido");
          const senderId = topic === "questions" ? data.from.id.toString() : (data.from?.user_id?.toString() || data.from?.id?.toString() || "ML_User");
          const channel = "mercadolibre";

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
             console.error("Error al obtener nombre del usuario de ML:", e);
          }

          if (data.item_id) {
             const pubId = `pub-${data.item_id}`;
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

          const { data: existingConvs } = await (supabase as any)
            .from("inbox_conversations")
            .select("*")
            .eq("channel", channel)
            .eq("channel_sender_id", senderId)
            .limit(1);

          let conversation = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

          const msgDate = data.date_created ? new Date(data.date_created) : new Date();
          const timeStr = msgDate.toLocaleTimeString('en-US', {
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Montevideo',
            hour12: true
          });

          if (!conversation) {
            const newConv = {
              id: `conv-ml-${Date.now()}`,
              agency_id: agencyId,
              lead_name: senderName,
              lead_avatar: "ML",
              channel: channel,
              last_message: text,
              last_message_time: timeStr,
              unread: true,
              messages: [{
                id: `msg-${Date.now()}`,
                sender: 'lead',
                text: text,
                time: timeStr,
                status: 'read'
              }],
              channel_sender_id: senderId
            };
            await (supabase.from("inbox_conversations") as any).insert(newConv);
          } else {
            const newMessages = [...(conversation.messages || []), {
              id: `msg-${Date.now()}`,
              sender: 'lead',
              text: text,
              time: timeStr,
              status: 'read'
            }];
            
            await (supabase.from("inbox_conversations") as any).update({
              lead_name: senderName,
              last_message: text,
              last_message_time: timeStr,
              unread: true,
              messages: newMessages
            }).eq("id", conversation.id);
          }
          console.log(`Evento de MercadoLibre (${topic}) guardado en el CRM.`);
        } else {
          const errData = await fetchRes.json().catch(() => null);
          console.error("Error al obtener recurso de MercadoLibre en webhook:", errData || fetchRes.statusText);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error procesando Webhook de MercadoLibre:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
