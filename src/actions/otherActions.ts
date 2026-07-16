"use server";

import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";
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

const isSupabaseActive = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && !url.includes("mock-project") && key && !key.includes("mock-anon-key"));
};

// --- CRM & LEADS ---
export async function getLeads() {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return (data as any[]).map(lead => ({
          ...(lead as any),
          property: (lead as any).property || "Contacto General",
          time: "Reciente"
        }));
      }
    } catch (e) {
      console.error("Supabase getLeads error:", e);
    }
  }
  const db = getDb();
  return db.leads;
}

export async function createLead(lead: { name: string, property: string, status: string }) {
  const validationResult = leadSchema.safeParse(lead);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("leads")
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
    } catch (e) {
      console.error("Supabase createLead error:", e);
    }
  }

  const db = getDb();
  const newLead = {
    name: validatedData.name,
    property: validatedData.property,
    status: validatedData.status,
    id: `lead-${Date.now()}`,
    time: "Ahora",
    agency_id: "demo-agency-id",
  };
  db.leads.push(newLead);
  saveDb(db);
  revalidatePath("/realstate/admin/crm");
  return { success: true, data: newLead };
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

  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("leads")
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
      if (!error && data) {
        revalidatePath("/realstate/admin/crm");
        return { success: true, data: { ...(data as any), property: validatedData.propertyName || "Contacto General", time: "Ahora" } };
      }
    } catch (e) {
      console.error("Supabase submitContactForm error:", e);
    }
  }

  const db = getDb();
  const newLead = {
    id: `lead-${Date.now()}`,
    agency_id: "demo-agency-id",
    name: validatedData.name,
    email: validatedData.email || "",
    phone: validatedData.phone || "",
    property: validatedData.propertyName || "Contacto General",
    property_id: validatedData.propertyId || null,
    message: validatedData.message || "",
    time: "Ahora",
    status: "nuevo"
  };
  db.leads.push(newLead);

  // Crear primer mensaje de la conversación (inbound, del lead)
  if (validatedData.message) {
    if (!db.conversations) db.conversations = [];
    db.conversations.push({
      id: `msg-${Date.now()}`,
      lead_id: newLead.id,
      body: leadData.message,
      direction: "inbound",
      channel: "form",
      sent_at: new Date().toISOString(),
    });
  }

  saveDb(db);
  revalidatePath("/realstate/admin/crm");
  revalidatePath("/realstate/admin/messages");
  return { success: true, data: newLead };
}

export async function getLeadById(leadId: string) {
  const db = getDb();
  return db.leads.find((l) => l.id === leadId) || null;
}

export async function getConversation(leadId: string) {
  const db = getDb();
  if (!db.conversations) return [];
  return db.conversations.filter((m: any) => m.lead_id === leadId);
}

export async function saveOutboundMessage(leadId: string, body: string) {
  const db = getDb();
  if (!db.conversations) db.conversations = [];

  const msg = {
    id: `msg-${Date.now()}`,
    lead_id: leadId,
    body,
    direction: "outbound",
    channel: "whatsapp",
    sent_at: new Date().toISOString(),
  };
  db.conversations.push(msg);

  // Mover el lead a estado "Contactado" si estaba en "Nuevo"
  const leadIndex = db.leads.findIndex((l: any) => l.id === leadId);
  if (leadIndex !== -1 && (db.leads[leadIndex].status === "Nuevo" || db.leads[leadIndex].status === "nuevo")) {
    db.leads[leadIndex].status = "Contactado";
  }

  saveDb(db);
  revalidatePath("/realstate/admin/messages");
  revalidatePath("/realstate/admin/crm");
  return { success: true, data: msg };
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  if (isSupabaseActive() && !leadId.startsWith("lead-")) {
    try {
      let mappedStatus = newStatus.toLowerCase();
      if (mappedStatus === "negociación") mappedStatus = "negociacion";
      const { data, error } = await (supabase.from("leads") as any)
        .update({ status: mappedStatus } as any)
        .eq("id", leadId)
        .select()
        .single();
      if (!error && data) {
        revalidatePath("/realstate/admin/crm");
        return { success: true, data };
      }
    } catch (e) {
      console.error("Supabase updateLeadStatus error:", e);
    }
  }

  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === leadId);
  if (index !== -1) {
    db.leads[index].status = newStatus;
    saveDb(db);
    revalidatePath("/realstate/admin/crm");
    return { success: true, data: db.leads[index] };
  }
  return { success: false, error: "Lead no encontrado" };
}

