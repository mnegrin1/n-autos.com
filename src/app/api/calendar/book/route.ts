import { NextResponse } from "next/server";
import { bookMeetingFromLanding } from "@/actions/superadminCalendarActions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, clientPhone, agencyName, notes, date, time } = body;

    if (!clientName || !clientEmail || !date || !time) {
      return NextResponse.json(
        { success: false, error: "Nombre, email, fecha y hora son obligatorios." },
        { status: 400, headers: corsHeaders }
      );
    }

    const res = await bookMeetingFromLanding({
      clientName,
      clientEmail,
      clientPhone,
      agencyName,
      notes,
      date,
      time,
    });

    if (res.success) {
      return NextResponse.json(res, { headers: corsHeaders });
    } else {
      return NextResponse.json(res, { status: 400, headers: corsHeaders });
    }
  } catch (err: any) {
    console.error("Error en POST /api/calendar/book:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error al agendar reunión" },
      { status: 500, headers: corsHeaders }
    );
  }
}
