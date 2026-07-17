"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import {
  leadSchema,
  contactFormSchema,
  agentSchema,
  eventSchema,
  googleConfigSchema,
  rentalSchema,
  ticketSchema
} from "@/lib/schemas";

// --- CRM & LEADS ---
export async function getLeads() {
  const { data, error } = await (supabase.from("leads") as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (!error && data) {
    return (data as any[]).map(lead => ({
      ...(lead as any),
      property: (lead as any).property || "Contacto General",
      time: "Reciente"
    }));
  }
  return [];
}

export async function createLead(lead: { name: string, property: string, status: string }) {
  const validationResult = leadSchema.safeParse(lead);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const { data, error } = await (supabase.from("leads") as any)
    .insert({
      agency_id: "00000000-0000-0000-0000-000000000000",
      name: validatedData.name,
      status: validatedData.status,
    } as any)
    .select()
    .single();

  if (!error && data) {
    revalidatePath("/realstate/admin/crm");
    return { success: true, data: { ...(data as any), property: validatedData.property, time: "Ahora" } };
  }
  return { success: false, error: "Error creating lead" };
}

export async function submitContactForm(leadData: {
  name: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  propertyName?: string;
  message?: string;
}) {
  const validationResult = contactFormSchema.safeParse(leadData);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const { data: newLead, error } = await (supabase.from("leads") as any)
    .insert({
      agency_id: "00000000-0000-0000-0000-000000000000",
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      property_id: validatedData.propertyId || null,
      status: "nuevo"
    } as any)
    .select()
    .single();

  if (error || !newLead) {
    return { success: false, error: "Error creating lead" };
  }

  if (validatedData.message) {
    await (supabase.from("conversations") as any).insert({
      lead_id: (newLead as any).id,
      body: validatedData.message,
      direction: "inbound",
      channel: "form",
      sent_at: new Date().toISOString(),
    } as any);
  }

  revalidatePath("/realstate/admin/crm");
  revalidatePath("/realstate/admin/messages");
  return { success: true, data: { ...(newLead as any), property: validatedData.propertyName || "Contacto General", time: "Ahora" } };
}

export async function getLeadById(leadId: string) {
  const { data, error } = await (supabase.from("leads") as any).select("*").eq("id", leadId).single();
  if (!error && data) return data as any;
  return null;
}

export async function getConversation(leadId: string) {
  const { data, error } = await (supabase.from("conversations") as any).select("*").eq("lead_id", leadId).order("sent_at", { ascending: true });
  if (!error && data) return data as any[];
  return [];
}

export async function saveOutboundMessage(leadId: string, body: string) {
  const { data: msg, error } = await (supabase.from("conversations") as any).insert({
    lead_id: leadId,
    body,
    direction: "outbound",
    channel: "whatsapp",
    sent_at: new Date().toISOString(),
  } as any).select().single();

  if (error) return { success: false, error: "Error saving message" };

  const { data: lead } = await (supabase.from("leads") as any).select("*").eq("id", leadId).single();
  if (lead && (lead.status === "Nuevo" || lead.status === "nuevo")) {
    await (supabase.from("leads") as any).update({ status: "Contactado" }).eq("id", leadId);
  }

  revalidatePath("/realstate/admin/messages");
  revalidatePath("/realstate/admin/crm");
  return { success: true, data: msg as any };
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  let mappedStatus = newStatus.toLowerCase();
  if (mappedStatus === "negociación") mappedStatus = "negociacion";
  
  const { data, error } = await (supabase.from("leads") as any)
    .update({ status: mappedStatus })
    .eq("id", leadId)
    .select()
    .single();

  if (!error && data) {
    revalidatePath("/realstate/admin/crm");
    return { success: true, data };
  }
  return { success: false, error: "Lead no encontrado o error" };
}

export async function updateLead(leadId: string, updates: any) {
  const mappedUpdates = { ...updates };
  if (mappedUpdates.status) {
    let mappedStatus = mappedUpdates.status.toLowerCase();
    if (mappedStatus === "negociación") mappedStatus = "negociacion";
    mappedUpdates.status = mappedStatus;
  }
  
  const { data, error } = await (supabase.from("leads") as any)
    .update(mappedUpdates)
    .eq("id", leadId)
    .select()
    .single();

  if (!error && data) {
    revalidatePath("/realstate/admin/crm");
    return { success: true, data };
  }
  return { success: false, error: "Lead no encontrado o error" };
}

// --- AGENTS ---
export async function getAgents() {
  const { data, error } = await (supabase.from("users") as any).select("*");
  if (!error && data) return data as any[];
  return [];
}

export async function createAgent(agent: { name: string, email: string, role: string }) {
  const validationResult = agentSchema.safeParse(agent);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const { data, error } = await (supabase.from("users") as any).insert({
    name: validatedData.name,
    email: validatedData.email,
    role: validatedData.role,
    status: "active",
    agency_id: "demo-agency-id",
  } as any).select().single();

  if (!error && data) {
    revalidatePath("/realstate/admin/agents");
    return { success: true, data: data as any };
  }
  return { success: false, error: "Error creating agent" };
}

export async function updateAgent(agentId: string, updates: any) {
  const { data, error } = await (supabase.from("users") as any).update(updates).eq("id", agentId).select().single();
  if (!error && data) {
    revalidatePath("/realstate/admin/agents");
    return { success: true, data: data as any };
  }
  return { success: false, error: "Agente no encontrado o error" };
}

// --- CALENDAR & EVENTS ---
export async function getEvents() {
  const { data, error } = await (supabase.from("events") as any)
    .select("*")
    .order("event_date", { ascending: true });
  
  if (!error && data) {
    return (data as any[]).map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      type: evt.event_type,
      start: evt.event_date,
      end: new Date(new Date(evt.event_date).getTime() + 60 * 60 * 1000).toISOString()
    }));
  }
  return [];
}