export async function updateLead(leadId: string, updates: any) {
  if (isSupabaseActive() && !leadId.startsWith("lead-")) {
    try {
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
      if (error) throw error;
    } catch (e) {
      console.error("Supabase updateLead error:", e);
      return { success: false, error: "Error de Supabase" };
    }
  }

  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === leadId);
  if (index !== -1) {
    db.leads[index] = {
      ...db.leads[index],
      ...updates
    };
    saveDb(db);
    revalidatePath("/realstate/admin/crm");
    return { success: true, data: db.leads[index] };
  }
  return { success: false, error: "Lead no encontrado" };
}

// --- AGENTS ---
export async function getAgents() {
  const db = getDb();
  return db.users;
}

export async function createAgent(agent: { name: string, email: string, role: string }) {
  const validationResult = agentSchema.safeParse(agent);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const db = getDb();
  const newAgent = {
    name: validatedData.name,
    email: validatedData.email,
    role: validatedData.role,
    id: `agent-${Date.now()}`,
    status: "active",
    agency_id: "demo-agency-id",
    created_at: new Date().toISOString(),
  };
  db.users.push(newAgent);
  saveDb(db);
  revalidatePath("/realstate/admin/agents");
  return { success: true, data: newAgent };
}

export async function updateAgent(agentId: string, updates: any) {
  const db = getDb();
  const index = db.users.findIndex(u => u.id === agentId);
  if (index !== -1) {
    db.users[index] = {
      ...db.users[index],
      ...updates
    };
    saveDb(db);
    revalidatePath("/realstate/admin/agents");
    return { success: true, data: db.users[index] };
  }
  return { success: false, error: "Agente no encontrado" };
}


// --- CALENDAR & EVENTS ---
export async function getEvents() {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (!error && data) {
        return (data as any[]).map((evt: any) => ({
          id: evt.id,
          title: evt.title,
          description: evt.description,
          type: evt.event_type, // 'visita' | 'reunion' | 'llamada'
          start: evt.event_date,
          end: new Date(new Date(evt.event_date).getTime() + 60 * 60 * 1000).toISOString() // +1 hr default
        }));
      }
    } catch (e) {
      console.error("Supabase getEvents error:", e);
    }
  }
  const db = getDb();
  return db.events;
}

export async function createEvent(event: { title: string, start: string, end: string, type: string }) {
  const validationResult = eventSchema.safeParse(event);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("events")
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
    } catch (e) {
      console.error("Supabase createEvent error:", e);
    }
  }

  const db = getDb();
  const newEvent = {
    title: validatedData.title,
    start: validatedData.start,
    end: validatedData.end,
    type: validatedData.type,
    id: `evt-${Date.now()}`,
    agency_id: "demo-agency-id",
  };
  db.events.push(newEvent);
  saveDb(db);
  revalidatePath("/realstate/admin/calendar");
  return { success: true, data: newEvent };
}


// --- OFFERS ---
export async function getOffers() {
  const db = getDb();
  return db.offers;
}

export async function updateOfferStatus(offerId: string, status: string) {
  const db = getDb();
  const index = db.offers.findIndex(o => o.id === offerId);
  if (index !== -1) {
    db.offers[index].status = status;
    saveDb(db);
    revalidatePath("/realstate/admin/offers");
    return { success: true };
  }
  return { success: false };
}

// --- RENTALS ---
export async function getRentals() {
  const db = getDb();
  return db.rentals;
}

export async function createRental(rental: { property: string, tenant: string, price: number, currency: string, endDate: string }) {
  const validationResult = rentalSchema.safeParse(rental);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const db = getDb();
  const newRental = {
    property: validatedData.property,
    tenant: validatedData.tenant,
    price: validatedData.price,
    currency: validatedData.currency,
    endDate: validatedData.endDate,
    id: `ren-${Date.now()}`,
    status: "activo",
    agency_id: "demo-agency-id",
  };
  db.rentals.push(newRental);
  saveDb(db);
  revalidatePath("/realstate/admin/rentals");
  return { success: true, data: newRental };
}


