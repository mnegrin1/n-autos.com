"use client";

import { DEFAULT_PLANS, getPlans } from "./plansStore";
import { addRegisteredTenant } from "./superadminStore";

export interface TenantSession {
  agencyId: string;
  agencyName: string;
  subdomain: string;
  planId: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  adminName: string;
  adminEmail: string;
  usedVehicles: number;
  usedUsers: number;
  usedEmailsMonth: number;
  createdAt: string;
  dbLocationInfo?: {
    agenciesTable: string;
    usersTable: string;
    vehiclesTable: string;
    schemaVersion: string;
  };
}

export const DEFAULT_STARTER_TENANT: TenantSession = {
  agencyId: "tenant-carmax-001",
  agencyName: "Automotora CarMax Uruguay",
  subdomain: "carmax",
  planId: "agencia-360",
  planName: "Agencia 360°",
  billingCycle: "monthly",
  adminName: "Mauricio Negrin",
  adminEmail: "admin@carmax.uy",
  usedVehicles: 14,
  usedUsers: 1,
  usedEmailsMonth: 120,
  createdAt: new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" }),
  dbLocationInfo: {
    agenciesTable: "public.agencies (id, name, subdomain, primary_color, created_at)",
    usersTable: "public.users (id, agency_id, name, email, role)",
    vehiclesTable: "public.vehicles (id, agency_id, brand, model, year, price, status)",
    schemaVersion: "v2.4 - Multi-tenant RLS Isolation (Supabase)"
  }
};

const TENANT_STORAGE_KEY = "n_sistemas_tenant_session_v1";

type TenantListener = (session: TenantSession) => void;
const tenantListeners: Set<TenantListener> = new Set();

export function getTenantSession(): TenantSession {
  if (typeof window === "undefined") return DEFAULT_STARTER_TENANT;
  try {
    const saved = localStorage.getItem(TENANT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.agencyId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading tenant session from localStorage:", e);
  }
  return DEFAULT_STARTER_TENANT;
}

export function saveTenantSession(session: TenantSession): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(session));
      tenantListeners.forEach((fn) => fn(session));
    } catch (e) {
      console.error("Error saving tenant session:", e);
    }
  }
}

export function updateTenantAgencyName(name: string, subdomain?: string): TenantSession {
  const current = getTenantSession();
  const updatedSession: TenantSession = {
    ...current,
    agencyName: name || current.agencyName,
    subdomain: subdomain ? subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "") : current.subdomain
  };
  saveTenantSession(updatedSession);
  return updatedSession;
}

export function subscribeTenantSession(listener: TenantListener): () => void {
  tenantListeners.add(listener);
  return () => {
    tenantListeners.delete(listener);
  };
}

export function syncTenantSessionForUser(user: {
  id: string;
  email: string;
  name: string;
  agency_id?: string;
}): TenantSession {
  const current = getTenantSession();
  const cleanEmail = user.email.toLowerCase().trim();
  const userSubdomain = cleanEmail.split("@")[0].replace(/[^a-z0-9-]/g, "");
  const defaultAgencyName = `Automotora ${user.name || userSubdomain}`;

  const updatedSession: TenantSession = {
    ...current,
    agencyId: user.agency_id || `agency-${user.id}`,
    agencyName: defaultAgencyName,
    subdomain: userSubdomain || current.subdomain,
    adminName: user.name || current.adminName,
    adminEmail: cleanEmail,
    dbLocationInfo: {
      agenciesTable: `public.agencies (id, name, subdomain)`,
      usersTable: `public.users (id: ${user.id}, email: ${cleanEmail})`,
      vehiclesTable: `public.vehicles (agency_id: ${user.agency_id || `agency-${user.id}`})`,
      schemaVersion: "v2.4 - Multi-tenant RLS Isolation (Supabase)"
    }
  };

  saveTenantSession(updatedSession);
  return updatedSession;
}

export function switchTenantPlan(planId: string): TenantSession {
  const current = getTenantSession();
  const availablePlans = getPlans();
  const targetPlan = availablePlans.find((p) => p.id === planId) || DEFAULT_PLANS[1];

  const updatedSession: TenantSession = {
    ...current,
    planId: targetPlan.id,
    planName: targetPlan.name
  };

  saveTenantSession(updatedSession);
  return updatedSession;
}

export function simulateTenantRegistration(params: {
  agencyName: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  planId?: string;
  billingCycle?: "monthly" | "yearly";
}): { session: TenantSession; dbLogs: string[] } {
  const agencyUuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `agency-${Date.now()}`;
  const userUuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;

  const newSession: TenantSession = {
    agencyId: agencyUuid,
    agencyName: params.agencyName,
    subdomain: params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    planId: "agencia-360",
    planName: "Agencia 360°",
    billingCycle: params.billingCycle || "monthly",
    adminName: params.adminName,
    adminEmail: params.adminEmail,
    usedVehicles: 0,
    usedUsers: 1,
    usedEmailsMonth: 0,
    createdAt: new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" }),
    dbLocationInfo: {
      agenciesTable: `INSERT INTO agencies (id, name, subdomain) VALUES ('${agencyUuid}', '${params.agencyName}', '${params.subdomain}');`,
      usersTable: `INSERT INTO users (id, agency_id, name, email, role) VALUES ('${userUuid}', '${agencyUuid}', '${params.adminName}', '${params.adminEmail}', 'admin');`,
      vehiclesTable: `INSERT INTO vehicles (agency_id, brand, model, status) VALUES ('${agencyUuid}', 'Toyota', 'Corolla 2.0 Hybrid', 'disponible');`,
      schemaVersion: "v2.4 - Multi-tenant RLS Isolation (Supabase)"
    }
  };

  const dbLogs = [
    `[DB SUPABASE] Initializing multi-tenant workspace for '${params.agencyName}'...`,
    `[DB EXEC] INSERT INTO agencies (id, name, subdomain) -> OK (ID: ${agencyUuid})`,
    `[DB EXEC] INSERT INTO users (id, agency_id, name, email, role) -> OK (Role: admin)`,
    `[SERVICE ASSIGN] Activated Agencia 360° Service for tenant '${params.subdomain}'`,
    `[RLS POLICY] Applied 'get_auth_user_agency() = ${agencyUuid}' security barrier.`,
    `[SUPERADMIN SYNC] Registered tenant in SuperAdmin Panel global store.`,
    `[STATUS] Ready to redirect to /admin dashboard.`
  ];

  saveTenantSession(newSession);

  // Synchronize with SuperAdmin store
  addRegisteredTenant({
    agencyId: agencyUuid,
    agencyName: params.agencyName,
    subdomain: params.subdomain,
    adminName: params.adminName,
    adminEmail: params.adminEmail,
    planName: "Agencia 360°"
  });

  return { session: newSession, dbLogs };
}

