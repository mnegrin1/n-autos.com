"use client";

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
  enabledGlobally: boolean;
}

export const DEFAULT_FEATURES: FeatureDefinition[] = [
  {
    id: "vehicles",
    name: "Inventario Stock (Vehículos)",
    description: "Gestión de catálogo de vehículos, ficha técnica, fotos y precios.",
    path: "/admin/vehicles",
    category: "Gestión principal",
    enabledGlobally: true
  },
  {
    id: "inbox",
    name: "Bandeja de Entrada (Inbox / Chat)",
    description: "Conversaciones en tiempo real y recepción de consultas de clientes.",
    path: "/admin/inbox",
    category: "Comunicación",
    enabledGlobally: true
  },
  {
    id: "publications",
    name: "Publicaciones Multicanal",
    description: "Difusión de vehículos en múltiples portales y redes de autos.",
    path: "/admin/publications",
    category: "Marketing",
    enabledGlobally: true
  },
  {
    id: "crm",
    name: "Contactos / CRM",
    description: "Base de contactos, embudo de clientes y seguimiento de leads.",
    path: "/admin/crm",
    category: "Ventas",
    enabledGlobally: true
  },
  {
    id: "email",
    name: "Email Broadcasts",
    description: "Envío masivo de correos electrónicos y boletines a clientes.",
    path: "/admin/email/broadcasts",
    category: "Marketing",
    enabledGlobally: true
  },
  {
    id: "automations",
    name: "Automatizaciones",
    description: "Workflows automáticos, asignación de respuestas y disparadores.",
    path: "/admin/automations",
    category: "Procesos",
    enabledGlobally: true
  }
];

export type UserFeatureOverrideState = "default" | "enabled" | "disabled";

export interface UserFeatureOverrides {
  [userIdOrEmail: string]: {
    [featureId: string]: UserFeatureOverrideState;
  };
}

const GLOBAL_FLAGS_KEY = "n_sistemas_global_features_v1";
const USER_OVERRIDES_KEY = "n_sistemas_user_feature_overrides_v1";

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function subscribeFeatureFlags(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGlobalFeatures(): FeatureDefinition[] {
  if (typeof window === "undefined") return DEFAULT_FEATURES;
  try {
    const saved = localStorage.getItem(GLOBAL_FLAGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading global feature flags:", e);
  }
  return DEFAULT_FEATURES;
}

export function saveGlobalFeatures(features: FeatureDefinition[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GLOBAL_FLAGS_KEY, JSON.stringify(features));
      notify();
    } catch (e) {
      console.error("Error saving global feature flags:", e);
    }
  }
}

export function toggleGlobalFeature(featureId: string): void {
  const current = getGlobalFeatures();
  const updated = current.map(f => f.id === featureId ? { ...f, enabledGlobally: !f.enabledGlobally } : f);
  saveGlobalFeatures(updated);
}

export function getUserOverrides(): UserFeatureOverrides {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(USER_OVERRIDES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading user feature overrides:", e);
  }
  return {};
}

export function saveUserOverrides(overrides: UserFeatureOverrides): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(overrides));
      notify();
    } catch (e) {
      console.error("Error saving user feature overrides:", e);
    }
  }
}

export function setUserFeatureOverride(userIdOrEmail: string, featureId: string, state: UserFeatureOverrideState): void {
  const overrides = getUserOverrides();
  if (!overrides[userIdOrEmail]) {
    overrides[userIdOrEmail] = {};
  }
  overrides[userIdOrEmail][featureId] = state;
  saveUserOverrides(overrides);
}

export function isFeatureEnabledForUser(featureId: string, userIdOrEmail?: string): boolean {
  const globalFeatures = getGlobalFeatures();
  const feat = globalFeatures.find(f => f.id === featureId);
  const globalState = feat ? feat.enabledGlobally : true;

  if (!userIdOrEmail) {
    return globalState;
  }

  const overrides = getUserOverrides();
  const userOverride = overrides[userIdOrEmail]?.[featureId];

  if (userOverride === "enabled") return true;
  if (userOverride === "disabled") return false;
  return globalState;
}