export async function createEvent(event: { title: string, start: string, end: string, type: string }) {
  const validationResult = eventSchema.safeParse(event);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const { data, error } = await (supabase.from("events") as any)
    .insert({
      agency_id: "00000000-0000-0000-0000-000000000000",
      title: validatedData.title,
      event_type: validatedData.type as any,
      event_date: validatedData.start,
    } as any)
    .select()
    .single();

  if (!error && data) {
    revalidatePath("/realstate/admin/calendar");
    return {
      success: true,
      data: {
        id: (data as any).id,
        title: (data as any).title,
        type: (data as any).event_type,
        start: (data as any).event_date,
        end: new Date(new Date((data as any).event_date).getTime() + 60 * 60 * 1000).toISOString()
      }
    };
  }
  return { success: false, error: "Error creating event" };
}

// --- OFFERS ---
export async function getOffers() {
  const { data, error } = await (supabase.from("offers") as any).select("*");
  if (!error && data) return data as any[];
  return [];
}

export async function updateOfferStatus(offerId: string, status: string) {
  const { error } = await (supabase.from("offers") as any).update({ status } as any).eq("id", offerId);
  if (!error) {
    revalidatePath("/realstate/admin/offers");
    return { success: true };
  }
  return { success: false };
}


// --- TICKETS & SUPPORT ---
export async function getTickets() {
  const { data, error } = await (supabase.from("tickets") as any).select("*");
  if (!error && data) return data as any[];
  return [];
}

export async function createTicket(ticket: { title: string, desc: string, priority: string }) {
  const validationResult = ticketSchema.safeParse(ticket);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const { data, error } = await (supabase.from("tickets") as any).insert({
    title: validatedData.title,
    desc: validatedData.desc,
    priority: validatedData.priority,
    agency_id: "demo-agency-id",
    stage: "Pendiente",
  } as any).select().single();

  if (!error && data) {
    revalidatePath("/realstate/admin/support");
    return { success: true, data: data as any };
  }
  return { success: false, error: "Error creating ticket" };
}

// --- GOOGLE CALENDAR OAUTH ---
export async function getGoogleConfig() {
  const { data, error } = await (supabase.from("google_config") as any).select("*").single();
  if (!error && data) return data as any;
  return null;
}

export async function saveGoogleConfig(clientId: string, clientSecret: string) {
  const validationResult = googleConfigSchema.safeParse({ clientId, clientSecret });
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const config = {
    clientId: validatedData.clientId,
    clientSecret: validatedData.clientSecret,
    accessToken: "",
    refreshToken: "",
    tokenExpiry: 0,
  };
  
  const { error: updateError } = await (supabase.from("google_config") as any).update(config as any).neq("id", "0"); 
  if (updateError) {
    await (supabase.from("google_config") as any).insert(config as any);
  }

  revalidatePath("/realstate/admin/calendar");
  return { success: true };
}

export async function disconnectGoogle() {
  const { error } = await (supabase.from("google_config") as any).update({
    accessToken: "",
    refreshToken: "",
    tokenExpiry: 0,
  } as any).neq("id", "0"); 
  
  if (!error) {
    revalidatePath("/realstate/admin/calendar");
    return { success: true };
  }
  return { success: false, error: "Error disconnecting" };
}

