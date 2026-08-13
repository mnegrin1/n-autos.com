"use client";

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  agency: string;
  agencyId: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface SuperAdminAgency {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  users: number;
  properties: number;
  status: string;
  createdAt: string;
}

const SUPERADMIN_USERS_KEY = "n_sistemas_superadmin_users_v1";
const SUPERADMIN_AGENCIES_KEY = "n_sistemas_superadmin_agencies_v1";

export const DEFAULT_SUPERADMIN_AGENCIES: SuperAdminAgency[] = [
  {
    id: "agency-delsur",
    name: "Automotores del Sur",
    subdomain: "delsur",
    plan: "Premium",
    users: 5,
    properties: 124,
    status: "active",
    createdAt: "19 Jul 2026"
  },
  {
    id: "tenant-carmax-001",
    name: "Automotora CarMax Uruguay",
    subdomain: "carmax",
    plan: "Starter",
    users: 1,
    properties: 14,
    status: "active",
    createdAt: "18 Jul 2026"
  }
];

export const DEFAULT_SUPERADMIN_USERS: SuperAdminUser[] = [
  {
    id: "user-mauricio",
    name: "Mauricio Negrin",
    email: "mauricio@automotora.com",
    agency: "Automotora CarMax Uruguay",
    agencyId: "tenant-carmax-001",
    role: "Admin (Agencia)",
    status: "active",
    createdAt: "18 Jul 2026"
  },
  {
    id: "user-superadmin",
    name: "Admin Principal",
    email: "admin@n-autos.com",
    agency: "N-Autos (Plataforma)",
    agencyId: "platform",
    role: "Superadmin",
    status: "active",
    createdAt: "1 Ene 2026"
  }
];

type SuperAdminListener = () => void;
const listeners: Set<SuperAdminListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeSuperAdminStore(listener: SuperAdminListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRegisteredAgencies(): SuperAdminAgency[] {
  if (typeof window === "undefined") return DEFAULT_SUPERADMIN_AGENCIES;
  try {
    const saved = localStorage.getItem(SUPERADMIN_AGENCIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading agencies from localStorage:", e);
  }
  return DEFAULT_SUPERADMIN_AGENCIES;
}

export function getRegisteredUsers(): SuperAdminUser[] {
  if (typeof window === "undefined") return DEFAULT_SUPERADMIN_USERS;
  try {
    const saved = localStorage.getItem(SUPERADMIN_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading users from localStorage:", e);
  }
  return DEFAULT_SUPERADMIN_USERS;
}

export function addRegisteredTenant(params: {
  agencyId: string;
  agencyName: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  planName: string;
}): void {
  if (typeof window === "undefined") return;

  try {
    const currentAgencies = getRegisteredAgencies();
    const currentUsers = getRegisteredUsers();

    const todayStr = new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });

    const existingAgencyIdx = currentAgencies.findIndex((a) => a.id === params.agencyId || a.subdomain === params.subdomain);
    
    const newAgencyObj: SuperAdminAgency = {
      id: params.agencyId,
      name: params.agencyName,
      subdomain: params.subdomain,
      plan: params.planName,
      users: 1,
      properties: 0,
      status: "active",
      createdAt: todayStr
    };

    let updatedAgencies: SuperAdminAgency[];
    if (existingAgencyIdx !== -1) {
      updatedAgencies = [...currentAgencies];
      updatedAgencies[existingAgencyIdx] = newAgencyObj;
    } else {
      updatedAgencies = [newAgencyObj, ...currentAgencies];
    }

    const existingUserIdx = currentUsers.findIndex((u) => u.email.toLowerCase() === params.adminEmail.toLowerCase());
    
    const newUserObj: SuperAdminUser = {
      id: `user-${Date.now()}`,
      name: params.adminName,
      email: params.adminEmail,
      agency: params.agencyName,
      agencyId: params.agencyId,
      role: "Admin (Agencia)",
      status: "active",
      createdAt: todayStr
    };

    let updatedUsers: SuperAdminUser[];
    if (existingUserIdx !== -1) {
      updatedUsers = [...currentUsers];
      updatedUsers[existingUserIdx] = newUserObj;
    } else {
      updatedUsers = [newUserObj, ...currentUsers];
    }

    localStorage.setItem(SUPERADMIN_AGENCIES_KEY, JSON.stringify(updatedAgencies));
    localStorage.setItem(SUPERADMIN_USERS_KEY, JSON.stringify(updatedUsers));
    notifyListeners();
  } catch (e) {
    console.error("Error adding registered tenant to SuperAdmin store:", e);
  }
}

export function deleteRegisteredAgency(agencyId: string): void {
  if (typeof window === "undefined") return;
  try {
    const currentAgencies = getRegisteredAgencies();
    const updatedAgencies = currentAgencies.filter((a) => a.id !== agencyId);
    const currentUsers = getRegisteredUsers();
    const updatedUsers = currentUsers.filter((u) => u.agencyId !== agencyId);

    localStorage.setItem(SUPERADMIN_AGENCIES_KEY, JSON.stringify(updatedAgencies));
    localStorage.setItem(SUPERADMIN_USERS_KEY, JSON.stringify(updatedUsers));
    notifyListeners();
  } catch (e) {
    console.error("Error deleting agency from SuperAdmin store:", e);
  }
}

export function updateRegisteredAgency(agencyId: string, updates: Partial<SuperAdminAgency>): void {
  if (typeof window === "undefined") return;
  try {
    const currentAgencies = getRegisteredAgencies();
    const updatedAgencies = currentAgencies.map((a) => (a.id === agencyId ? { ...a, ...updates } : a));
    localStorage.setItem(SUPERADMIN_AGENCIES_KEY, JSON.stringify(updatedAgencies));
    notifyListeners();
  } catch (e) {
    console.error("Error updating agency in SuperAdmin store:", e);
  }
}

export function addRegisteredUser(params: {
  id?: string;
  name: string;
  email: string;
  agencyName: string;
  agencyId: string;
  role?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const currentUsers = getRegisteredUsers();
    const todayStr = new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
    const newUser: SuperAdminUser = {
      id: params.id || `user-${Date.now()}`,
      name: params.name,
      email: params.email,
      agency: params.agencyName,
      agencyId: params.agencyId,
      role: params.role || "Admin (Agencia)",
      status: "active",
      createdAt: todayStr,
    };

    const existingIdx = currentUsers.findIndex((u) => u.email.toLowerCase() === params.email.toLowerCase());
    let updatedUsers: SuperAdminUser[];
    if (existingIdx !== -1) {
      updatedUsers = [...currentUsers];
      updatedUsers[existingIdx] = { ...updatedUsers[existingIdx], ...newUser };
    } else {
      updatedUsers = [newUser, ...currentUsers];
    }

    localStorage.setItem(SUPERADMIN_USERS_KEY, JSON.stringify(updatedUsers));
    notifyListeners();
  } catch (e) {
    console.error("Error adding user to SuperAdmin store:", e);
  }
}

export function deleteRegisteredUser(userIdOrEmail: string): void {
  if (typeof window === "undefined") return;
  try {
    const currentUsers = getRegisteredUsers();
    const updatedUsers = currentUsers.filter((u) => u.id !== userIdOrEmail && u.email.toLowerCase() !== userIdOrEmail.toLowerCase());
    localStorage.setItem(SUPERADMIN_USERS_KEY, JSON.stringify(updatedUsers));
    notifyListeners();
  } catch (e) {
    console.error("Error deleting user from SuperAdmin store:", e);
  }
}


