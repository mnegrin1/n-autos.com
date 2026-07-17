export const runtime = "edge";

import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/localDb";

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

        const db = getDb();
        if (!db.inbox_conversations) db.inbox_conversations = [];

        // Buscar conversación existente por el ID del remitente de la plataforma
        let conversation = db.inbox_conversations.find(
          (c: any) => c.channel === channel && (c as any).channel_sender_id === senderId
        );

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
            messages: [],
            channel_sender_id: senderId
          };
          db.inbox_conversations.push(newConv);
          conversation = newConv;
        }

        // Registrar el mensaje recibido
        const activeConv = conversation;
        activeConv.messages.push({
          id: `msg-${Date.now()}`,
          sender: 'lead',
          text: messageText,
          time: timeStr,
          status: 'read'
        });

        activeConv.last_message = messageText;
        activeConv.last_message_time = timeStr;
        activeConv.unread = true;

        saveDb(db);
        console.log(`Mensaje de ${channel} registrado en el CRM.`);
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("Error procesando Webhook de Meta:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
