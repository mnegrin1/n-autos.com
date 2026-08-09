"use server";

import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function sendEmailAction(to: string, subject: string, html: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.startsWith("re_123456789")) {
      return { success: false, error: "RESEND_API_KEY no está configurada correctamente en las variables de entorno." };
    }
    const resend = new Resend(apiKey);
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
 * Envía un correo con el código de recuperación de contraseña (OTP) de 6 dígitos.
 */
export async function sendPasswordResetEmail(to: string, code: string, userName?: string) {
  const subject = `${code} es tu código de recuperación de contraseña - Tu Automotora`;
  const nameDisplay = userName ? userName : "Usuario";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .brand { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px; text-align: center; }
        .brand span { color: #10b981; }
        .title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; text-align: center; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace; }
        .warning { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px; }
        .footer { border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">Tu <span>Automotora</span></div>
        <div class="title">Recuperación de Contraseña</div>
        <div class="text">Hola <strong>${nameDisplay}</strong>,<br>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código temporal de verificación de 6 dígitos:</div>
        <div class="otp-box">
          <div class="otp-code">${code}</div>
        </div>
        <div class="text">Ingresa este código en la pantalla de inicio de sesión para crear una nueva contraseña.</div>
        <div class="warning">🔒 Este código expira en <strong>15 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} Plataforma de Gestión Automotriz. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailAction(to, subject, html);
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
