// In-memory fallback map para entorno de ejecución en Edge / Cloudflare Workers
const memoryPasswordStore = new Map<string, string>();

/**
 * Obtiene el hash de contraseña almacenado en memoria si existe.
 */
export function getUserPasswordHash(email: string): string | null {
  if (!email || !email.trim()) return null;
  const cleanEmail = email.toLowerCase().trim();
  return memoryPasswordStore.get(cleanEmail) || null;
}

/**
 * Guarda el hash de contraseña temporalmente en memoria para el ciclo de vida del worker.
 */
export function setUserPasswordHash(email: string, passwordHash: string): void {
  if (!email || !passwordHash) return;
  const cleanEmail = email.toLowerCase().trim();
  memoryPasswordStore.set(cleanEmail, passwordHash);
}

