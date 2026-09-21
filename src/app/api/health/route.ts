import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "warn" | "error"; latencyMs?: number; message?: string }> = {};

  // 1. Verificación de variables de entorno críticas (sin exponer secretos)
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasGoogleClientId = !!(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  checks.env = {
    status: hasSupabaseUrl && hasServiceRoleKey ? "ok" : "warn",
    message: !hasServiceRoleKey
      ? "SUPABASE_SERVICE_ROLE_KEY no configurado en este entorno"
      : "Variables de entorno críticas verificadas",
  };

  checks.resend = {
    status: hasResendKey ? "ok" : "warn",
    message: hasResendKey ? "Resend API Key presente" : "Resend API Key ausente (correos deshabilitados)",
  };

  checks.google_auth = {
    status: hasGoogleClientId ? "ok" : "warn",
    message: hasGoogleClientId ? "Google OAuth configurado" : "Google OAuth ausente (solo modo interno)",
  };

  // 2. Health check activo de base de datos (Supabase) con medición de latencia
  let dbHealthy = false;
  const dbStart = Date.now();
  try {
    if (supabaseAdmin) {
      const { error } = await (supabaseAdmin.from("agencies") as any)
        .select("id")
        .limit(1);

      const dbLatency = Date.now() - dbStart;
      if (error) {
        checks.database = {
          status: "error",
          latencyMs: dbLatency,
          message: error.message || "Error en consulta a tabla agencies",
        };
      } else {
        dbHealthy = true;
        checks.database = {
          status: "ok",
          latencyMs: dbLatency,
          message: "Conexión a Supabase activa y respondiendo",
        };
      }
    } else {
      checks.database = {
        status: "error",
        message: "Cliente SupabaseAdmin no instanciado",
      };
    }
  } catch (err: any) {
    checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      message: err?.message || "Excepción de red conectando con Supabase",
    };
  }

  const totalDurationMs = Date.now() - startTime;
  const overallHealthy = dbHealthy;

  return NextResponse.json(
    {
      status: overallHealthy ? "healthy" : "degraded",
      uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
      timestamp: new Date().toISOString(),
      responseTimeMs: totalDurationMs,
      checks,
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: corsHeaders,
    }
  );
}
