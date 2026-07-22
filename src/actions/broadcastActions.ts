"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmailAction } from "@/actions/emailActions";
import { revalidatePath } from "next/cache";

export interface BroadcastLog {
  id?: string;
  agency_id?: string;
  subject: string;
  body_html: string;
  target_tags: string[];
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  status: "sent" | "failed" | "partial";
  created_at?: string;
}

/**
 * Envía un correo masivo (Broadcast) a los contactos filtrados por etiquetas (Tags)
 */
export async function sendBroadcastAction(params: {
  agencyId?: string;
  subject: string;
  bodyHtml: string;
  targetTags: string[];
}) {
  try {
    const agencyId = params.agencyId || "00000000-0000-0000-0000-000000000000";
    const { subject, bodyHtml, targetTags } = params;

    if (!subject || !bodyHtml) {
      return { success: false, error: "Asunto y cuerpo del correo son requeridos" };
    }

    // 1. Obtener todos los leads de la agencia
    const { data: leads, error: fetchError } = await (supabaseAdmin.from('auto_leads') as any)
      .select('id, name, email, tags')
      .eq('agency_id', agencyId);

    if (fetchError || !leads) {
      console.error("Error fetching leads for broadcast:", fetchError);
      return { success: false, error: "Error al recuperar los contactos" };
    }

    // 2. Filtrar contactos por etiquetas y emails válidos
    const filteredLeads = leads.filter((lead: any) => {
      if (!lead.email || !lead.email.trim() || !lead.email.includes("@")) return false;

      // Si targetTags está vacío o contiene "ALL", enviar a todos
      if (!targetTags || targetTags.length === 0 || targetTags.includes("ALL")) {
        return true;
      }

      // Si no, verificar intersección de etiquetas
      const leadTags: string[] = Array.isArray(lead.tags) ? lead.tags : [];
      return targetTags.some(tag => leadTags.includes(tag));
    });

    if (filteredLeads.length === 0) {
      return { 
        success: false, 
        error: "No se encontraron contactos con email válido que coincidan con las etiquetas seleccionadas." 
      };
    }

    // 3. Enviar emails iterativamente mediante Resend
    let sentCount = 0;
    let failedCount = 0;

    for (const lead of filteredLeads) {
      // Reemplazo simple de variables en plantilla
      const personalizedBody = bodyHtml
        .replace(/{{name}}/g, lead.name || "Cliente")
        .replace(/{{nombre}}/g, lead.name || "Cliente")
        .replace(/{{email}}/g, lead.email);

      const res = await sendEmailAction(lead.email, subject, personalizedBody);
      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
        console.warn(`Error enviando broadcast a ${lead.email}:`, res.error);
      }
    }

    // 4. Intentar guardar log en la tabla 'email_broadcasts'
    const broadcastRecord = {
      agency_id: agencyId,
      subject,
      body_html: bodyHtml,
      target_tags: targetTags,
      recipients_count: filteredLeads.length,
      sent_count: sentCount,
      failed_count: failedCount,
      status: failedCount === 0 ? "sent" : (sentCount > 0 ? "partial" : "failed"),
      created_at: new Date().toISOString()
    };

    try {
      await (supabaseAdmin.from('email_broadcasts') as any).insert([broadcastRecord]);
    } catch (e) {
      console.warn("Tabla email_broadcasts no existe o error guardando log:", e);
    }

    revalidatePath("/admin/email/broadcasts");

    return {
      success: true,
      data: {
        totalRecipients: filteredLeads.length,
        sentCount,
        failedCount
      }
    };

  } catch (err: any) {
    console.error("Error executing sendBroadcastAction:", err);
    return { success: false, error: err.message || "Error al procesar envío masivo" };
  }
}

/**
 * Obtiene el historial de broadcasts enviados
 */
export async function getBroadcastsAction(agencyId?: string) {
  try {
    const targetAgency = agencyId || "00000000-0000-0000-0000-000000000000";
    const { data, error } = await (supabaseAdmin.from('email_broadcasts') as any)
      .select('*')
      .eq('agency_id', targetAgency)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}
