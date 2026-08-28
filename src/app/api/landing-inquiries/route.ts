import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySignedToken } from "@/lib/sessionToken";
import { 
  getAllServerInquiries, 
  saveServerInquiry, 
  updateServerInquiryStatus, 
  deleteServerInquiry 
} from "@/lib/serverInquiryStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function checkSuperAdminPermission(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;
    if (!token) return false;
    const decoded = await verifySignedToken(token);
    if (!decoded) return false;
    const cleanEmail = (decoded.email || "").toLowerCase().trim();
    return (
      decoded.role === "superadmin" || 
      decoded.role === "Superadmin" || 
      decoded.agency_id === "00000000-0000-0000-0000-000000000000" ||
      cleanEmail === "mauricio.negrin@n-sistemas.com" ||
      cleanEmail === "mauricio@automotora.com" ||
      cleanEmail === "mauricionegrinmogni1@gmail.com"
    );
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const isAuth = await checkSuperAdminPermission();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: "Acceso no autorizado. Se requieren permisos de Superadmin." }, 
        { status: 401, headers: corsHeaders }
      );
    }

    const inquiries = await getAllServerInquiries();
    return NextResponse.json({ success: true, inquiries }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en GET /api/landing-inquiries:", e);
    return NextResponse.json({ success: false, error: e?.message || "Error al obtener consultas" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agencyName, userName, userEmail, phone, message } = body;

    if (!agencyName || !userName || !userEmail) {
      return NextResponse.json(
        { success: false, error: "El nombre de la empresa, nombre y correo son obligatorios." },
        { status: 400, headers: corsHeaders }
      );
    }

    const newInquiry = await saveServerInquiry({
      agencyName,
      userName,
      userEmail,
      phone,
      message
    });

    return NextResponse.json({ success: true, inquiry: newInquiry }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("Error en POST /api/landing-inquiries:", e);
    return NextResponse.json({ success: false, error: e?.message || "Error al procesar la consulta" }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: Request) {
  try {
    const isAuth = await checkSuperAdminPermission();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Acceso no autorizado." }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID y Estado son requeridos." }, { status: 400, headers: corsHeaders });
    }

    const ok = await updateServerInquiryStatus(id, status);
    return NextResponse.json({ success: ok }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuth = await checkSuperAdminPermission();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "Acceso no autorizado." }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido." }, { status: 400, headers: corsHeaders });
    }

    const ok = await deleteServerInquiry(id);
    return NextResponse.json({ success: ok }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500, headers: corsHeaders });
  }
}

