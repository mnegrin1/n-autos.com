"use server";

import { cookies } from "next/headers";
import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";
import { tenantTicketSchema } from "@/lib/schemas";

export async function loginTenant(email: string) {
  if (!email) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  const db = getDb();
  // Buscar un contrato de alquiler activo que tenga este email de inquilino
  const rental = db.rentals.find(
    (r: any) => r.tenant_email && r.tenant_email.toLowerCase() === email.toLowerCase()
  );

  if (!rental) {
    return {
      success: false,
      error: "No se encontró ningún contrato de alquiler asociado a este correo electrónico.",
    };
  }

  // Generar sesión en base64
  const sessionData = {
    email: rental.tenant_email,
    name: rental.tenant,
    rentalId: rental.id,
  };
  const token = Buffer.from(JSON.stringify(sessionData)).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set("tenant-session", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  return { success: true, user: sessionData };
}

export async function logoutTenant() {
  const cookieStore = await cookies();
  cookieStore.delete("tenant-session");
  return { success: true };
}

export async function getCurrentTenant() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tenant-session")?.value;
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function getTenantDetails(email: string) {
  const db = getDb();
  
  // Buscar contrato de alquiler
  const rental = db.rentals.find(
    (r: any) => r.tenant_email && r.tenant_email.toLowerCase() === email.toLowerCase()
  );

  if (!rental) {
    return { rental: null, payments: [], tickets: [] };
  }

  // Buscar pagos asociados a este contrato
  const payments = (db.payments || []).filter(
    (p: any) => p.rental_id === rental.id
  );

  // Buscar tickets asociados a este inquilino
  const tickets = (db.tickets || []).filter(
    (t: any) => t.tenant_email && t.tenant_email.toLowerCase() === email.toLowerCase()
  );

  return { rental, payments, tickets };
}

export async function toggleAutoDebit(rentalId: string, enabled: boolean) {
  const db = getDb();
  const rentalIndex = db.rentals.findIndex((r: any) => r.id === rentalId);
  
  if (rentalIndex === -1) {
    return { success: false, error: "Contrato no encontrado" };
  }

  db.rentals[rentalIndex].automatic_debit = enabled;
  saveDb(db);
  
  revalidatePath("/realstate/alquiler/dashboard");
  return { success: true, automatic_debit: enabled };
}

export async function payRentInvoice(paymentId: string, method: string) {
  const db = getDb();
  if (!db.payments) {
    db.payments = [];
  }
  
  const paymentIndex = db.payments.findIndex((p: any) => p.id === paymentId);
  
  if (paymentIndex === -1) {
    return { success: false, error: "Factura de pago no encontrada" };
  }

  const payment = db.payments[paymentIndex];
  db.payments[paymentIndex] = {
    ...payment,
    status: "pagado",
    payment_date: new Date().toISOString(),
    payment_method: method,
    receipt_url: `/receipts/rec-${paymentId}.pdf`
  };

  saveDb(db);
  
  revalidatePath("/realstate/alquiler/dashboard");
  return { success: true, data: db.payments[paymentIndex] };
}

export async function createTenantTicket(ticket: {
  title: string;
  desc: string;
  priority: "Alta" | "Media" | "Baja";
  tenantEmail: string;
}) {
  const validationResult = tenantTicketSchema.safeParse(ticket);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }
  const validated = validationResult.data;

  const db = getDb();
  
  const newTicket = {
    id: `tkt-${Date.now()}`,
    agency_id: "demo-agency-id",
    title: validated.title,
    desc: validated.desc,
    priority: validated.priority,
    stage: "Pendiente",
    tenant_email: validated.tenantEmail.toLowerCase(),
    created_at: new Date().toISOString(),
    replies: []
  };

  db.tickets.push(newTicket);
  saveDb(db);

  revalidatePath("/realstate/alquiler/dashboard");
  return { success: true, data: newTicket };
}
