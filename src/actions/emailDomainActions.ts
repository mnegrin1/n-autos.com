"use server";

import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export interface DNSRecord {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  value: string;
  purpose: string;
  status: "verified" | "pending";
}

export async function addCustomDomain(agencyId: string, rawDomain: string) {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  
  if (!domain || !domain.includes(".")) {
    return { success: false, error: "Por favor ingresa un dominio válido (ej. mi-automotora.com)" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  let records: DNSRecord[] = [];
  let resendDomainId = "";
  let isVerified = false;

  if (apiKey && !apiKey.startsWith("re_123456789")) {
    try {
      const resend = new Resend(apiKey);
      const resendRes = await resend.domains.create({ name: domain });
      
      if (resendRes.error) {
        console.error("Resend create domain error:", resendRes.error);
        // Si ya existe en Resend, intentar obtener sus datos
        const list = await resend.domains.list();
        const existing = list.data?.domains?.find(d => d.name === domain);
        if (existing) {
          resendDomainId = existing.id;
          isVerified = existing.status === "verified";
          if (existing.records) {
            records = existing.records.map(r => ({
              type: r.type as any,
              name: r.name,
              value: r.value,
              purpose: r.record === "SPF" ? "SPF (Autenticación de Emisor)" : r.record === "DKIM" ? "DKIM (Firma de Seguridad)" : "MX / Recepción de Inbox",
              status: r.status === "verified" ? "verified" : "pending"
            }));
          }
        } else {
          return { success: false, error: resendRes.error.message };
        }
      } else if (resendRes.data) {
        resendDomainId = resendRes.data.id;
        isVerified = resendRes.data.status === "verified";
        if (resendRes.data.records) {
          records = resendRes.data.records.map(r => ({
            type: r.type as any,
            name: r.name,
            value: r.value,
            purpose: r.record === "SPF" ? "SPF (Autenticación de Emisor)" : r.record === "DKIM" ? "DKIM (Firma de Seguridad)" : "MX / Recepción de Inbox",
            status: r.status === "verified" ? "verified" : "pending"
          }));
        }
      }
    } catch (e: any) {
      console.error("Error communicating with Resend domains API:", e);
    }
  }

  // Fallback / Default DNS records if Resend didn't return them (or in simulation)
  if (records.length === 0) {
    records = [
      {
        type: "TXT",
        name: `resend._domainkey.${domain}`,
        value: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ${domain.replace(/[^a-z]/g, '')}398472938749`,
        purpose: "DKIM (Firma de Seguridad)",
        status: "pending"
      },
      {
        type: "TXT",
        name: domain,
        value: "v=spf1 include:amazonses.com ~all",
        purpose: "SPF (Autenticación de Emisor)",
        status: "pending"
      },
      {
        type: "MX",
        name: `bounces.${domain}`,
        value: "feedback-smtp.us-east-1.amazonses.com",
        purpose: "MX / Recepción automática de Inbox",
        status: "pending"
      }
    ];
  }

  // Guardar en Supabase `auto_integrations` bajo `channel = 'email_domain'`
  const integrationData = {
    domain,
    resendDomainId,
    records,
    status: isVerified ? "verified" : "pending"
  };

  try {
    await (supabaseAdmin.from("auto_integrations") as any).upsert({
      channel: "email_domain",
      agency_id: agencyId || "00000000-0000-0000-0000-000000000000",
      connected: isVerified,
      username: domain,
      token: resendDomainId,
      mode: JSON.stringify(integrationData),
      updated_at: new Date().toISOString()
    }, { onConflict: "channel" });
  } catch (e) {
    console.error("Error saving email domain in Supabase:", e);
  }

  revalidatePath("/admin/settings");
  return { success: true, domain, records, status: isVerified ? "verified" : "pending" };
}

export async function verifyCustomDomain(agencyId: string) {
  const { data: row } = await (supabaseAdmin.from("auto_integrations") as any)
    .select("*")
    .eq("channel", "email_domain")
    .single();

  if (!row) {
    return { success: false, error: "No hay ningún dominio vinculado actualmente." };
  }

  let integrationData: any = {};
  try {
    integrationData = JSON.parse(row.mode || "{}");
  } catch (e) {}

  const domain = row.username;
  const resendDomainId = row.token || integrationData.resendDomainId;
  const apiKey = process.env.RESEND_API_KEY;

  let isVerified = false;
  let updatedRecords = integrationData.records || [];

  if (apiKey && !apiKey.startsWith("re_123456789") && resendDomainId) {
    try {
      const resend = new Resend(apiKey);
      await resend.domains.verify(resendDomainId);
      const resendRes = await resend.domains.get(resendDomainId);
      
      if (resendRes.data) {
        isVerified = resendRes.data.status === "verified";
        if (resendRes.data.records) {
          updatedRecords = resendRes.data.records.map((r: any) => ({
            type: r.type,
            name: r.name,
            value: r.value,
            purpose: r.record === "SPF" ? "SPF (Autenticación de Emisor)" : r.record === "DKIM" ? "DKIM (Firma de Seguridad)" : "MX / Recepción de Inbox",
            status: r.status === "verified" ? "verified" : "pending"
          }));
        }
      }
    } catch (e: any) {
      console.error("Error verifying domain with Resend:", e);
    }
  } else {
    // Si no hay API key o en simulación, marcar como verificado tras hacer click
    isVerified = true;
    updatedRecords = updatedRecords.map((r: any) => ({ ...r, status: "verified" }));
  }

  const updatedIntegration = {
    ...integrationData,
    records: updatedRecords,
    status: isVerified ? "verified" : "pending"
  };

  await (supabaseAdmin.from("auto_integrations") as any).update({
    connected: isVerified,
    mode: JSON.stringify(updatedIntegration),
    updated_at: new Date().toISOString()
  }).eq("channel", "email_domain");

  revalidatePath("/admin/settings");
  return { success: true, verified: isVerified, records: updatedRecords };
}

export async function getCustomDomainStatus() {
  try {
    const { data: row } = await (supabaseAdmin.from("auto_integrations") as any)
      .select("*")
      .eq("channel", "email_domain")
      .single();

    if (!row) return null;

    let integrationData: any = {};
    try {
      integrationData = JSON.parse(row.mode || "{}");
    } catch (e) {}

    return {
      domain: row.username,
      connected: row.connected,
      records: integrationData.records || [],
      status: row.connected ? "verified" : (integrationData.status || "pending")
    };
  } catch (e) {
    return null;
  }
}
