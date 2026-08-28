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
  maxVehiclesCount: number;
  maxUsers: string;
  maxUsersCount: number;
  crmLevel: string;
  whatsappInbox: string;
  emailBroadcasts: string;
  multichannelPublish: string;
  aiAssistant: string;
  customDomain: string;
  supportLevel: string;
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
    maxVehiclesCount: 5,
    maxUsers: "1",
    maxUsersCount: 1,
    crmLevel: "Básico",
    whatsappInbox: "No disponible",
    emailBroadcasts: "No disponible",
    multichannelPublish: "Manual",
    aiAssistant: "No disponible",
    customDomain: "Subdominio .n-autos.com",
    supportLevel: "Email estándar",
    active: true
  },
  {
    id: "plan-starter",
    name: "Starter",
    priceMonthly: 19,
    priceYearly: 15,
    description: "Para automotoras en crecimiento que buscan digitalizar su inventario.",
    badge: "Crecimiento",
    isPopular: false,
    features: [
      "Hasta 20 vehículos en inventario",
      "Hasta 2 usuarios de ventas",
      "CRM de leads con pipeline",
      "1 canal WhatsApp Conectado",
      "Hasta 500 emails/mes de broadcast",
      "Publicación MercadoLibre & Redes",
      "Respuestas IA y plantillas rápidas",
      "Soporte prioritario por email y chat"
    ],
    maxVehicles: "20",
    maxVehiclesCount: 20,
    maxUsers: "2",
    maxUsersCount: 2,
    crmLevel: "Estándar (Pipeline + Asignación)",
    whatsappInbox: "1 Canal Conectado",
    emailBroadcasts: "Hasta 500 emails/mes",
    multichannelPublish: "MercadoLibre + Redes",
    aiAssistant: "Respuestas IA + Plantillas",
    customDomain: "Subdominio + CNAME Básico",
    supportLevel: "Email & Chat Prioritario",
    active: true
  },
  {
    id: "plan-premium",
    name: "Premium",
    priceMonthly: 49,
    priceYearly: 39,
    description: "La solución completa para potenciar tus ventas y automatizar el CRM.",
    badge: "Más Popular",
    isPopular: true,
    features: [
      "Hasta 100 vehículos en inventario",
      "Hasta 5 usuarios de ventas",
      "CRM Avanzado con automatización de embudos",
      "Inbox WhatsApp Multicanal (Meta API)",
      "Hasta 5,000 emails/mes de broadcast",
      "Publicación 1-Clic Ilimitada",
      "Agente IA de atención automatizada",
      "Dominio propio .com con SSL",
      "Soporte 24/7 vía WhatsApp"
    ],
    maxVehicles: "100",
    maxVehiclesCount: 100,
    maxUsers: "5",
    maxUsersCount: 5,
    crmLevel: "Avanzado (Embudo + Metas)",
    whatsappInbox: "Multicanal (Meta API)",
    emailBroadcasts: "Hasta 5,000 emails/mes",
    multichannelPublish: "Publicación Ilimitada 1-Clic",
    aiAssistant: "IA Agente Completo",
    customDomain: "Dominio Propio .com + SSL",
    supportLevel: "Soporte 24/7 WhatsApp",
    active: true
  },
  {
    id: "plan-ultra",
    name: "Ultra",
    priceMonthly: 99,
    priceYearly: 79,
    description: "Máxima potencia con automatizaciones avanzadas y soporte dedicado VIP.",
    badge: "Empresas",
    isPopular: false,
    features: [
      "Vehículos e inventario ilimitados",
      "Usuarios e imobiliarias ilimitadas",
      "CRM Custom + API & Webhooks",
      "WhatsApp Ilimitado + Agentes IA Autónomos",
      "Emails Broadcast Ilimitados + IP Dedicada",
      "Automatización multicanal total",
      "IA Personalizada y entrenada a medida",
      "Dominio propio + Email Verificado",
      "Ejecutivo de cuenta dedicado VIP"
    ],
    maxVehicles: "Ilimitados",
    maxVehiclesCount: 999999,
    maxUsers: "Ilimitados",
    maxUsersCount: 999999,
    crmLevel: "Personalizado + API & Webhooks",
    whatsappInbox: "Ilimitado + Agentes IA",
    emailBroadcasts: "Ilimitados + IP propia",
    multichannelPublish: "Automatización Total",
    aiAssistant: "IA Custom / Fine-tune",
    customDomain: "Dominio + Email Verificado",
    supportLevel: "Ejecutivo Dedicado VIP",
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

