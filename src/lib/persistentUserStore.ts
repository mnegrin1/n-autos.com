import fs from "fs";
import path from "path";

const PRIMARY_STORAGE_PATH = path.join(/*turbopackIgnore: true*/ process.cwd(), ".user_passwords.json");
const FALLBACK_STORAGE_PATH = path.join("/tmp", ".user_passwords.json");

// In-memory fallback map
const memoryPasswordStore = new Map<string, string>();

/**
 * Obtiene el hash de contraseña almacenado para un correo electrónico dado.
 * Busca primero en los archivos de almacenamiento persistente en disco y luego en memoria.
 */
export function getUserPasswordHash(email: string): string | null {
  if (!email || !email.trim()) return null;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Intentar leer desde almacenamiento persistente en disco
  const pathsToTry = [PRIMARY_STORAGE_PATH, FALLBACK_STORAGE_PATH];
  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && parsed[cleanEmail]) {
          return parsed[cleanEmail];
        }
      }
    } catch (err) {}
  }

  // 2. Fallback a memoria RAM
  return memoryPasswordStore.get(cleanEmail) || null;
}

/**
 * Guarda permanentemente el hash de contraseña para un usuario en disco y en memoria RAM.
 */
export function setUserPasswordHash(email: string, passwordHash: string): void {
  if (!email || !passwordHash) return;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Actualizar memoria RAM
  memoryPasswordStore.set(cleanEmail, passwordHash);

  // 2. Leer estado actual en disco
  let store: Record<string, string> = {};
  const pathsToTry = [PRIMARY_STORAGE_PATH, FALLBACK_STORAGE_PATH];

  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          store = parsed;
          break;
        }
      }
    } catch (err) {}
  }

  store[cleanEmail] = passwordHash;
  const jsonStr = JSON.stringify(store, null, 2);

  // 3. Escribir permanentemente en disco
  for (const filePath of pathsToTry) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf8");
    } catch (err) {
      console.error(`Error guardando hash de usuario en disco (${filePath}):`, err);
    }
  }
}
