import fs from "fs";

const FALLBACK_STORAGE_PATH = "/tmp/.user_passwords.json";

// In-memory fallback map
const memoryPasswordStore = new Map<string, string>();

/**
 * Obtiene el hash de contraseña almacenado para un correo electrónico dado.
 * Busca primero en memoria RAM y luego en almacenamiento temporal si está disponible.
 */
export function getUserPasswordHash(email: string): string | null {
  if (!email || !email.trim()) return null;
  const cleanEmail = email.toLowerCase().trim();

  if (memoryPasswordStore.has(cleanEmail)) {
    return memoryPasswordStore.get(cleanEmail) || null;
  }

  try {
    if (typeof fs !== "undefined" && fs.existsSync && fs.existsSync(FALLBACK_STORAGE_PATH)) {
      const content = fs.readFileSync(FALLBACK_STORAGE_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && parsed[cleanEmail]) {
        memoryPasswordStore.set(cleanEmail, parsed[cleanEmail]);
        return parsed[cleanEmail];
      }
    }
  } catch (err) {}

  return null;
}

/**
 * Guarda el hash de contraseña para un usuario en memoria RAM y temporalmente en disco.
 */
export function setUserPasswordHash(email: string, passwordHash: string): void {
  if (!email || !passwordHash) return;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Actualizar memoria RAM
  memoryPasswordStore.set(cleanEmail, passwordHash);

  // 2. Guardar en almacenamiento temporal si el entorno lo permite
  try {
    let store: Record<string, string> = {};
    if (typeof fs !== "undefined" && fs.existsSync && fs.existsSync(FALLBACK_STORAGE_PATH)) {
      const content = fs.readFileSync(FALLBACK_STORAGE_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        store = parsed;
      }
    }

    store[cleanEmail] = passwordHash;
    if (typeof fs !== "undefined" && fs.writeFileSync) {
      fs.writeFileSync(FALLBACK_STORAGE_PATH, JSON.stringify(store, null, 2), "utf8");
    }
  } catch (err) {}
}
