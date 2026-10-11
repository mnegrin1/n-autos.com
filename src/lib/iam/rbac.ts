/**
 * Centralized Role-Based Access Control (RBAC) & Tenant Isolation Guard
 * Decouples identity from permissions, enforces principle of least privilege,
 * and prevents Cross-Tenant Data Access (IDOR).
 */

export type Role = "superadmin" | "admin" | "manager" | "agent";

export type Permission =
  // Global Superadmin
  | "superadmin:access"
  | "superadmin:manage_agencies"
  | "superadmin:manage_features"
  | "superadmin:manage_system"
  // Agency / Tenant Settings
  | "agency:read"
  | "agency:update_settings"
  | "agency:manage_domains"
  | "agency:manage_billing"
  // Team Management
  | "users:read"
  | "users:invite"
  | "users:update"
  | "users:delete"
  // Vehicle Inventory
  | "vehicles:read"
  | "vehicles:create"
  | "vehicles:update"
  | "vehicles:delete"
  // CRM & Leads
  | "crm:read"
  | "crm:create"
  | "crm:update"
  | "crm:delete"
  // Agenda / Calendar
  | "agenda:read"
  | "agenda:create"
  | "agenda:update"
  | "agenda:delete"
  // Automations
  | "automations:read"
  | "automations:manage"
  // Integrations (MercadoLibre, Meta, etc.)
  | "integrations:read"
  | "integrations:manage";

/**
 * Matriz estricta de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  superadmin: [
    "superadmin:access",
    "superadmin:manage_agencies",
    "superadmin:manage_features",
    "superadmin:manage_system",
    "agency:read",
    "agency:update_settings",
    "agency:manage_domains",
    "agency:manage_billing",
    "users:read",
    "users:invite",
    "users:update",
    "users:delete",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
    "vehicles:delete",
    "crm:read",
    "crm:create",
    "crm:update",
    "crm:delete",
    "agenda:read",
    "agenda:create",
    "agenda:update",
    "agenda:delete",
    "automations:read",
    "automations:manage",
    "integrations:read",
    "integrations:manage",
  ],
  admin: [
    "agency:read",
    "agency:update_settings",
    "agency:manage_domains",
    "agency:manage_billing",
    "users:read",
    "users:invite",
    "users:update",
    "users:delete",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
    "vehicles:delete",
    "crm:read",
    "crm:create",
    "crm:update",
    "crm:delete",
    "agenda:read",
    "agenda:create",
    "agenda:update",
    "agenda:delete",
    "automations:read",
    "automations:manage",
    "integrations:read",
    "integrations:manage",
  ],
  manager: [
    "agency:read",
    "users:read",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
    "vehicles:delete",
    "crm:read",
    "crm:create",
    "crm:update",
    "crm:delete",
    "agenda:read",
    "agenda:create",
    "agenda:update",
    "agenda:delete",
    "automations:read",
    "integrations:read",
  ],
  agent: [
    "agency:read",
    "vehicles:read",
    "vehicles:create",
    "vehicles:update",
    "crm:read",
    "crm:create",
    "crm:update",
    "agenda:read",
    "agenda:create",
    "agenda:update",
  ],
};

/**
 * Retorna la lista de correos con privilegios de Superadmin desde variables de entorno.
 */
export function getSuperAdminEmails(): string[] {
  const envEmails = process.env.SUPERADMIN_EMAILS || "";
  const list = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Valor por defecto estándar del propietario de la plataforma
  if (!list.includes("mauricio.negrin@n-sistemas.com")) {
    list.push("mauricio.negrin@n-sistemas.com");
  }

  return list;
}

/**
 * Valida si un usuario posee privilegios globales de Superadministrador.
 */
export function isSuperAdmin(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  if (role === "superadmin") return true;

  if (user.email) {
    const cleanEmail = user.email.trim().toLowerCase();
    const superAdmins = getSuperAdminEmails();
    if (superAdmins.includes(cleanEmail)) return true;
  }

  return false;
}

/**
 * Verifica si un rol cuenta con un permiso específico.
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const cleanRole = role.toLowerCase() as Role;
  const permissions = ROLE_PERMISSIONS[cleanRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Valida el acceso de un usuario a los recursos de una automotora determinada (Tenant Guard).
 * Previene vulnerabilidades IDOR (Insecure Direct Object Reference).
 */
export function validateAgencyAccess(
  user: { role?: string; agency_id?: string; email?: string } | null,
  targetAgencyId?: string | null
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "No autenticado" };
  }

  // Superadmin tiene acceso a todas las organizaciones de la plataforma
  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  if (!targetAgencyId || !user.agency_id) {
    return { allowed: false, reason: "Identificador de automotora no provisto" };
  }

  if (user.agency_id !== targetAgencyId) {
    return {
      allowed: false,
      reason: "Acceso Denegado: No tienes autorización para acceder a los datos de esta automotora.",
    };
  }

  return { allowed: true };
}

/**
 * Lanza una excepción si el usuario no tiene acceso a la automotora solicitada.
 */
export function assertAgencyAccess(
  user: { role?: string; agency_id?: string; email?: string } | null,
  targetAgencyId?: string | null
): void {
  const check = validateAgencyAccess(user, targetAgencyId);
  if (!check.allowed) {
    throw new Error(check.reason || "Acceso Denegado");
  }
}