// --- TICKETS & SUPPORT ---
export async function getTickets() {
  const db = getDb();
  return db.tickets;
}

export async function createTicket(ticket: { title: string, desc: string, priority: string }) {
  const validationResult = ticketSchema.safeParse(ticket);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const db = getDb();
  const newTicket = {
    title: validatedData.title,
    desc: validatedData.desc,
    priority: validatedData.priority,
    id: `tkt-${Date.now()}`,
    agency_id: "demo-agency-id",
    stage: "Pendiente",
  };
  db.tickets.push(newTicket);
  saveDb(db);
  revalidatePath("/realstate/admin/support");
  return { success: true, data: newTicket };
}

// --- GOOGLE CALENDAR OAUTH ---
export async function getGoogleConfig() {
  const db = getDb();
  return db.google_config || null;
}

export async function saveGoogleConfig(clientId: string, clientSecret: string) {
  const validationResult = googleConfigSchema.safeParse({ clientId, clientSecret });
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validatedData = validationResult.data;

  const db = getDb();
  db.google_config = {
    clientId: validatedData.clientId,
    clientSecret: validatedData.clientSecret,
    accessToken: "",
    refreshToken: "",
    tokenExpiry: 0,
  };
  saveDb(db);
  revalidatePath("/realstate/admin/calendar");
  return { success: true };
}

export async function disconnectGoogle() {
  const db = getDb();
  if (db.google_config) {
    db.google_config.accessToken = "";
    db.google_config.refreshToken = "";
    db.google_config.tokenExpiry = 0;
    saveDb(db);
  }
  revalidatePath("/realstate/admin/calendar");
  return { success: true };
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
  const db = getDb();
  const config = db.google_config;
  if (!config || !config.refreshToken) return [];

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000; // 5 mins buffer

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      db.google_config = config;
      saveDb(db);
    }
  }

  if (!token) return [];

  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 días atrás
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
  if (isSupabaseActive() && !eventId.startsWith("evt-")) {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (!error) {
        revalidatePath("/realstate/admin/calendar");
        return { success: true };
      }
    } catch (e) {
      console.error("Supabase deleteEvent error:", e);
    }
  }

  const db = getDb();
  const index = db.events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    db.events.splice(index, 1);
    saveDb(db);
    revalidatePath("/realstate/admin/calendar");
    return { success: true };
  }
  return { success: false, error: "Evento no encontrado" };
}

export async function createGoogleEvent(event: { title: string, start: string, end: string, type: string }) {
  const db = getDb();
  const config = db.google_config;
  if (!config || !config.refreshToken) return { success: false, error: "No conectado" };

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000;

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      db.google_config = config;
      saveDb(db);
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
  const db = getDb();
  const config = db.google_config;
  if (!config || !config.refreshToken) return { success: false, error: "No conectado" };

  let token = config.accessToken;
  const isExpired = !config.tokenExpiry || Date.now() >= config.tokenExpiry - 300000;

  if (isExpired) {
    token = await refreshGoogleAccessToken(config);
    if (token) {
      db.google_config = config;
      saveDb(db);
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
import { cookies } from "next/headers";

export async function getLeadInteractions(leadId: string) {
  const db = getDb();
  if (!db.lead_interactions) db.lead_interactions = [];
  
  const interactions = db.lead_interactions.filter((i: any) => i.lead_id === leadId);
  return interactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createLeadInteraction(leadId: string, content: string, type: string) {
  if (!leadId || !content || !type) {
    return { success: false, error: "Faltan parámetros obligatorios" };
  }

  const db = getDb();
  if (!db.lead_interactions) db.lead_interactions = [];

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

  const newInteraction = {
    id: `int-${Date.now()}`,
    lead_id: leadId,
    agent_name: agentName,
    type,
    content,
    created_at: new Date().toISOString(),
  };

  db.lead_interactions.push(newInteraction);
  saveDb(db);
  
  revalidatePath("/realstate/admin/crm");
  revalidatePath("/realstate/admin/messages");

  return { success: true, data: newInteraction };
}

