/**
 * Deleted Agencies & User Revocation Registry
 * Fully Edge & Node runtime compatible without Node.js filesystem dependencies.
 * Keeps track of organizations deleted by Superadmin to guarantee
 * immediate revocation of access across sessions, login attempts, and APIs.
 */

interface DeletedAgencyEntry {
  agencyId: string;
  subdomain?: string;
  deletedAt: string;
  userEmails?: string[];
}

const g = globalThis as any;
if (!g.__deletedAgenciesMap) {
  g.__deletedAgenciesMap = new Map<string, DeletedAgencyEntry>();
}
if (!g.__deletedEmailsSet) {
  g.__deletedEmailsSet = new Set<string>();
}

const memoryDeletedAgencies: Map<string, DeletedAgencyEntry> = g.__deletedAgenciesMap;
const memoryDeletedEmails: Set<string> = g.__deletedEmailsSet;

/**
 * Records an agency and its users as deleted by SuperAdmin.
 */
export function recordDeletedAgency(agencyId: string, subdomain?: string, userEmails?: string[]): void {
  const cleanId = agencyId ? agencyId.toLowerCase().trim() : "";
  const cleanSub = subdomain ? subdomain.toLowerCase().trim() : undefined;
  const cleanEmails = (userEmails || []).map((e) => e.toLowerCase().trim()).filter(Boolean);

  const entry: DeletedAgencyEntry = {
    agencyId: cleanId,
    subdomain: cleanSub,
    deletedAt: new Date().toISOString(),
    userEmails: cleanEmails,
  };

  if (cleanId) {
    memoryDeletedAgencies.set(cleanId, entry);
  }
  if (cleanSub) {
    memoryDeletedAgencies.set(cleanSub, entry);
  }
  cleanEmails.forEach((em) => memoryDeletedEmails.add(em));
}

/**
 * Checks if an agency, subdomain or user email belongs to a deleted organization.
 */
export function isAgencyDeleted(agencyId?: string | null, subdomain?: string | null, email?: string | null): boolean {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    // Superadmin is NEVER deleted or blocked
    if (cleanEmail === "mauricio.negrin@n-sistemas.com") {
      return false;
    }
    if (memoryDeletedEmails.has(cleanEmail)) {
      return true;
    }
  }

  if (agencyId) {
    const cleanId = agencyId.toLowerCase().trim();
    if (cleanId === "00000000-0000-0000-0000-000000000000") {
      return false; // Global superadmin
    }
    if (memoryDeletedAgencies.has(cleanId)) {
      return true;
    }
  }

  if (subdomain) {
    const cleanSub = subdomain.toLowerCase().trim();
    if (memoryDeletedAgencies.has(cleanSub)) {
      return true;
    }
  }

  return false;
}

/**
 * Removes an agency from the deleted registry (e.g. if cleanly recreated).
 */
export function unmarkDeletedAgency(agencyId: string, subdomain?: string): void {
  const cleanId = agencyId ? agencyId.toLowerCase().trim() : "";
  const cleanSub = subdomain ? subdomain.toLowerCase().trim() : undefined;

  if (cleanId) memoryDeletedAgencies.delete(cleanId);
  if (cleanSub) memoryDeletedAgencies.delete(cleanSub);
}
