import { NextResponse } from "next/server";
import { updateAgencyPlan } from "@/actions/billingActions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const type = body.type || searchParams.get("type") || searchParams.get("topic");
    const dataId = body.data?.id || searchParams.get("id");

    console.log(`[MercadoPago Webhook Received] Type: ${type}, ID: ${dataId}`);

    // Si es una notificación de suscripción (preapproval) o pago de suscripción
    if (type === "preapproval" || type === "payment" || type === "subscription") {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (accessToken && dataId) {
        // Consultar a la API de MercadoPago para obtener detalles del pago o preapproval
        const endpoint = type === "preapproval" 
          ? `https://api.mercadopago.com/preapproval/${dataId}`
          : `https://api.mercadopago.com/v1/payments/${dataId}`;

        const mpRes = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (mpRes.ok) {
          const details = await mpRes.json();
          const extRefStr = details.external_reference;

          if (extRefStr) {
            try {
              const extRef = typeof extRefStr === "string" && extRefStr.startsWith("{") 
                ? JSON.parse(extRefStr) 
                : { agencyId: extRefStr, planId: "pro" };

              if (extRef.agencyId && extRef.planId) {
                const status = details.status;
                if (status === "approved" || status === "authorized" || status === "active") {
                  await updateAgencyPlan(extRef.agencyId, extRef.planId, "mercadopago");
                  console.log(`[MercadoPago Webhook] Suscripción activada exitosamente para agencia: ${extRef.agencyId}`);
                }
              }
            } catch (err) {
              console.error("Error parsing MercadoPago external_reference:", err);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook procesado correctamente" }, { status: 200 });
  } catch (error: any) {
    console.error("Error procesando Webhook de MercadoPago:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "MercadoPago Webhook Endpoint" });
}
