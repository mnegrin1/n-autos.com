"use server";

import { cookies } from "next/headers";
import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";

export async function getDevelopments() {
  const db = getDb();
  return db.developments || [];
}

export async function getDevelopmentById(id: string) {
  const db = getDb();
  return (db.developments || []).find((d: any) => d.id === id || d.slug === id) || null;
}

export async function getLotsByDevelopment(developmentId: string) {
  const db = getDb();
  return (db.lots || []).filter((l: any) => l.development_id === developmentId);
}

export async function loginOwner(email: string) {
  if (!email) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  const db = getDb();
  // Buscar si este email posee algún lote en los desarrollos
  const lot = (db.lots || []).find(
    (l: any) => l.owner_email && l.owner_email.toLowerCase() === email.toLowerCase()
  );

  if (!lot) {
    return {
      success: false,
      error: "No se encontraron lotes registrados bajo este correo electrónico de propietario.",
    };
  }

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
  const db = getDb();
  
  // Buscar lotes del propietario
  const ownerLots = (db.lots || []).filter(
    (l: any) => l.owner_email && l.owner_email.toLowerCase() === email.toLowerCase()
  );

  if (ownerLots.length === 0) {
    return { lots: [], developments: [], notifications: [] };
  }

  // IDs de los desarrollos asociados
  const devIds = Array.from(new Set(ownerLots.map((l: any) => l.development_id)));

  // Buscar los desarrollos
  const developments = (db.developments || []).filter((d: any) => devIds.includes(d.id));

  // Buscar comunicados/notificaciones para estos desarrollos
  const notifications = (db.notifications || []).filter(
    (n: any) => devIds.includes(n.development_id)
  ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    lots: ownerLots,
    developments,
    notifications,
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

  const db = getDb();
  const lot = (db.lots || []).find((l: any) => l.id === inquiry.lotId);
  const dev = lot ? (db.developments || []).find((d: any) => d.id === lot.development_id) : null;
  
  // Registrar consulta en los leads del CRM para que la inmobiliaria la atienda
  const newLead = {
    id: `lead-${Date.now()}`,
    agency_id: "demo-agency-id",
    name: `Propietario (${inquiry.email})`,
    email: inquiry.email,
    property: `${dev ? dev.name : "Desarrollo"} - ${lot ? lot.number : "Lote"}`,
    property_id: lot ? lot.id : "",
    message: `Consulta de propietario sobre entrega de lote: ${inquiry.message}`,
    status: "Nuevo",
    time: "Ahora",
    created_at: new Date().toISOString(),
  };

  db.leads.push(newLead);
  saveDb(db);

  revalidatePath("/realstate/desarrollos/dashboard");
  return { success: true };
}
