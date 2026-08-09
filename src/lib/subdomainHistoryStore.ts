import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const RESERVED_SUBDOMAINS = new Set([
  "prueba",
  "www",
  "admin",
  "superadmin",
  "api",
  "app",
  "portal",
  "doc",
  "n-sistemas",
  "n-autos",
  "localhost",
  "help",
  "mail",
  "support",
]);

interface SubdomainHistoryRecord {
  id?: string;
  agency_id: string;
  old_subdomain: string;
  new_subdomain?: string;
  created_at?: string;
}

// In-memory persistent server store for subdomain history fallback
const memorySubdomainHistory: Record<string, SubdomainHistoryRecord> = {};

/**
 * Registra un cambio de subdominio guardando el subdominio anterior en el historial
 */
export async function recordSubdomainChange(
  agencyId: string,
  oldSubdomain: string,
  newSubdomain: string
): Promise<boolean> {
  const cleanOld = oldSubdomain.trim().toLowerCase();
  const cleanNew = newSubdomain.trim().toLowerCase();

  if (!cleanOld || cleanOld === cleanNew) return true;

  const record: SubdomainHistoryRecord = {
    agency_id: agencyId,
    old_subdomain: cleanOld,
    new_subdomain: cleanNew,
    created_at: new Date().toISOString(),
  };

  memorySubdomainHistory[cleanOld] = record;

  try {
    const { error } = await (supabaseAdmin.from("subdomain_history") as any).upsert(
      record,
      { onConflict: "old_subdomain" }
    );
    if (error) {
      console.warn("Advertencia al registrar historial de subdominio en Supabase (usando memoria):", error.message);
    }
  } catch (err) {
    console.error("Error guardando historial de subdominio:", err);
  }

  return true;
}

/**
 * Consulta si un subdominio fue un subdominio anterior que fue modificado
 */
export async function checkSubdomainHistory(subdomain: string): Promise<SubdomainHistoryRecord | null> {
  const clean = subdomain.trim().toLowerCase();
  if (!clean) return null;

  if (memorySubdomainHistory[clean]) {
    return memorySubdomainHistory[clean];
  }

  try {
    const { data, error } = await (supabaseAdmin.from("subdomain_history") as any)
      .select("*")
      .eq("old_subdomain", clean)
      .maybeSingle();

    if (!error && data) {
      memorySubdomainHistory[clean] = data;
      return data;
    }
  } catch (err) {
    console.error("Error consultando historial de subdominio en Supabase:", err);
  }

  return null;
}

/**
 * Verifica si un subdominio está disponible para ser usado por una agencia
 */
export async function isSubdomainAvailable(
  subdomain: string,
  currentAgencyId?: string
): Promise<{ available: boolean; reason?: string }> {
  const clean = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  if (!clean) {
    return { available: false, reason: "El subdominio no puede estar vacío." };
  }

  if (clean.length < 3) {
    return { available: false, reason: "El subdominio debe tener al menos 3 caracteres." };
  }

  if (RESERVED_SUBDOMAINS.has(clean)) {
    return { available: false, reason: `El subdominio '${clean}' es una palabra reservada del sistema.` };
  }

  // 1. Verificar agencias activas en Supabase
  try {
    let query = (supabaseAdmin.from("agencies") as any)
      .select("id, subdomain")
      .eq("subdomain", clean);

    if (currentAgencyId) {
      query = query.neq("id", currentAgencyId);
    }

    const { data: existingAgency } = await query.maybeSingle();

    if (existingAgency) {
      return { available: false, reason: `El subdominio '${clean}' ya está utilizado por otra automotora.` };
    }
  } catch (err) {
    console.error("Error al verificar subdominio en agencias:", err);
  }

  // 2. Verificar en el historial de subdominios cambiados
  try {
    const history = await checkSubdomainHistory(clean);
    if (history && history.agency_id !== currentAgencyId) {
      return { available: false, reason: `El subdominio '${clean}' fue utilizado anteriormente y no se encuentra disponible.` };
    }
  } catch (err) {
    console.error("Error al verificar subdominio en historial:", err);
  }

  return { available: true };
}
