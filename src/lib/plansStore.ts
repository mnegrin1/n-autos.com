"use client";

export interface PaymentPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  maxVehicles: string;
  maxUsers: string;
  active: boolean;
}

export const DEFAULT_PLANS: PaymentPlan[] = [
  {
    id: "plan-gratis",
    name: "Gratis",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Ideal para automotoras pequeñas que están comenzando.",
    badge: "Inicial",
    features: [
      "Hasta 5 vehículos en inventario",
      "1 usuario de administración",
      "Gestión de leads básica",
      "Publicación manual",
      "Soporte por email"
    ],
    maxVehicles: "5",
    maxUsers: "1",
    active: true
  },
  {
    id: "plan-pro",
    name: "Pro",
    priceMonthly: 49,
    priceYearly: 39,
    description: "La solución completa para potenciar tus ventas y automatizar el CRM.",
    badge: "Más Popular",
    isPopular: true,
    features: [
      "Vehículos e inventario ilimitados",
      "Hasta 5 usuarios de ventas",
      "Integración WhatsApp inbox",
      "Publicación multicanal en 1 clic",
      "Email Broadcasts y plantillas",
      "Soporte prioritario 24/7"
    ],
    maxVehicles: "Ilimitados",
    maxUsers: "5",
    active: true
  },
  {
    id: "plan-ultra",
    name: "Ultra",
    priceMonthly: 99,
    priceYearly: 79,
    description: "Máxima potencia con automatizaciones avanzadas y soporte dedicado VIP.",
    badge: "Empresas",
    features: [
      "Todo lo incluido en el Plan Pro",
      "Usuarios e inmobiliarias ilimitadas",
      "Automatizaciones avanzadas e IA",
      "Dominio de email propio verificado",
      "Reportes analíticos de conversión",
      "Ejecutivo de cuenta dedicado VIP"
    ],
    maxVehicles: "Ilimitados",
    maxUsers: "Ilimitados",
    active: true
  }
];

const PLANS_STORAGE_KEY = "n_sistemas_plans_v1";

type Listener = (plans: PaymentPlan[]) => void;
const listeners: Set<Listener> = new Set();

export function getPlans(): PaymentPlan[] {
  if (typeof window === "undefined") return DEFAULT_PLANS;
  try {
    const saved = localStorage.getItem(PLANS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading plans from localStorage:", e);
  }
  return DEFAULT_PLANS;
}

export function savePlans(plans: PaymentPlan[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
      listeners.forEach(fn => fn(plans));
    } catch (e) {
      console.error("Error saving plans to localStorage:", e);
    }
  }
}

export function subscribePlans(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updatePlan(updatedPlan: PaymentPlan): void {
  const current = getPlans();
  const index = current.findIndex(p => p.id === updatedPlan.id);
  if (index !== -1) {
    current[index] = updatedPlan;
  } else {
    current.push(updatedPlan);
  }
  savePlans([...current]);
}

export function togglePlanActive(planId: string): void {
  const current = getPlans();
  const updated = current.map(p => p.id === planId ? { ...p, active: !p.active } : p);
  savePlans(updated);
}
