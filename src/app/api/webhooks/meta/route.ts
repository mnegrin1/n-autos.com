
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Verificación del Webhook por parte de Meta
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Este token lo configuras tú en la consola de Meta Developers
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "CRM_AUTO_META_TOKEN_12345";

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("¡Webhook de Meta verificado con éxito!");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  return new Response("Bad Request", { status: 400 });
}

// POST: Recepción de eventos en tiempo real (mensajes de chats)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Evento de Webhook de Meta recibido:", JSON.stringify(body, null, 2));

    // Validar el origen (Messenger de página de Facebook o Instagram Direct)
    const isPage = body.object === "page";
    const isInstagram = body.object === "instagram";

    if (isPage || isInstagram) {
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];

      // Si contiene un mensaje de texto entrante del lead
      if (messaging && messaging.message && messaging.message.text) {
        const senderId = messaging.sender.id;
        const messageText = messaging.message.text;
        const channel = isPage ? "facebook" : "instagram";

        const { data: existingConvs } = await (supabase as any)
          .from("inbox_conversations")
          .select("*")
          .eq("channel", channel)
          .eq("channel_sender_id", senderId)
          .limit(1);

        let conversation = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!conversation) {
          const newConv = {
            id: `conv-meta-${Date.now()}`,
            lead_name: `Cliente ${channel.toUpperCase()} (${senderId.substring(senderId.length - 4)})`,
            lead_avatar: isPage ? "FB" : "IG",
            channel: channel as any,
            last_message: messageText,
            last_message_time: timeStr,
            unread: true,
            messages: [{
              id: `msg-${Date.now()}`,
              sender: 'lead',
              text: messageText,
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
            text: messageText,
            time: timeStr,
            status: 'read'
          }];
          
          await (supabase.from("inbox_conversations") as any).update({
            last_message: messageText,
            last_message_time: timeStr,
            unread: true,
            messages: newMessages
          }).eq("id", conversation.id);
        }
        console.log(`Mensaje de ${channel} registrado en el CRM.`);
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("Error procesando Webhook de Meta:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
