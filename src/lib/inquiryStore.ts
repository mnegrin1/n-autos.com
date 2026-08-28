"use client";

export interface LandingInquiry {
  id: string;
  agencyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  message?: string;
  status: "pending" | "contacted" | "converted" | "archived";
  createdAt: string;
  subdomain?: string;
}

const INQUIRIES_STORAGE_KEY = "n_autos_landing_inquiries_v1";

export const DEFAULT_INQUIRIES: LandingInquiry[] = [];

type InquiryListener = () => void;
const listeners: Set<InquiryListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeInquiries(listener: InquiryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLandingInquiries(): LandingInquiry[] {
  if (typeof window === "undefined") return DEFAULT_INQUIRIES;
  try {
    const saved = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading landing inquiries from localStorage:", e);
  }
  return DEFAULT_INQUIRIES;
}


export function addLandingInquiry(inquiry: {
  agencyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  message?: string;
}): LandingInquiry {
  const current = getLandingInquiries();
  
  const subdomain = inquiry.agencyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20) || `agency-${Date.now().toString().slice(-4)}`;

  const newInquiry: LandingInquiry = {
    id: `inq-${Date.now()}`,
    agencyName: inquiry.agencyName,
    userName: inquiry.userName,
    userEmail: inquiry.userEmail,
    phone: inquiry.phone || "",
    message: inquiry.message || "",
    status: "pending",
    createdAt: new Date().toLocaleDateString("es-UY", { 
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" 
    }),
    subdomain
  };

  const updated = [newInquiry, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
      notifyListeners();
    } catch (e) {
      console.error("Error saving landing inquiry:", e);
    }
  }

  return newInquiry;
}

export function updateInquiryStatus(id: string, status: LandingInquiry["status"]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLandingInquiries();
    const updated = current.map((item) => item.id === id ? { ...item, status } : item);
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error("Error updating inquiry status:", e);
  }
}

export function deleteLandingInquiry(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLandingInquiries();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error("Error deleting inquiry:", e);
  }
}
