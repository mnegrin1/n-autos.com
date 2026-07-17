"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function getDevelopments() {
  const { data, error } = await (supabase.from('developments') as any).select('*');
  if (error) {
    console.error("Error fetching developments:", error);
    return [];
  }
  return data || [];
}

export async function getDevelopmentById(id: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  if (isUUID) {
    const { data } = await (supabase.from('developments') as any)
      .select('*')
      .eq('id', id)
      .single();
    if (data) return data;
  }
  
  const { data } = await (supabase.from('developments') as any)
    .select('*')
    .eq('slug', id)
    .single();
    
  return data || null;
}

export async function getLotsByDevelopment(developmentId: string) {
  const { data, error } = await (supabase.from('lots') as any)
    .select('*')
    .eq('development_id', developmentId);
  
  if (error) {
    console.error("Error fetching lots:", error);
    return [];
  }
  return data || [];
}

export async function loginOwner(email: string) {
  if (!email) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  // Buscar si este email posee algún lote en los desarrollos
  const { data, error } = await (supabase.from('lots') as any)
    .select('*')
    .ilike('owner_email', email)
    .limit(1);

  if (error || !data || data.length === 0) {
    return {
      success: false,
      error: "No se encontraron lotes registrados bajo este correo electrónico de propietario.",
    };
  }

  const lot = data[0];

  const sessionData = {
    email: lot.owner_email.toLowerCase(),
  };
  const token = Buffer.from(JSON.stringify(sessionData)).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set("owner-session", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  return { success: true, user: sessionData };
}

export async function logoutOwner() {
  const cookieStore = await cookies();
  cookieStore.delete("owner-session");
  return { success: true };
}

export async function getCurrentOwner() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("owner-session")?.value;
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function getOwnerDashboardData(email: string) {
  const { data: ownerLots, error: lotsError } = await (supabase.from('lots') as any)
    .select('*')
    .ilike('owner_email', email);

  if (lotsError || !ownerLots || ownerLots.length === 0) {
    return { lots: [], developments: [], notifications: [] };
  }

  // IDs de los desarrollos asociados
  const devIds = Array.from(new Set(ownerLots.map((l: any) => l.development_id)));

  const { data: developments } = await (supabase.from('developments') as any)
    .select('*')
    .in('id', devIds);

  const { data: notifications } = await (supabase.from('notifications') as any)
    .select('*')
    .in('development_id', devIds)
    .order('created_at', { ascending: false });

  return {
    lots: ownerLots,
    developments: developments || [],
    notifications: notifications || [],
  };
}

export async function submitOwnerInquiry(inquiry: {
  lotId: string;
  email: string;
  message: string;
}) {
  if (!inquiry.message || inquiry.message.length < 5) {
    return { success: false, error: "El mensaje debe tener al menos 5 caracteres." };
  }

  const { data: lot } = await (supabase.from('lots') as any)
    .select('*')
    .eq('id', inquiry.lotId)
    .single();

  let dev = null;
  if (lot) {
    const { data: devData } = await (supabase.from('developments') as any)
      .select('*')
      .eq('id', lot.development_id)
      .single();
    dev = devData;
  }
  
  // Registrar consulta en los leads del CRM para que la inmobiliaria la atienda
  const newLead = {
    agency_id: "demo-agency-id",
    name: `Propietario (${inquiry.email})`,
    email: inquiry.email,
    property: `${dev ? dev.name : "Desarrollo"} - ${lot ? lot.number : "Lote"}`,
    property_id: lot ? lot.id : null,
    message: `Consulta de propietario sobre entrega de lote: ${inquiry.message}`,
    status: "Nuevo",
    time: "Ahora",
    created_at: new Date().toISOString(),
  };

  const { error } = await (supabase.from('leads') as any).insert(newLead);
  if (error) {
    console.error("Error inserting lead:", error);
    return { success: false, error: "Error al registrar la consulta." };
  }

  revalidatePath("/realstate/desarrollos/dashboard");
  return { success: true };
}
