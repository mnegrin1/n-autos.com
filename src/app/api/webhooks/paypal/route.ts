import { NextResponse } from "next/server";
import { updateAgencyPlan } from "@/actions/billingActions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`[PayPal Webhook Received] Event: ${eventType}`);

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || eventType === "PAYMENT.SALE.COMPLETED") {
      const customId = resource?.custom_id || resource?.custom;
      const planId = resource?.plan_id ? resource.plan_id.toLowerCase() : "pro";

      if (customId) {
        await updateAgencyPlan(customId, planId, "paypal");
        console.log(`[PayPal Webhook] Suscripción PayPal activada exitosamente para agencia: ${customId}`);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook PayPal procesado" }, { status: 200 });
  } catch (error: any) {
    console.error("Error procesando Webhook de PayPal:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "PayPal Webhook Endpoint" });
}
