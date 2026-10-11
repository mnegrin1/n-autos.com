/**
 * IAM Session & Token Management
 * Cryptographically signed JWT-like sessions using Web Crypto API.
 * Enforces strict signature validation, expiration timestamps (exp),
 * and separation of HttpOnly authentication tokens from unprivileged client UI state.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  agency_id: string;
  workspace_code?: string;
  agency_name?: string;
  subdomain?: string;
}

export interface SessionPayload extends SessionUser {
  iat: number; // Timestamp de emisión (segundos)
  exp: number; // Timestamp de expiración (segundos)
}

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

/**
 * Obtiene la clave secreta para la firma HMAC-SHA256.
 * En producción se prioriza AUTH_SECRET / JWT_SECRET.
 */
function getSecretKeyString(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (secret && secret.trim()) {
    return secret.trim();
  }

  return "n-autos-development-fallback-secret-key-2026";
}

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSecretKeyString());
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

function base64UrlDecodeToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecode(str: string): string {
  const bytes = base64UrlDecodeToBytes(str);
  return new TextDecoder().decode(bytes);
}

/**
 * Genera un código de workspace determinista y URL-safe para la automotora o usuario
 */
export async function getWorkspaceCode(
  agencyId?: string,
  userId?: string,
  email?: string
): Promise<string> {
  let seed = "";
  if (
    agencyId &&
    agencyId !== "00000000-0000-0000-0000-000000000000" &&
    !agencyId.startsWith("agency-user-") &&
    !agencyId.startsWith("agency-17")
  ) {
    seed = agencyId;
  } else if (email && email.includes("@")) {
    seed = email.toLowerCase().trim();
  } else if (userId && !userId.startsWith("user-17")) {
    seed = userId;
  } else if (agencyId && agencyId !== "00000000-0000-0000-0000-000000000000") {
    seed = agencyId;
  } else {
    seed = "agency-workspace-default";
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(seed + "_n_autos_workspace_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64Url(hashBuffer).slice(0, 16);
}

/**
 * Crea un token de sesión firmado criptográficamente con tiempo de expiración obligatorio.
 */
export async function createSignedToken(
  user: SessionUser,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + maxAgeSeconds;

  const workspaceCode =
    user.workspace_code ||
    (await getWorkspaceCode(user.agency_id, user.id, user.email));

  const payload: SessionPayload = {
    ...user,
    workspace_code: workspaceCode,
    iat: nowSeconds,
    exp: expSeconds,
  };

  const encoder = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const encodedPayload = arrayBufferToBase64Url(
    encoder.encode(payloadStr).buffer as ArrayBuffer
  );

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);

  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Valida un token firmado criptográficamente y certifica que no haya expirado ni sido manipulado.
 * Elimina cualquier bypass inseguro de tokens no firmados.
 */
export async function verifySignedToken(
  token: string
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, encodedSignature] = parts;
  const encoder = new TextEncoder();

  try {
    const key = await getCryptoKey();
    const payloadBytes = encoder.encode(encodedPayload);

    // Decodificar firma como bytes binarios puros
    const sigBytes = base64UrlDecodeToBytes(encodedSignature);

    // Verificar firma criptográfica con Web Crypto
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      payloadBytes
    );

    if (!isValid) {
      console.warn("Fallo de verificación de firma en token de sesión.");
      return null;
    }

    const payloadJsonStr = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadJsonStr);

    // Validar expiración criptográfica (exp claim)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      console.warn("Token de sesión expirado.");
      return null;
    }

    return payload;
  } catch (e) {
    console.error("Error verificando token de sesión:", e);
    return null;
  }
}

/**
 * Aplica de forma segura las cookies de sesión en el almacén de cookies de Next.js:
 * 1. `admin-session`: HttpOnly=true, Secure=true, SameSite=Lax (Token firmado inmune a XSS)
 * 2. `client-session`: HttpOnly=false (Metadatos visuales no sensibles para la interfaz)
 */
export async function applySessionCookies(
  cookieStore: any,
  sessionUser: SessionUser,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const token = await createSignedToken(sessionUser, maxAgeSeconds);

  // 1. Cookie HttpOnly de autenticación estricta
  cookieStore.set("admin-session", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeSeconds,
  });

  // 2. Cookie pública de cliente para metadatos de UI
  const clientData = {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role: sessionUser.role,
    agency_id: sessionUser.agency_id,
    workspace_code: sessionUser.workspace_code,
    ...(sessionUser.agency_name ? { agency_name: sessionUser.agency_name } : {}),
    ...(sessionUser.subdomain ? { subdomain: sessionUser.subdomain } : {}),
  };

  const clientPayloadB64 = btoa(unescape(encodeURIComponent(JSON.stringify(clientData))));

  cookieStore.set("client-session", clientPayloadB64, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeSeconds,
  });

  return token;
}

/**
 * Limpia todas las cookies de autenticación
 */
export async function removeSessionCookies(cookieStore: any): Promise<void> {
  const expiredConfig = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  cookieStore.set("admin-session", "", expiredConfig);
  cookieStore.set("client-session", "", expiredConfig);
  try {
    cookieStore.delete({ name: "admin-session", path: "/" });
    cookieStore.delete({ name: "client-session", path: "/" });
  } catch {}
}
