/**
 * Cryptographic session token utility for Edge & Node runtimes using Web Crypto API.
 */

const SECRET_KEY_STR = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "n-autos-secure-secret-2026";

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY_STR);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Creates a signed JWT-like session token.
 */
export async function createSignedToken(payload: object): Promise<string> {
  const encoder = new TextEncoder();
  const payloadStr = JSON.stringify({ ...payload, iat: Date.now() });
  const encodedPayload = arrayBufferToBase64Url(encoder.encode(payloadStr).buffer as ArrayBuffer);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);

  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies a signed session token.
 */
export async function verifySignedToken(token: string): Promise<any | null> {
  if (!token || !token.includes(".")) {
    // Legacy plain Base64 fallback for backward compatibility
    try {
      const decodedString = atob(token);
      const decoded = JSON.parse(decodedString);
      if (decoded && decoded.id && decoded.role) return decoded;
    } catch {
      return null;
    }
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;
  const encoder = new TextEncoder();

  try {
    const key = await getCryptoKey();
    const payloadBytes = encoder.encode(encodedPayload);

    // Decode signature
    const sigBinary = base64UrlDecode(encodedSignature);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, payloadBytes);
    if (!isValid) return null;

    const payloadJsonStr = base64UrlDecode(encodedPayload);
    return JSON.parse(payloadJsonStr);
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}
