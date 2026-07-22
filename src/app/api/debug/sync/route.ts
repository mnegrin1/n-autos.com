import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Este endpoint es completamente independiente de autoActions.ts (evita conflictos con "use server")
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") as "facebook" | "instagram";
    if (!channel || !["facebook", "instagram"].includes(channel)) {
      return NextResponse.json({ error: "Missing or invalid channel parameter (facebook|instagram)" }, { status: 400 });
    }

    // 1. Leer integración desde Supabase (tabla: auto_integrations)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const db = createClient(supabaseUrl, supabaseKey);

    const { data: rows, error: dbError } = await db
      .from("auto_integrations")
      .select("*")
      .eq("agency_id", "00000000-0000-0000-0000-000000000000")
      .eq("channel", channel)
      .limit(1);

    if (dbError) {
      return NextResponse.json({ error: "Error leyendo auto_integrations", details: dbError.message }, { status: 500 });
    }

    const metaInt = rows && rows.length > 0 ? rows[0] : null;

    if (!metaInt?.connected || !metaInt?.token || !metaInt?.refresh_token) {
      return NextResponse.json({
        error: `${channel} no está conectado o faltan datos`,
        debug: {
          connected: metaInt?.connected,
          hasToken: !!metaInt?.token,
          hasRefreshToken: !!metaInt?.refresh_token,
          row: metaInt,
        }
      }, { status: 400 });
    }


    // Buscar también la integración de facebook si estamos en instagram para tener el fbPageId
    let fbPageId = "";
    if (channel === "instagram" && rows && rows.length > 0) {
      const { data: fbRows } = await db
        .from("auto_integrations")
        .select("*")
        .eq("agency_id", "00000000-0000-0000-0000-000000000000")
        .eq("channel", "facebook")
        .limit(1);
      if (fbRows && fbRows.length > 0) {
        fbPageId = fbRows[0].refresh_token;
      }
    }

    const token = metaInt.token;
    const senderId = metaInt.refresh_token;
    const baseUrl = "https://graph.facebook.com/v20.0";
    const platformParam = channel === "instagram" ? "&platform=instagram" : "";

    const targetId = (channel === "instagram" && fbPageId) ? fbPageId : senderId;

    // 2. Llamar a Meta: obtener conversaciones (limit=1 probado en Graph Explorer)
    const convsUrl = `${baseUrl}/${targetId}/conversations?limit=1${platformParam}&access_token=${token}`;
    let convsRes = await fetch(convsUrl);
    let convsData = await convsRes.json();

    let usedFallback = false;
    if (!convsRes.ok && channel === "instagram" && senderId !== targetId) {
      const fallbackUrl = `${baseUrl}/${senderId}/conversations?limit=1${platformParam}&access_token=${token}`;
      convsRes = await fetch(fallbackUrl);
      convsData = await convsRes.json();
      usedFallback = true;
    }

    if (!convsRes.ok) {
      return NextResponse.json({
        error: "Meta Graph API error en /conversations",
        metaError: convsData,
        targetId,
        senderId,
        tokenPreview: token ? `${token.slice(0, 15)}...${token.slice(-10)}` : null,
        url: convsUrl.replace(token, "TOKEN_REDACTED"),
        usedFallback,
      }, { status: 502 });
    }

    const conversations = convsData.data || [];

    if (conversations.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "Meta no devolvió conversaciones (inbox vacío o permisos insuficientes)",
        senderId,
      });
    }

    // 3. Para el diagnóstico, obtener mensajes de la primera conversación
    const firstConvId = conversations[0].id;
    const msgsRes = await fetch(`${baseUrl}/${firstConvId}?fields=messages.limit(5){message,created_time,from,to}&access_token=${token}`);
    const msgsData = await msgsRes.json();

    // 4. Insertar conversaciones en inbox_conversations
    let syncedCount = 0;
    for (const conv of conversations) {
      const mRes = await fetch(`${baseUrl}/${conv.id}?fields=messages.limit(20){message,created_time,from,to}&access_token=${token}`);
      if (!mRes.ok) continue;
      const mData = await mRes.json();
      if (!mData.messages?.data?.length) continue;

      const rawMessages = mData.messages.data.reverse();
      let leadId = "";
      let leadNameRaw = "";

      for (const rm of rawMessages) {
        if (rm.from?.id && rm.from.id !== senderId) {
          leadId = rm.from.id;
          leadNameRaw = rm.from.name || rm.from.username || "";
          break;
        }
      }

      if (!leadId) {
        const firstMsg = rawMessages[0];
        leadId = firstMsg?.from?.id || conv.id;
        leadNameRaw = firstMsg?.from?.username || `Chat Instagram (${leadId.slice(-4)})`;
      }

      const ourMessages = rawMessages.filter((rm: any) => rm.message).map((rm: any) => ({
        id: `msg-${rm.id || Date.now() + Math.random()}`,
        sender: rm.from?.id === leadId ? "lead" : "agent",
        text: rm.message,
        time: rm.created_time || new Date().toISOString(),
        status: "read",
      }));

      if (ourMessages.length === 0) continue;

      const lastMsg = ourMessages[ourMessages.length - 1];

      const { data: existingConvs } = await db
        .from("inbox_conversations")
        .select("*")
        .eq("channel", channel)
        .eq("channel_sender_id", leadId)
        .limit(1);

      const existingConv = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

      if (!existingConv) {
        await db.from("inbox_conversations").insert({
          id: `conv-meta-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          agency_id: "00000000-0000-0000-0000-000000000000",
          lead_name: leadNameRaw || `Cliente ${channel.toUpperCase()} (${leadId.slice(-4)})`,
          lead_avatar: channel === "facebook" ? "FB" : "IG",
          channel,
          last_message: lastMsg.text,
          last_message_time: lastMsg.time,
          unread: false,
          messages: ourMessages,
          channel_sender_id: leadId,
        });
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      totalConversations: conversations.length,
      message: `Sincronizados ${syncedCount} chats de ${channel}.`,
      sample: {
        firstConvId,
        rawMessages: msgsData,
      },
      senderId,
    });

  } catch (e: any) {
    return NextResponse.json({ error: "Exception", details: e.message, stack: e.stack?.slice(0, 500) }, { status: 500 });
  }
}