async function refreshGoogleAccessToken(config: any) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      config.accessToken = data.access_token;
      config.tokenExpiry = Date.now() + data.expires_in * 1000;
      return config.accessToken;
    }
  } catch (e) {
    console.error("Error refreshing Google access token:", e);
  }
  return null;
}

export async function getGoogleEvents() {
  const config = await getGoogleConfig();
  if (!config || !config.refreshToken) return [];

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000; 

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      await (supabase.from("google_config") as any).update({
        accessToken: config.accessToken,
        tokenExpiry: config.tokenExpiry
      } as any).neq("id", "0");
    }
  }

  if (!token) return [];

  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=100&orderBy=startTime&singleEvents=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (data.items) {
      return data.items.map((item: any) => ({
        id: `gcal-${item.id}`,
        title: item.summary || "Sin Título (Google Calendar)",
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        type: "google",
      }));
    }
  } catch (e) {
    console.error("Error fetching Google Calendar events:", e);
  }
  return [];
}

export async function deleteEvent(eventId: string) {
  const { error } = await (supabase.from("events") as any).delete().eq("id", eventId);
  if (!error) {
    revalidatePath("/realstate/admin/calendar");
    return { success: true };
  }
  return { success: false, error: "Evento no encontrado o error" };
}

export async function createGoogleEvent(event: { title: string, start: string, end: string, type: string }) {
  const config = await getGoogleConfig();
  if (!config || !config.refreshToken) return { success: false, error: "No conectado" };

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000;

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      await (supabase.from("google_config") as any).update({
        accessToken: config.accessToken,
        tokenExpiry: config.tokenExpiry
      } as any).neq("id", "0");
    }
  }

  if (!token) return { success: false, error: "No autorizado" };

  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: "Creado desde CRM Inmobiliario",
        start: { dateTime: event.start },
        end: { dateTime: event.end },
      }),
    });
    const data = await res.json();
    if (data.id) {
      revalidatePath("/realstate/admin/calendar");
      return {
        success: true,
        data: {
          id: `gcal-${data.id}`,
          title: data.summary || "Sin Título",
          start: data.start.dateTime || data.start.date,
          end: data.end.dateTime || data.end.date,
          type: "google",
        }
      };
    } else {
      console.error("Google Calendar Event Creation Failed:", data);
      return { success: false, error: data.error?.message || JSON.stringify(data) };
    }
  } catch (e: any) {
    console.error("Error creating Google event:", e);
    return { success: false, error: e.message || "Excepción de API" };
  }
}

export async function deleteGoogleEvent(gcalId: string) {
  const config = await getGoogleConfig();
  if (!config || !config.refreshToken) return { success: false, error: "No conectado" };

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000;

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      await (supabase.from("google_config") as any).update({
        accessToken: config.accessToken,
        tokenExpiry: config.tokenExpiry
      } as any).neq("id", "0");
    }
  }

  if (!token) return { success: false, error: "No autorizado" };

  try {
    const rawId = gcalId.replace("gcal-", "");
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${rawId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || res.status === 200) {
      revalidatePath("/realstate/admin/calendar");
      return { success: true };
    }
  } catch (e) {
    console.error("Error deleting Google event:", e);
  }
  return { success: false, error: "Error de API" };
}

// --- LEAD INTERACTIONS (BITÁCORA) ---

export async function getLeadInteractions(leadId: string) {
  const { data, error } = await (supabase.from("lead_interactions") as any).select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
  if (!error && data) return data as any[];
  return [];
}

export async function createLeadInteraction(leadId: string, content: string, type: string) {
  if (!leadId || !content || !type) {
    return { success: false, error: "Faltan parámetros obligatorios" };
  }

  let agentName = "Sistema";
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;
    if (token) {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      agentName = decoded.name || "Agente";
    }
  } catch (e) {
    console.error("Error decoding session in createLeadInteraction:", e);
  }

  const { data, error } = await (supabase.from("lead_interactions") as any).insert({
    lead_id: leadId,
    agent_name: agentName,
    type,
    content,
    created_at: new Date().toISOString(),
  } as any).select().single();

  if (!error && data) {
    revalidatePath("/realstate/admin/crm");
    revalidatePath("/realstate/admin/messages");
    return { success: true, data: data as any };
  }
  return { success: false, error: "Error creating interaction" };
}
