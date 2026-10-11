/**
 * IAM Edge Rate Limiter
 * In-memory sliding window rate limiter designed for Edge / Cloudflare Workers runtimes.
 * Protects authentication endpoints against credential stuffing and OTP brute-force attacks.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Limpieza periódica de registros vencidos para evitar fugas de memoria
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verifica y aplica el límite de tasa para una clave dada.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  _windowMs: number = 10 * 60 * 1000 // 10 minutos por defecto
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  // Ocasionalmente limpiar expirados
  if (Math.random() < 0.05) {
    cleanupExpired();
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Registra un intento fallido para una clave dada.
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number = 10 * 60 * 1000
): void {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
  } else {
    record.count += 1;
  }
}

/**
 * Restablece los intentos tras una autenticación exitosa.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Helpers específicos para flujos de autenticación
 */
export function checkLoginRateLimit(email: string) {
  const cleanKey = `login:${email.toLowerCase().trim()}`;
  return checkRateLimit(cleanKey, 5, 10 * 60 * 1000); // 5 intentos cada 10 min
}

export function recordFailedLogin(email: string) {
  const cleanKey = `login:${email.toLowerCase().trim()}`;
  recordFailedAttempt(cleanKey, 10 * 60 * 1000);
}

export function resetLoginRateLimit(email: string) {
  const cleanKey = `login:${email.toLowerCase().trim()}`;
  resetRateLimit(cleanKey);
}

export function checkOtpRequestRateLimit(email: string) {
  const cleanKey = `otp_req:${email.toLowerCase().trim()}`;
  return checkRateLimit(cleanKey, 3, 15 * 60 * 1000); // Máx 3 solicitudes de OTP cada 15 min
}

export function recordOtpRequest(email: string) {
  const cleanKey = `otp_req:${email.toLowerCase().trim()}`;
  recordFailedAttempt(cleanKey, 15 * 60 * 1000);
}

export function checkOtpVerifyRateLimit(email: string) {
  const cleanKey = `otp_verify:${email.toLowerCase().trim()}`;
  return checkRateLimit(cleanKey, 5, 10 * 60 * 1000); // Máx 5 intentos erróneos de código OTP
}

export function recordOtpVerifyFailed(email: string) {
  const cleanKey = `otp_verify:${email.toLowerCase().trim()}`;
  recordFailedAttempt(cleanKey, 10 * 60 * 1000);
}

export function resetOtpVerifyRateLimit(email: string) {
  const cleanKey = `otp_verify:${email.toLowerCase().trim()}`;
  resetRateLimit(cleanKey);
}
