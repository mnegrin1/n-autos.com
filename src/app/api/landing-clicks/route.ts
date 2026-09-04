import { NextResponse } from "next/server";
import {
  recordServerClickEvent,
  getLandingClickMetrics,
  clearServerClickEvents,
  LandingEventType
} from "@/lib/serverLandingClickStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get("days") || "14", 10);
    const forceRefresh = searchParams.get("refresh") === "true";

    const metrics = await getLandingClickMetrics(forceRefresh, isNaN(daysParam) ? 14 : daysParam);
    return NextResponse.json({ success: true, metrics }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en GET /api/landing-clicks:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Error al obtener estadísticas de clics y visitas" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventType,
      buttonId,
      buttonText,
      section,
      pageUrl,
      pageTitle,
      referrer,
      deviceType,
      userAgent,
      utmSource,
      utmMedium,
      utmCampaign,
      sessionId
    } = body;

    const event = await recordServerClickEvent({
      eventType: (eventType as LandingEventType) || "click",
      buttonId: buttonId || (eventType === "pageview" ? "page_view" : "btn_interaction"),
      buttonText: buttonText || (eventType === "pageview" ? `Visita a ${pageUrl || "/"}` : "Clic"),
      section: section || (eventType === "pageview" ? "Visitas" : "General"),
      pageUrl: pageUrl || "/",
      pageTitle: pageTitle || "",
      referrer: referrer || "",
      deviceType: deviceType || "desktop",
      userAgent: userAgent || "",
      utmSource: utmSource || "",
      utmMedium: utmMedium || "",
      utmCampaign: utmCampaign || "",
      sessionId: sessionId || ""
    });

    return NextResponse.json({ success: true, event }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en POST /api/landing-clicks:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Error al registrar evento analítico" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE() {
  try {
    const ok = await clearServerClickEvents();
    return NextResponse.json({ success: ok }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en DELETE /api/landing-clicks:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Error al limpiar métricas" },
      { status: 500, headers: corsHeaders }
    );
  }
}

