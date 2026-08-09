"use client";

export interface BrandingChangeRequest {
  id: string;
  agencyId: string;
  currentName: string;
  requestedName: string;
  currentSubdomain: string;
  requestedSubdomain: string;
  reason: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  resolvedAt?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

const BRANDING_REQUESTS_KEY = "n_sistemas_branding_requests_v1";

type BrandingRequestListener = () => void;
const listeners: Set<BrandingRequestListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeBrandingRequestStore(listener: BrandingRequestListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBrandingRequests(): BrandingChangeRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(BRANDING_REQUESTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error al leer solicitudes de cambio de branding:", e);
  }
  return [];
}

export function getBrandingRequestsByAgency(agencyId: string): BrandingChangeRequest[] {
  const requests = getBrandingRequests();
  return requests.filter((r) => r.agencyId === agencyId);
}

export function getPendingBrandingRequest(agencyId: string): BrandingChangeRequest | null {
  const requests = getBrandingRequestsByAgency(agencyId);
  return requests.find((r) => r.status === "pending") || null;
}

export function createBrandingRequest(params: {
  agencyId: string;
  currentName: string;
  requestedName: string;
  currentSubdomain: string;
  requestedSubdomain: string;
  reason: string;
  userEmail?: string;
  userName?: string;
}): BrandingChangeRequest {
  const requests = getBrandingRequests();
  const todayStr = new Date().toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const newRequest: BrandingChangeRequest = {
    id: `req-${Date.now()}`,
    agencyId: params.agencyId,
    currentName: params.currentName,
    requestedName: params.requestedName,
    currentSubdomain: params.currentSubdomain,
    requestedSubdomain: params.requestedSubdomain,
    reason: params.reason,
    userEmail: params.userEmail || "admin@automotora.com",
    userName: params.userName || "Admin Automotora",
    createdAt: todayStr,
    status: "pending"
  };

  const updated = [newRequest, ...requests];
  if (typeof window !== "undefined") {
    localStorage.setItem(BRANDING_REQUESTS_KEY, JSON.stringify(updated));
    notifyListeners();
  }
  return newRequest;
}

export function approveBrandingRequest(requestId: string): BrandingChangeRequest | null {
  const requests = getBrandingRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const todayStr = new Date().toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const target = requests[idx];
  const updatedRequest: BrandingChangeRequest = {
    ...target,
    status: "approved",
    resolvedAt: todayStr
  };

  requests[idx] = updatedRequest;
  if (typeof window !== "undefined") {
    localStorage.setItem(BRANDING_REQUESTS_KEY, JSON.stringify(requests));
    notifyListeners();
  }
  return updatedRequest;
}

export function rejectBrandingRequest(requestId: string, rejectionReason?: string): BrandingChangeRequest | null {
  const requests = getBrandingRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const todayStr = new Date().toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const target = requests[idx];
  const updatedRequest: BrandingChangeRequest = {
    ...target,
    status: "rejected",
    rejectionReason: rejectionReason || "Solicitud desestimada por el Super Admin.",
    resolvedAt: todayStr
  };

  requests[idx] = updatedRequest;
  if (typeof window !== "undefined") {
    localStorage.setItem(BRANDING_REQUESTS_KEY, JSON.stringify(requests));
    notifyListeners();
  }
  return updatedRequest;
}
