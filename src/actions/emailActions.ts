"use server";

import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Inicializamos Resend con la variable de entorno o un dummy si no existe
const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

/**
 * Envía un email utilizando Resend.
 * En producción esto requerirá que el dominio esté configurado en Resend.
 */
export async function sendEmailAction(to: string, subject: string, html: string) {
  try {
    const fromAddress = process.env.EMAIL_FROM || 'Mauricio Negrin <mauricio.negrin@n-sistemas.com>';
    const data = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: html,
    });

    if (data.error) {
      console.error("Error from Resend API:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Exception sending email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Se encarga de procesar el webhook entrante de Resend
 * y guardarlo como una conversación de tipo 'email' en Supabase.
 */
export async function processInboundEmailWebhook(payload: any) {
  try {
    const { from, subject, text, html } = payload;
    
    const emailMatch = from.match(/<(.+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : from;
    const senderName = from.split('<')[0].trim() || senderEmail;

    // Buscar si ya existe un lead con ese email
    const { data: leads } = await (supabaseAdmin.from('auto_leads') as any)
      .select('id')
      .eq('email', senderEmail)
      .limit(1);

    let leadId = null;
    if (leads && leads.length > 0) {
      leadId = leads[0].id;
    }

    // Buscar si ya existe una conversación de email para este lead
    let { data: existingConv } = await (supabaseAdmin.from('inbox_conversations') as any)
      .select('*')
      .eq('channel', 'email')
      .eq('lead_name', senderName) // O podríamos buscar por metadata si guardáramos el email
      .limit(1)
      .single();

    const now = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'lead',
      text: text || "Mensaje sin texto plano",
      time: now,
      status: 'delivered'
    };

    if (existingConv) {
      const updatedMessages = [...(existingConv.messages || []), newMsg];
      await (supabaseAdmin.from('inbox_conversations') as any)
        .update({
          messages: updatedMessages,
          last_message: newMsg.text.substring(0, 50) + "...",
          last_message_time: now,
          unread: true
        })
        .eq('id', existingConv.id);
    } else {
      // Crear nueva conversación
      await (supabaseAdmin.from('inbox_conversations') as any)
        .insert([{
          id: `email-${Date.now()}`,
          lead_id: leadId,
          lead_name: senderName,
          channel: 'email',
          last_message: newMsg.text.substring(0, 50) + "...",
          last_message_time: now,
          unread: true,
          messages: [newMsg]
        }]);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error processing inbound email:", err);
    return { success: false, error: err.message };
  }
}
