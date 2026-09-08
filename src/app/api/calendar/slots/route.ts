import { NextResponse } from "next/server";
import { getAvailableBookingSlots } from "@/actions/superadminCalendarActions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "El parámetro 'date' (YYYY-MM-DD) es requerido." },
        { status: 400, headers: corsHeaders }
      );
    }

    const res = await getAvailableBookingSlots(date);
    return NextResponse.json(res, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Error en GET /api/calendar/slots:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error al obtener slots disponibles" },
      { status: 500, headers: corsHeaders }
    );
  }
}
