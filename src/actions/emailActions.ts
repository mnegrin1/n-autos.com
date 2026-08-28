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
    const fromAddress = process.env.EMAIL_FROM || 'n-sistemas.com <contacto@n-sistemas.com>';
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";
  const logoUrl = `${appUrl}/logo-n-sistemas-square.png`;

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
        .brand { text-align: center; margin-bottom: 24px; }
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
        <div class="brand">
          <img src="${logoUrl}" alt="n-sistemas.com" style="max-width: 105px; height: auto; display: inline-block; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />
        </div>
        <div class="title">Recuperación de Contraseña</div>
        <div class="text">Hola <strong>${nameDisplay}</strong>,<br>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código temporal de verificación de 6 dígitos:</div>
        <div class="otp-box">
          <div class="otp-code">${code}</div>
        </div>
        <div class="text">Ingresa este código en la pantalla de inicio de sesión para crear una nueva contraseña.</div>
        <div class="warning">🔒 Este código expira en <strong>15 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} N-Sistemas / Plataforma de Gestión Automotriz. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailAction(to, subject, html);
}

/**
 * Envía un correo de activación / invitación a un nuevo usuario creado por Super Admin
 * para que establezca su contraseña mediante enlace directo.
 */
export async function sendAccountInvitationEmail(to: string, code: string, userName?: string, agencyName?: string, inviteUrl?: string) {
  const subject = `Te han invitado a ${agencyName || 'la plataforma'} - Activa tu cuenta`;
  const nameDisplay = userName ? userName : "Usuario";
  const agencyDisplay = agencyName ? agencyName : "Tu Automotora";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";
  const logoUrl = `${appUrl}/logo-n-sistemas-square.png`;
  const link = inviteUrl || `${appUrl}/admin/accept-invite?email=${encodeURIComponent(to)}&code=${code}&name=${encodeURIComponent(nameDisplay)}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a ${agencyDisplay}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .brand { text-align: center; margin-bottom: 24px; }
        .title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 20px; text-align: center; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .link-box { background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; font-size: 12px; word-break: break-all; margin: 20px 0; }
        .warning { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px; }
        .footer { border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <img src="${logoUrl}" alt="n-sistemas.com" style="max-width: 105px; height: auto; display: inline-block; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />
        </div>
        <div class="title">¡Bienvenido a ${agencyDisplay}!</div>
        <div class="text">Hola <strong>${nameDisplay}</strong>,<br>Te han registrado como usuario en <strong>${agencyDisplay}</strong>. Haz clic en el siguiente botón para activar tu cuenta y establecer tu contraseña de acceso:</div>
        
        <div class="btn-container">
          <a href="${link}" target="_blank" class="btn">Activar Cuenta y Crear Contraseña</a>
        </div>

        <div class="text" style="font-size: 13px; color: #64748b; margin-top: 20px;">O copia y pega el siguiente enlace en tu navegador:</div>
        <div class="link-box">
          <a href="${link}" target="_blank" style="color: #2563eb; font-weight: 600;">${link}</a>
        </div>
        
        <div class="warning">🔒 Este enlace de activación es personal y expira en <strong>24 horas</strong>.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} N-Sistemas / Plataforma de Gestión Automotriz. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailAction(to, subject, html);
}

export async function sendSuperAdminInvitationEmail(to: string, code: string, userName: string = "Mauricio Negrin", inviteUrl?: string) {
  const subject = `Acceso de Superadmin N-Autos - Establece tu Contraseña`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";
  const logoUrl = `${appUrl}/logo-n-sistemas-square.png`;
  const link = inviteUrl || `${appUrl}/admin/accept-invite?email=${encodeURIComponent(to)}&code=${code}&name=${encodeURIComponent(userName)}&role=superadmin`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acceso Superadmin N-Autos</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
        .container { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
        .brand { text-align: center; margin-bottom: 24px; }
        .badge { display: inline-block; background-color: rgba(239, 68, 68, 0.15); color: #ef4444; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(239, 68, 68, 0.3); }
        .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; text-align: center; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #ef4444; color: #ffffff !important; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); }
        .link-box { background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; text-align: center; font-size: 12px; word-break: break-all; margin: 20px 0; }
        .warning { font-size: 12px; color: #64748b; text-align: center; margin-top: 16px; }
        .footer { border-top: 1px solid #334155; margin-top: 32px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <img src="${logoUrl}" alt="n-sistemas.com" style="max-width: 105px; height: auto; display: inline-block; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" />
        </div>
        <div style="text-align: center;">
          <span class="badge">Acceso de Superadministrador</span>
        </div>
        <div class="title">Configura tu Contraseña de Superadmin</div>
        <div class="text">Hola <strong>${userName}</strong>,<br>Se ha configurado tu cuenta con privilegios globales de Superadmin para la plataforma N-Autos. Haz clic en el botón a continuación para ingresar y establecer tu contraseña segura:</div>
        
        <div class="btn-container">
          <a href="${link}" target="_blank" class="btn">Establecer Contraseña de Superadmin</a>
        </div>

        <div class="text" style="font-size: 13px; color: #94a3b8; margin-top: 20px;">O copia y pega el siguiente enlace directo en tu navegador:</div>
        <div class="link-box">
          <a href="${link}" target="_blank" style="color: #ef4444; font-weight: 600;">${link}</a>
        </div>
        
        <div class="warning">🔒 Este enlace de seguridad es único e individual.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} N-Sistemas / Plataforma de Gestión Automotriz. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailAction(to, subject, html);
}

/**
 * Notifica al Superadmin cuando un cliente llena el formulario de contacto en la landing page.
 */
export async function sendLandingInquiryNotificationEmail(toSuperadmin: string, inquiry: { agencyName: string; userName: string; userEmail: string; phone?: string; message?: string }) {
  const subject = `🔔 Nueva consulta de interesado: ${inquiry.agencyName} (${inquiry.userName})`;
  const superadminBaseUrl = process.env.NEXT_PUBLIC_SUPERADMIN_URL || "https://superadmin.n-autos.com";
  const requestsUrl = `${superadminBaseUrl}/superadmin/requests`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Nueva Consulta desde la Landing</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
        .field { margin-bottom: 12px; font-size: 14px; }
        .label { font-weight: 700; color: #475569; }
        .val { color: #0f172a; font-weight: 600; }
        .msg-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0; font-size: 14px; color: #334155; font-style: italic; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">📥 Nueva Consulta desde landing n-autos.com</div>
        </div>
        <div class="field"><span class="label">Empresa / Automotora:</span> <span class="val">${inquiry.agencyName}</span></div>
        <div class="field"><span class="label">Contacto:</span> <span class="val">${inquiry.userName}</span></div>
        <div class="field"><span class="label">Email:</span> <span class="val">${inquiry.userEmail}</span></div>
        <div class="field"><span class="label">Teléfono / WhatsApp:</span> <span class="val">${inquiry.phone || 'No especificado'}</span></div>
        
        ${inquiry.message ? `<div class="msg-box">"${inquiry.message}"</div>` : ''}

        <a href="${requestsUrl}" class="btn" target="_blank">Ver Consultas en Superadmin</a>
      </div>
    </body>
    </html>
  `;

  return await sendEmailAction(toSuperadmin, subject, html);
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
