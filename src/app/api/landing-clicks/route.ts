import { NextResponse } from "next/server";
import {
  recordServerClickEvent,
  getLandingClickMetrics,
  clearServerClickEvents
} from "@/lib/serverLandingClickStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const metrics = await getLandingClickMetrics(true);
    return NextResponse.json({ success: true, metrics }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en GET /api/landing-clicks:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Error al obtener estadísticas de clics" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buttonId, buttonText, section, pageUrl, referrer, deviceType, userAgent } = body;

    if (!buttonId || !buttonText) {
      return NextResponse.json(
        { success: false, error: "buttonId y buttonText son requeridos." },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await recordServerClickEvent({
      buttonId,
      buttonText,
      section: section || "General",
      pageUrl: pageUrl || "/",
      referrer: referrer || "",
      deviceType: deviceType || "desktop",
      userAgent: userAgent || ""
    });

    return NextResponse.json({ success: true, event }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en POST /api/landing-clicks:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Error al registrar clic" },
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
