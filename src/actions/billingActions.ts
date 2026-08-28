"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export interface PlanConfig {
  id: "starter" | "pro" | "enterprise";
  name: string;
  priceUYU: number; // MercadoPago
  priceUSD: number; // PayPal
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Plan Starter",
    priceUYU: 2490,
    priceUSD: 65,
    features: ["Hasta 25 vehículos", "1 Usuario", "Portal Web de la Automotora", "Sincronización MercadoLibre básico"],
  },
  pro: {
    id: "pro",
    name: "Plan Pro",
    priceUYU: 4990,
    priceUSD: 130,
    features: ["Hasta 100 vehículos", "5 Usuarios", "MercadoLibre Auto-Sync 24/7", "Inbox WhatsApp & Meta", "Automatizaciones de Leads"],
  },
  enterprise: {
    id: "enterprise",
    name: "Plan Enterprise",
    priceUYU: 9990,
    priceUSD: 260,
    features: ["Vehículos ilimitados", "Usuarios ilimitados", "Dominio propio personalizable", "WhatsApp AI Agent", "Soporte Prioritario 24/7"],
  },
};

export async function getBillingPlans() {
  return PLANS;
}

/**
 * Genera la suscripción de MercadoPago Preapproval.
 */
export async function createMercadoPagoSubscription(agencyId: string, planId: "starter" | "pro" | "enterprise") {
  const plan = PLANS[planId];
  if (!plan) return { success: false, error: "Plan no válido." };

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";

  if (!accessToken) {
    // Si no se han configurado credenciales reales de MercadoPago en entorno local, retorna checkout simulado
    return {
      success: true,
      init_point: `${appUrl}/admin/upgrade?status=simulated_mp&plan=${planId}&agency=${agencyId}`,
      isSimulated: true,
    };
  }

  try {
    const payload = {
      reason: `Suscripción N-Autos - ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.priceUYU,
        currency_id: "UYU",
      },
      back_url: `${appUrl}/admin/upgrade?status=success_mp`,
      external_reference: JSON.stringify({ agencyId, planId }),
    };

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MercadoPago API Error:", data);
      return { success: false, error: data.message || "Error al conectar con MercadoPago." };
    }

    return { success: true, init_point: data.init_point, isSimulated: false };
  } catch (error: any) {
    console.error("Error creating MercadoPago subscription:", error);
    return { success: false, error: error.message || "Error inesperado de comunicación con MercadoPago." };
  }
}

/**
 * Genera el link de pago / suscripción de PayPal.
 */
export async function createPayPalSubscription(agencyId: string, planId: "starter" | "pro" | "enterprise") {
  const plan = PLANS[planId];
  if (!plan) return { success: false, error: "Plan no válido." };

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";

  if (!clientId) {
    // Si no está configurado PayPal API en entorno dev, retorna checkout simulado
    return {
      success: true,
      approval_url: `${appUrl}/admin/upgrade?status=simulated_paypal&plan=${planId}&agency=${agencyId}`,
      isSimulated: true,
    };
  }

  // Si PayPal Client ID existe, enviamos la URL directa de PayPal Checkout
  const approvalUrl = `https://www.paypal.com/checkoutnow?plan_id=${planId}&custom_id=${agencyId}`;
  return { success: true, approval_url: approvalUrl, isSimulated: false };
}

/**
 * Actualiza el plan suscrito de una agencia.
 */
export async function updateAgencyPlan(agencyId: string, planId: string, paymentProvider: "mercadopago" | "paypal" | "manual") {
  try {
    const { error } = await (supabaseAdmin.from("agencies") as any)
      .update({
        plan: planId,
        subscription_status: "active",
        payment_provider: paymentProvider,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);

    if (error) {
      console.error("Error updating agency plan:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
