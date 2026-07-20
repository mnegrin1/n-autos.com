
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

// GET: Verificación del Webhook por parte de Meta
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Este token lo configuras tú en la consola de Meta Developers
  const verifyToken = process.env.META_VERIFY_TOKEN || "CRM_AUTO_META_TOKEN_12345";

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
    const isWhatsApp = body.object === "whatsapp_business_account";

    if (isPage || isInstagram) {
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];

      // Si contiene un mensaje de texto entrante del lead
      if (messaging && messaging.message && messaging.message.text) {
        
        // Ignorar Ecos (mensajes enviados por la propia página/app)
        if (messaging.message.is_echo) {
          console.log("Echo ignorado.");
          return new Response("ECHO_IGNORED", { status: 200 });
        }

        const senderId = messaging.sender.id;
        const messageText = messaging.message.text;
        const channel = isPage ? "facebook" : "instagram";

        const { data: existingConvs } = await (supabaseAdmin as any)
          .from("inbox_conversations")
          .select("*")
          .eq("channel", channel)
          .eq("channel_sender_id", senderId)
          .limit(1);

        let conversation = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

        const now = new Date();
        const timeStr = now.toISOString();

        if (!conversation) {
          const recipientId = messaging.recipient.id;
          let leadName = `Cliente ${channel.toUpperCase()} (${senderId.substring(senderId.length - 4)})`;
          let leadAvatar = isPage ? "FB" : "IG";

          try {
            // Buscamos el token de acceso de la página (guardado en refresh_token durante el OAuth)
            const { data: pageData } = await (supabaseAdmin as any)
              .from("auto_integrations")
              .select("token")
              .eq("channel", channel)
              .eq("refresh_token", recipientId)
              .limit(1)
              .single();

            if (pageData && pageData.token) {
              const token = pageData.token;
              // Consultar API Graph para obtener el nombre y foto de perfil del remitente
              const profileRes = await fetch(`https://graph.facebook.com/v20.0/${senderId}?fields=first_name,last_name,name&access_token=${token}`);
              if (profileRes.ok) {
                const profile = await profileRes.json();
                if (profile.name) {
                   leadName = profile.name;
                } else if (profile.first_name) {
                   leadName = `${profile.first_name} ${profile.last_name || ''}`.trim();
                }
                // Evitamos guardar la URL en lead_avatar porque supera los límites de varchar y rompe la UI
              }
            }
          } catch (profileErr) {
            console.error("Error al obtener el perfil de Meta:", profileErr);
          }

          const newConv = {
            id: `conv-meta-${Date.now()}`,
            agency_id: "00000000-0000-0000-0000-000000000000",
            lead_name: leadName,
            lead_avatar: leadAvatar,
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
          await (supabaseAdmin.from("inbox_conversations") as any).insert(newConv);
        } else {
          const newMessages = [...(conversation.messages || []), {
            id: `msg-${Date.now()}`,
            sender: 'lead',
            text: messageText,
            time: timeStr,
            status: 'read'
          }];
          
          await (supabaseAdmin.from("inbox_conversations") as any).update({
            last_message: messageText,
            last_message_time: timeStr,
            unread: true,
            messages: newMessages
          }).eq("id", conversation.id);
        }
        console.log(`Mensaje de ${channel} registrado en el CRM.`);
        revalidatePath("/admin/inbox");
      }
    } else if (isWhatsApp) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (value && value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const contact = value.contacts?.[0];
        
        if (message.type === "text") {
          const senderId = message.from;
          const messageText = message.text.body;
          const contactName = contact?.profile?.name || `Cliente WA (${senderId.slice(-4)})`;
          
          const { data: existingConvs } = await (supabaseAdmin as any)
            .from("inbox_conversations")
            .select("*")
            .eq("channel", "whatsapp")
            .eq("channel_sender_id", senderId)
            .limit(1);

          let conversation = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

          const now = new Date();
          const timeStr = now.toISOString();

          if (!conversation) {
            const newConv = {
              id: `conv-wa-${Date.now()}`,
              agency_id: "00000000-0000-0000-0000-000000000000",
              lead_name: contactName,
              lead_avatar: "WA",
              channel: "whatsapp",
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
            await (supabaseAdmin.from("inbox_conversations") as any).insert(newConv);
          } else {
            const newMessages = [...(conversation.messages || []), {
              id: `msg-${Date.now()}`,
              sender: 'lead',
              text: messageText,
              time: timeStr,
              status: 'read'
            }];
            
            await (supabaseAdmin.from("inbox_conversations") as any).update({
              last_message: messageText,
              last_message_time: timeStr,
              unread: true,
              messages: newMessages
            }).eq("id", conversation.id);
          }
          console.log(`Mensaje de whatsapp registrado en el CRM.`);
          revalidatePath("/admin/inbox");
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("Error procesando Webhook de Meta:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
