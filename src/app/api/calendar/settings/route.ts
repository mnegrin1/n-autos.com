import { NextResponse } from "next/server";
import { getSuperadminCalendarSettings } from "@/actions/superadminCalendarActions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const res = await getSuperadminCalendarSettings();
    return NextResponse.json({ success: true, config: res.config }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Error en GET /api/calendar/settings:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error al obtener configuración" },
      { status: 500, headers: corsHeaders }
    );
  }
}
