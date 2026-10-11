/**
 * IAM Cryptographic Core
 * Modern, Edge-compatible password hashing and token generation using Web Crypto API.
 * OWASP Compliant: PBKDF2-HMAC-SHA256 with 100,000 iterations & 16-byte random salts.
 * Works natively in Cloudflare Workers and Node.js without native binaries.
 */

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 256; // bits (32 bytes)
const PBKDF2_PREFIX = "pbkdf2:sha256:";

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Converts a Uint8Array into a hex string.
 */
function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex string into a Uint8Array.
 */
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA256 with a unique 16-byte cryptographic salt.
 * Result format: `pbkdf2:sha256:100000:<salt_hex>:<hash_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password cannot be empty");
  }

  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH
  );

  const hashHex = toHex(new Uint8Array(derivedBits));
  const saltHex = toHex(salt);

  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Legacy SHA-256 hash for backward compatibility migration.
 */
async function legacySha256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_salt_n_autos_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(hashBuffer));
}

/**
 * Verifies a password against a stored hash.
 * Supports:
 * 1. Standard PBKDF2 hashes (`pbkdf2:sha256:...`)
 * 2. Legacy SHA-256 hashes (indicates `needsRehash: true` so the system can upgrade it seamlessly)
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!password || !storedHash) {
    return { valid: false, needsRehash: false };
  }

  // 1. PBKDF2 format verification
  if (storedHash.startsWith(PBKDF2_PREFIX)) {
    try {
      const parts = storedHash.slice(PBKDF2_PREFIX.length).split(":");
      if (parts.length !== 3) {
        return { valid: false, needsRehash: false };
      }

      const iterations = parseInt(parts[0], 10);
      const saltHex = parts[1];
      const expectedHashHex = parts[2];

      if (isNaN(iterations) || !saltHex || !expectedHashHex) {
        return { valid: false, needsRehash: false };
      }

      const salt = fromHex(saltHex);
      const encoder = new TextEncoder();

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt.buffer as ArrayBuffer,
          iterations: iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        PBKDF2_KEY_LENGTH
      );

      const derivedHex = toHex(new Uint8Array(derivedBits));
      const valid = constantTimeCompare(derivedHex, expectedHashHex);

      // Si las iteraciones configuradas son menores al estándar actual, sugerir rehash
      const needsRehash = valid && iterations < PBKDF2_ITERATIONS;

      return { valid, needsRehash };
    } catch (e) {
      console.error("Error verifying PBKDF2 password:", e);
      return { valid: false, needsRehash: false };
    }
  }

  // 2. Legacy SHA-256 fallback (transparent upgrade)
  try {
    const legacyHash = await legacySha256(password);
    const valid = constantTimeCompare(legacyHash, storedHash);
    return { valid, needsRehash: valid };
  } catch (e) {
    console.error("Error verifying legacy password hash:", e);
    return { valid: false, needsRehash: false };
  }
}

/**
 * Generates a cryptographically secure numeric OTP (e.g., 6 digits for reset codes).
 */
export function generateSecureOtp(length: number = 6): string {
  const digits = "0123456789";
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[buffer[i] % 10];
  }
  return otp;
}

/**
 * Generates a cryptographically secure random string (URL-safe).
 */
export function generateSecureToken(bytesCount: number = 32): string {
  const buffer = new Uint8Array(bytesCount);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
