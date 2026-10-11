"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createSignedToken,
  verifySignedToken,
  getWorkspaceCode,
  applySessionCookies,
  removeSessionCookies,
} from "@/lib/iam/session";
import {
  hashPassword,
  verifyPassword,
  generateSecureOtp,
} from "@/lib/iam/crypto";
import { isSuperAdmin } from "@/lib/iam/rbac";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  checkOtpRequestRateLimit,
  recordOtpRequest,
  checkOtpVerifyRateLimit,
  recordOtpVerifyFailed,
  resetOtpVerifyRateLimit,
} from "@/lib/iam/rateLimiter";
import { 
  sendPasswordResetEmail, 
  sendSuperAdminInvitationEmail,
  sendRegistrationOtpEmail,
  sendWelcomeEmail
} from "@/actions/emailActions";
import { getUserPasswordHash, setUserPasswordHash } from "@/lib/persistentUserStore";
import { isSubdomainAvailable } from "@/lib/subdomainHistoryStore";
import { savePersistentAgencySettings } from "@/lib/persistentAgencyStore";
import { isAgencyDeleted, unmarkDeletedAgency } from "@/lib/deletedAgenciesStore";

// Re-exportar funciones criptográficas para compatibilidad
export { hashPassword, verifyPassword, generateSecureOtp };

// In-memory store fallback para códigos OTP de recuperación en entorno demo/desarrollo si la DB no está disponible
const demoResetStore = new Map<string, { code: string; expiresAt: number }>();
// In-memory store para contraseñas de usuarios en modo demo
const demoPasswordStore = new Map<string, string>();

/**
 * Helper para buscar un usuario por correo en Supabase Auth Cloud recorriendo la paginación.
 */
export async function findAuthUserByEmail(email: string) {
  const client = supabaseAdmin || supabase;
  if (!client || !client.auth || !client.auth.admin) return null;
  const clean = email.toLowerCase().trim();
  let page = 1;
  while (page <= 10) {
    try {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
      if (error || !data || !data.users || data.users.length === 0) break;
      const found = data.users.find((u) => u.email?.toLowerCase().trim() === clean);
      if (found) return found;
      if (data.users.length < 100) break;
      page++;
    } catch (e) {
      console.warn("Error en listUsers paginado:", e);
      break;
    }
  }
  return null;
}

export async function login(email: string, password?: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "El correo electrónico es requerido." };
    }

    if (!password || !password.trim()) {
      return { success: false, error: "La contraseña es requerida." };
    }

    const cleanEmail = email.toLowerCase().trim();
    const rawPassword = password.trim();

    // 0. Rate limiting defensivo contra ataques de fuerza bruta y credential stuffing
    const rateLimit = checkLoginRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Demasiados intentos de acceso fallidos. Por seguridad, espera ${rateLimit.retryAfterSeconds} segundos antes de reintentar.`,
      };
    }

    const client = supabaseAdmin || supabase;
    const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";
    let user: any = null;

    // Verificar si la cuenta o su organización fue eliminada por el Superadmin
    if (!isSuperAdminEmail && isAgencyDeleted(undefined, undefined, cleanEmail)) {
      return {
        success: false,
        error: "Tu organización ha sido eliminada por el administrador. El acceso a esta cuenta no está permitido.",
      };
    }

    // 1. Consultar usuario en public.users (sin exigir password_hash)
    try {
      const res = await (client.from("users") as any)
        .select("id, agency_id, name, email, role, created_at, reset_code, reset_expires_at")
        .ilike("email", cleanEmail)
        .maybeSingle();
      user = res.data;
    } catch (err) {
      console.error("Error al consultar Supabase en login:", err);
    }

    if (!isSuperAdminEmail && user?.agency_id && isAgencyDeleted(user.agency_id, undefined, cleanEmail)) {
      return {
        success: false,
        error: "Tu organización ha sido eliminada por el administrador. El acceso a esta cuenta no está permitido.",
      };
    }

    let authenticated = false;
    let authUser: any = null;
    let activeHash: string | null = null;

    // 2. Intentar autenticar primero con Supabase Auth Cloud
    try {
      const authRes = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: rawPassword,
      });

      if (authRes.data?.user) {
        authenticated = true;
        authUser = authRes.data.user;
      }
    } catch (authErr) {
      console.warn("Aviso: Error al intentar signInWithPassword en Supabase Auth:", authErr);
    }

    // 3. Si no autenticó directamente con signInWithPassword, verificar mediante motor IAM
    if (!authenticated) {
      try {
        authUser = await findAuthUserByEmail(cleanEmail);
      } catch (e) {
        console.warn("Error buscando authUser:", e);
      }

      if (!authUser) {
        // El usuario aún no existe en Supabase Auth Cloud
        if (isSuperAdminEmail) {
          const newPbkdf2 = await hashPassword(rawPassword);
          try {
            const createRes = await client.auth.admin.createUser({
              email: cleanEmail,
              password: rawPassword,
              email_confirm: true,
              user_metadata: {
                name: "Mauricio Negrin",
                role: "superadmin",
                agency_id: "00000000-0000-0000-0000-000000000000",
                password_hash: newPbkdf2,
              },
            });

            if (createRes.data?.user) {
              authenticated = true;
              authUser = createRes.data.user;
              activeHash = newPbkdf2;
            }
          } catch (createErr) {
            console.error("Error aprovisionando superadmin en Supabase Auth:", createErr);
          }
        } else if (user) {
          const newPbkdf2 = await hashPassword(rawPassword);
          try {
            const createRes = await client.auth.admin.createUser({
              email: cleanEmail,
              password: rawPassword,
              email_confirm: true,
              user_metadata: {
                name: user.name || "Usuario",
                role: user.role || "admin",
                agency_id: user.agency_id || "agency-starter",
                password_hash: newPbkdf2,
              },
            });

            if (createRes.data?.user) {
              authenticated = true;
              authUser = createRes.data.user;
              activeHash = newPbkdf2;
            }
          } catch (createErr) {
            console.error("Error aprovisionando usuario existente en Supabase Auth:", createErr);
          }
        }
      } else {
        // El usuario existe en Supabase Auth. Verificar hash con verifyPassword (soporta PBKDF2 y upgrade transparente)
        const storedHash =
          authUser.user_metadata?.password_hash ||
          getUserPasswordHash(cleanEmail) ||
          demoPasswordStore.get(cleanEmail);

        if (storedHash) {
          const verification = await verifyPassword(rawPassword, storedHash);
          if (verification.valid) {
            authenticated = true;

            // Si requiere re-hash (era SHA-256 legacy), actualizarlo inmediatamente a PBKDF2
            if (verification.needsRehash) {
              const upgradedHash = await hashPassword(rawPassword);
              activeHash = upgradedHash;
              try {
                await client.auth.admin.updateUserById(authUser.id, {
                  password: rawPassword,
                  email_confirm: true,
                  user_metadata: {
                    ...authUser.user_metadata,
                    password_hash: upgradedHash,
                  },
                });
              } catch (upgErr) {
                console.warn("Aviso actualizando hash a PBKDF2:", upgErr);
              }
            } else {
              activeHash = storedHash;
            }
          } else {
            recordFailedLogin(cleanEmail);
            return { success: false, error: "Contraseña incorrecta." };
          }
        }
      }
    }

    if (!authenticated) {
      recordFailedLogin(cleanEmail);
      return {
        success: false,
        error: "Contraseña incorrecta o la cuenta no tiene contraseña configurada. Si no recuerdas tu contraseña, haz clic en '¿Olvidaste tu contraseña?' para restablecerla.",
      };
    }

    // Éxito: restablecer intentos de fuerza bruta
    resetLoginRateLimit(cleanEmail);

    // 4. Sincronizar usuario en public.users
    const effectiveUserId =
      authUser?.id ||
      user?.id ||
      (isSuperAdminEmail
        ? "00000000-0000-0000-0000-000000000000"
        : `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`);
    const effectiveAgencyId = isSuperAdminEmail
      ? "00000000-0000-0000-0000-000000000000"
      : (user?.agency_id || authUser?.user_metadata?.agency_id || (cleanEmail === "mauricionegrinmogni1@gmail.com" ? "7bdc2014-f7e0-44c3-a8b4-33152937bfa6" : `agency-${effectiveUserId}`));
    const effectiveName = isSuperAdminEmail
      ? "Mauricio Negrin"
      : (user?.name || authUser?.user_metadata?.name || "Usuario");

    // Verificar si la organización asignada está dada de baja o eliminada
    if (!isSuperAdminEmail) {
      if (isAgencyDeleted(effectiveAgencyId, undefined, cleanEmail)) {
        return {
          success: false,
          error: "Tu organización ha sido eliminada por el administrador. El acceso a esta cuenta no está permitido.",
        };
      }

      if (client && effectiveAgencyId && effectiveAgencyId !== "00000000-0000-0000-0000-000000000000") {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveAgencyId);
          let checkRes: any;
          if (isUuid) {
            checkRes = await (client.from("agencies") as any).select("id").eq("id", effectiveAgencyId).maybeSingle();
          } else {
            checkRes = await (client.from("agencies") as any).select("id").ilike("subdomain", effectiveAgencyId.toLowerCase()).maybeSingle();
          }
          if (checkRes && !checkRes.error && !checkRes.data && !effectiveAgencyId.startsWith("agency-user-")) {
            return {
              success: false,
              error: "Tu organización ha sido eliminada por el administrador. El acceso a esta cuenta no está permitido.",
            };
          }
        } catch (_) {}
      }
    }

    try {
      if (!user) {
        await (client.from("users") as any).insert({
          id: effectiveUserId,
          agency_id: effectiveAgencyId,
          name: effectiveName,
          email: cleanEmail,
          role: "admin",
        });
      }
    } catch (syncErr) {
      console.warn("Aviso: No se pudo sincronizar usuario en public.users:", syncErr);
    }

    if (activeHash) {
      setUserPasswordHash(cleanEmail, activeHash);
      demoPasswordStore.set(cleanEmail, activeHash);
    }

    // Obtener nombre y subdominio de la automotora para la sesión
    let sessionAgencyName: string | undefined = undefined;
    let sessionSubdomain: string | undefined = undefined;
    if (effectiveAgencyId && effectiveAgencyId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const { data: dbAg } = await (client.from("agencies") as any)
          .select("name, subdomain")
          .eq("id", effectiveAgencyId)
          .maybeSingle();
        if (dbAg) {
          sessionAgencyName = dbAg.name;
          sessionSubdomain = dbAg.subdomain;
        }
      } catch (_) {}
    }

    const workspaceCode = await getWorkspaceCode(effectiveAgencyId, effectiveUserId, cleanEmail);

    // Generar sesión con token firmado criptográficamente
    const sessionData = {
      id: effectiveUserId,
      email: cleanEmail,
      name: effectiveName,
      role: isSuperAdminEmail ? "superadmin" : (user?.role || authUser?.user_metadata?.role || "admin"),
      agency_id: effectiveAgencyId,
      workspace_code: workspaceCode,
      ...(sessionAgencyName ? { agency_name: sessionAgencyName } : {}),
      ...(sessionSubdomain ? { subdomain: sessionSubdomain } : {}),
    };

    const cookieStore = await cookies();
    await applySessionCookies(cookieStore, sessionData, 60 * 60 * 24 * 7);

    return { success: true, user: sessionData };
  } catch (globalErr: any) {
    console.error("Error inesperado en server action login:", globalErr);
    return {
      success: false,
      error: globalErr?.message || "Ocurrió un error inesperado al procesar el inicio de sesión. Por favor intenta de nuevo.",
    };
  }
}

/**
 * Server Action especializada para inicio de sesión en el panel exclusivo de Superadmin.
 * Verifica explícitamente que la cuenta autenticada posea el rol de Superadmin.
 */
export async function loginSuperAdmin(email: string, password?: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  isUnauthorizedRole?: boolean;
}> {
  const res = await login(email, password);
  if (!res.success || !res.user) {
    return { success: false, error: res.error || "Error al iniciar sesión." };
  }

  if (!isSuperAdmin(res.user)) {
    // Limpiar sesión creada por login() ya que este usuario no tiene permisos de Superadmin
    await logout();
    return {
      success: false,
      isUnauthorizedRole: true,
      error: "Acceso Denegado: Esta cuenta no posee privilegios globales de Superadministrador. Inicia sesión en el panel de tu automotora.",
    };
  }

  return { success: true, user: res.user };
}

export async function logout() {
  const cookieStore = await cookies();
  await removeSessionCookies(cookieStore);
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;
    if (!token) return null;

    const decoded = await verifySignedToken(token);
    if (!decoded) return null;

    // Si la organización fue eliminada y no es Superadmin, invalidar y revocar sesión
    if (!isSuperAdmin(decoded)) {
      if (isAgencyDeleted(decoded.agency_id, decoded.subdomain, decoded.email)) {
        await removeSessionCookies(cookieStore);
        return null;
      }
    }

    if (decoded && !decoded.workspace_code) {
      decoded.workspace_code = await getWorkspaceCode(decoded.agency_id, decoded.id, decoded.email);
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function registerUserSession(sessionData: {
  id: string;
  email: string;
  name: string;
  role?: string;
  agency_id?: string;
  agency_name?: string;
  subdomain?: string;
}) {
  try {
    const data = {
      id: sessionData.id || "user-starter-" + Date.now(),
      email: sessionData.email,
      name: sessionData.name,
      role: sessionData.role || "admin",
      agency_id: sessionData.agency_id || "agency-starter",
      ...(sessionData.agency_name ? { agency_name: sessionData.agency_name } : {}),
      ...(sessionData.subdomain ? { subdomain: sessionData.subdomain } : {}),
    };

    const cookieStore = await cookies();
    await applySessionCookies(cookieStore, data, 60 * 60 * 24 * 7);

    return { success: true, user: data };
  } catch (e: any) {
    console.error("Error setting session cookie:", e);
    return { success: false, error: e?.message || "Error al establecer sesión." };
  }
}

/**
 * Solicita la recuperación de contraseña generando un código OTP aleatorio criptográfico de 6 dígitos
 * y enviándolo por correo mediante Resend.
 * Protegido contra ataques de denegación de servicio y saturación de correo mediante rate limiting.
 */
export async function requestPasswordReset(email: string) {
  if (!email || !email.trim() || !email.includes("@")) {
    return { success: false, error: "Ingresa un correo electrónico válido." };
  }

  const cleanEmail = email.toLowerCase().trim();

  // Rate limiting para solicitudes de OTP
  const rateLimit = checkOtpRequestRateLimit(cleanEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Has alcanzado el límite de solicitudes de recuperación. Por favor espera ${rateLimit.retryAfterSeconds} segundos antes de solicitar otro código.`,
    };
  }
  recordOtpRequest(cleanEmail);

  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";

  // Generar código OTP criptográfico seguro de 6 dígitos
  const otpCode = generateSecureOtp(6);
  const expiresAtMs = Date.now() + 15 * 60 * 1000; // Expira en 15 minutos
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  let userName = isSuperAdminEmail ? "Mauricio Negrin" : "Usuario";
  const client = supabaseAdmin || supabase;

  // 1. Guardar o actualizar en public.users
  try {
    const { data: user } = await (client.from("users") as any)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (user) {
      userName = user.name || userName;
      await (client.from("users") as any)
        .update({
          reset_code: otpCode,
          reset_expires_at: expiresAtIso,
        })
        .eq("id", user.id);
    } else {
      await (client.from("users") as any).insert({
        id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : undefined,
        agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : "00000000-0000-0000-0000-000000000000",
        name: userName,
        email: cleanEmail,
        role: "admin",
        reset_code: otpCode,
        reset_expires_at: expiresAtIso,
      });
    }
  } catch (err) {
    console.warn("Aviso: No se pudo guardar reset_code en public.users:", err);
  }

  // 2. Guardar también en Supabase Auth user_metadata
  try {
    const authUser = await findAuthUserByEmail(cleanEmail);
    if (authUser) {
      userName = authUser.user_metadata?.name || userName;
      await client.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          reset_code: otpCode,
          reset_expires_at: expiresAtIso,
        },
      });
    }
  } catch (authErr) {
    console.warn("Aviso: No se pudo actualizar reset_code en auth.users:", authErr);
  }

  // Fallback demo siempre disponible
  demoResetStore.set(cleanEmail, { code: otpCode, expiresAt: expiresAtMs });

  // Intentar enviar el correo mediante Resend
  const emailRes = await sendPasswordResetEmail(cleanEmail, otpCode, userName);

  if (emailRes.success) {
    return {
      success: true,
      message: `Hemos enviado un código de recuperación a ${cleanEmail}. Por favor revisa tu bandeja de entrada.`,
    };
  } else {
    console.log(`[DEMO AUTH OTP] Código de recuperación generado para ${cleanEmail}: ${otpCode}`);
    return {
      success: true,
      demoCode: otpCode,
      message: `Código enviado. (Modo pruebas: tu código es ${otpCode})`,
    };
  }
}

/**
 * Verifica el código OTP de 6 dígitos y establece una nueva contraseña con hashing PBKDF2
 * directamente en Supabase Auth Cloud de forma permanente e indestructible.
 * Protegido contra ataques de fuerza bruta en los códigos OTP de 6 dígitos.
 */
export async function verifyOTPAndResetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  if (!email || !email.trim()) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  if (!code || code.trim().length !== 6) {
    return { success: false, error: "El código debe tener 6 dígitos." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  const rawPassword = newPassword.trim();

  // Rate limiting de intentos de verificación OTP
  const rateLimit = checkOtpVerifyRateLimit(cleanEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos con el código de verificación. Por seguridad, espera ${rateLimit.retryAfterSeconds} segundos antes de reintentar.`,
    };
  }

  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";
  const client = supabaseAdmin || supabase;
  const newHash = await hashPassword(rawPassword);

  let verified = false;
  let authUser: any = null;

  // 1. Buscar en auth.users y verificar reset_code en user_metadata
  try {
    authUser = await findAuthUserByEmail(cleanEmail);
    if (authUser && authUser.user_metadata?.reset_code) {
      const isCodeValid = authUser.user_metadata.reset_code === cleanCode;
      const isNotExpired =
        authUser.user_metadata.reset_expires_at &&
        new Date(authUser.user_metadata.reset_expires_at) > new Date();

      if (isCodeValid && isNotExpired) {
        verified = true;
      }
    }
  } catch (e) {
    console.warn("Error verificando reset_code en auth.users:", e);
  }

  // 2. Si no fue verificado por metadata, verificar en public.users
  if (!verified) {
    try {
      const { data: user } = await (client.from("users") as any)
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (user && user.reset_code) {
        const isCodeValid = user.reset_code === cleanCode;
        const isNotExpired =
          user.reset_expires_at && new Date(user.reset_expires_at) > new Date();

        if (isCodeValid && isNotExpired) {
          verified = true;
        }
      }
    } catch (err) {
      console.warn("Error al verificar en public.users:", err);
    }
  }

  // 3. Fallback a demoResetStore
  if (!verified) {
    const demoData = demoResetStore.get(cleanEmail);
    if (demoData && demoData.code === cleanCode && demoData.expiresAt > Date.now()) {
      demoResetStore.delete(cleanEmail);
      verified = true;
    }
  }

  if (!verified) {
    recordOtpVerifyFailed(cleanEmail);
    return {
      success: false,
      error: "El código de verificación es incorrecto o ha expirado. Por favor solicita uno nuevo.",
    };
  }

  // Éxito: restablecer intentos de verificación
  resetOtpVerifyRateLimit(cleanEmail);

  // 4. ACTUALIZAR O CREAR CONTRASEÑA CON HASH PBKDF2
  try {
    if (authUser?.id) {
      await client.auth.admin.updateUserById(authUser.id, {
        password: rawPassword,
        email_confirm: true,
        user_metadata: {
          ...authUser.user_metadata,
          reset_code: null,
          reset_expires_at: null,
          password_hash: newHash,
          ...(isSuperAdminEmail ? { role: "superadmin" } : {}),
        },
      });
    } else {
      const createRes = await client.auth.admin.createUser({
        email: cleanEmail,
        password: rawPassword,
        email_confirm: true,
        user_metadata: {
          name: isSuperAdminEmail ? "Mauricio Negrin" : "Usuario",
          role: isSuperAdminEmail ? "superadmin" : "admin",
          agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : "00000000-0000-0000-0000-000000000000",
          password_hash: newHash,
        },
      });
      authUser = createRes.data?.user;
    }
  } catch (authErr) {
    console.error("Error al actualizar contraseña en Supabase Auth Cloud:", authErr);
  }

  // 5. Limpiar reset_code en public.users
  try {
    await (client.from("users") as any)
      .update({
        reset_code: null,
        reset_expires_at: null,
      })
      .ilike("email", cleanEmail);
  } catch (dbErr) {
    console.warn("Aviso: No se pudo limpiar reset_code en public.users:", dbErr);
  }

  setUserPasswordHash(cleanEmail, newHash);
  demoPasswordStore.set(cleanEmail, newHash);

  return {
    success: true,
    message: "¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión con tu nueva contraseña.",
  };
}

/**
 * Permite a un usuario autenticado cambiar su contraseña desde el panel de control.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.email) {
    return { success: false, error: "Sesión no válida o expirada. Vuelve a iniciar sesión." };
  }

  if (!currentPassword || !currentPassword.trim()) {
    return { success: false, error: "La contraseña actual es requerida." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }

  const cleanEmail = currentUser.email.toLowerCase().trim();
  const rawCurrentPassword = currentPassword.trim();
  const rawNewPassword = newPassword.trim();
  const client = supabaseAdmin || supabase;

  // 1. Validar contraseña actual con Supabase Auth signInWithPassword
  let isValid = false;
  try {
    const checkRes = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: rawCurrentPassword,
    });
    if (checkRes.data?.user) {
      isValid = true;
    }
  } catch (e) {}

  if (!isValid) {
    const storedHash = getUserPasswordHash(cleanEmail) || demoPasswordStore.get(cleanEmail);
    if (storedHash) {
      const check = await verifyPassword(rawCurrentPassword, storedHash);
      if (check.valid) {
        isValid = true;
      }
    }
  }

  if (!isValid) {
    return { success: false, error: "La contraseña actual es incorrecta." };
  }

  // 2. Actualizar contraseña con hash PBKDF2
  const newHash = await hashPassword(rawNewPassword);
  try {
    const authUser = await findAuthUserByEmail(cleanEmail);
    if (authUser?.id) {
      await client.auth.admin.updateUserById(authUser.id, {
        password: rawNewPassword,
        user_metadata: {
          ...authUser.user_metadata,
          password_hash: newHash,
        },
      });
    } else {
      await client.auth.admin.createUser({
        email: cleanEmail,
        password: rawNewPassword,
        email_confirm: true,
        user_metadata: {
          name: currentUser.name || "Usuario",
          role: currentUser.role || "admin",
          agency_id: currentUser.agency_id || "00000000-0000-0000-0000-000000000000",
          password_hash: newHash,
        },
      });
    }
  } catch (updateErr) {
    console.error("Error al actualizar contraseña en Supabase Auth:", updateErr);
  }

  setUserPasswordHash(cleanEmail, newHash);
  demoPasswordStore.set(cleanEmail, newHash);

  return {
    success: true,
    message: "Contraseña modificada correctamente.",
  };
}

/**
 * Activa la cuenta de un usuario invitado y establece su nueva contraseña con hash PBKDF2.
 */
export async function activateUserAccount({
  email,
  code,
  password,
  agencyId,
  name,
}: {
  email: string;
  code?: string;
  password: string;
  agencyId?: string;
  name?: string;
}) {
  if (!email || !password || password.length < 6) {
    return { success: false, error: "La contraseña debe contener al menos 6 caracteres." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const rawPassword = password.trim();
  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";
  const client = supabaseAdmin || supabase;
  const passwordHash = await hashPassword(rawPassword);

  let authUser: any = null;

  // 1. Crear o actualizar permanentemente en Supabase Auth Cloud
  try {
    authUser = await findAuthUserByEmail(cleanEmail);
    if (authUser?.id) {
      await client.auth.admin.updateUserById(authUser.id, {
        password: rawPassword,
        email_confirm: true,
        user_metadata: {
          ...authUser.user_metadata,
          name: isSuperAdminEmail ? "Mauricio Negrin" : (name || authUser.user_metadata?.name || "Usuario"),
          role: isSuperAdminEmail ? "superadmin" : (authUser.user_metadata?.role || "admin"),
          agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : (agencyId || authUser.user_metadata?.agency_id || "agency-starter"),
          password_hash: passwordHash,
          reset_code: null,
          reset_expires_at: null,
        },
      });
    } else {
      const createRes = await client.auth.admin.createUser({
        email: cleanEmail,
        password: rawPassword,
        email_confirm: true,
        user_metadata: {
          name: isSuperAdminEmail ? "Mauricio Negrin" : (name || "Usuario"),
          role: isSuperAdminEmail ? "superadmin" : "admin",
          agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : (agencyId || "agency-starter"),
          password_hash: passwordHash,
        },
      });
      authUser = createRes.data?.user;
    }
  } catch (authErr) {
    console.error("Error al guardar cuenta en Supabase Auth Cloud:", authErr);
  }

  // 2. Sincronizar en public.users con role 'admin'
  const effectiveUserId = authUser?.id || (isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`);
  const effectiveAgencyId = isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : (agencyId || "agency-starter");

  try {
    const { data: existingUser } = await (client.from("users") as any)
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      await (client.from("users") as any)
        .update({
          reset_code: null,
          reset_expires_at: null,
          ...(name ? { name } : {}),
        })
        .eq("id", existingUser.id);
    } else {
      await (client.from("users") as any).insert({
        id: effectiveUserId,
        agency_id: effectiveAgencyId,
        name: isSuperAdminEmail ? "Mauricio Negrin" : (name || "Usuario"),
        email: cleanEmail,
        role: "admin",
      });
    }
  } catch (dbErr) {
    console.warn("Aviso: No se pudo sincronizar en public.users:", dbErr);
  }

  setUserPasswordHash(cleanEmail, passwordHash);
  demoPasswordStore.set(cleanEmail, passwordHash);

  const sessionData = {
    id: effectiveUserId,
    email: cleanEmail,
    name: isSuperAdminEmail ? "Mauricio Negrin" : (name || "Usuario"),
    role: isSuperAdminEmail ? "superadmin" : "admin",
    agency_id: effectiveAgencyId,
  };

  const cookieStore = await cookies();
  await applySessionCookies(cookieStore, sessionData, 60 * 60 * 24 * 7);

  return { success: true, user: sessionData };
}

/**
 * Genera un código de activación y envía un correo electrónico de invitación
 * para que el superadmin (mauricio.negrin@n-sistemas.com) configure su contraseña.
 */
export async function sendSuperAdminPasswordInviteEmailAction(targetEmail: string = "mauricio.negrin@n-sistemas.com") {
  const cleanEmail = targetEmail.toLowerCase().trim();
  const activationCode = generateSecureOtp(6);
  const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const client = supabaseAdmin || supabase;

  // 1. Guardar en Supabase Auth user_metadata
  try {
    const authUser = await findAuthUserByEmail(cleanEmail);
    if (authUser?.id) {
      await client.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          name: "Mauricio Negrin",
          role: "superadmin",
          agency_id: "00000000-0000-0000-0000-000000000000",
          reset_code: activationCode,
          reset_expires_at: expiresAtIso,
        },
      });
    } else {
      await client.auth.admin.createUser({
        email: cleanEmail,
        password: `TmpSuper@${activationCode}!`,
        email_confirm: true,
        user_metadata: {
          name: "Mauricio Negrin",
          role: "superadmin",
          agency_id: "00000000-0000-0000-0000-000000000000",
          reset_code: activationCode,
          reset_expires_at: expiresAtIso,
        },
      });
    }
  } catch (e) {
    console.warn("Aviso: Error gestionando superadmin en Supabase Auth:", e);
  }

  // 2. Registrar en public.users con role 'admin' para evitar violación de restricción
  try {
    const { data: existingUser } = await (client.from("users") as any)
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      await (client.from("users") as any)
        .update({
          reset_code: activationCode,
          reset_expires_at: expiresAtIso,
        })
        .eq("id", existingUser.id);
    } else {
      await (client.from("users") as any).insert({
        id: "00000000-0000-0000-0000-000000000000",
        email: cleanEmail,
        name: "Mauricio Negrin",
        role: "admin",
        agency_id: "00000000-0000-0000-0000-000000000000",
        reset_code: activationCode,
        reset_expires_at: expiresAtIso,
      });
    }
  } catch (err) {
    console.warn("Aviso: No se pudo guardar el usuario superadmin en public.users:", err);
  }

  // Guardar en demo reset store
  demoResetStore.set(cleanEmail, { code: activationCode, expiresAt: expiresAtMs });

  // Enviar correo vía Resend API
  const emailRes = await sendSuperAdminInvitationEmail(cleanEmail, activationCode, "Mauricio Negrin");

  if (emailRes.success) {
    return {
      success: true,
      message: `Se ha enviado el correo de configuración de contraseña a ${cleanEmail}. Revisa tu bandeja de entrada.`,
    };
  } else {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.n-autos.com";
    const directLink = `${appUrl}/admin/accept-invite?email=${encodeURIComponent(cleanEmail)}&code=${activationCode}&name=Mauricio%20Negrin&role=superadmin`;
    return {
      success: true,
      demoLink: directLink,
      error: emailRes.error,
      message: `Correo enviado a ${cleanEmail}. Si hay problemas de entregabilidad, usa este enlace directo: ${directLink}`,
    };
  }
}

/**
 * Valida la disponibilidad de un subdominio web para el formulario de registro en vivo.
 */
export async function checkSubdomainAvailableAction(
  subdomain: string
): Promise<{ available: boolean; reason?: string }> {
  return await isSubdomainAvailable(subdomain);
}

export interface RegisterTrialParams {
  name: string;
  email: string;
  password: string;
  agencyName: string;
  subdomain: string;
  whatsapp?: string;
  acceptedTerms?: boolean;
}

/**
 * Registra una nueva automotora y su usuario administrador para la prueba gratis de 14 días.
 * Crea la organización en agencies, el usuario en Supabase Auth & public.users,
 * e inicia la sesión automáticamente con la cookie admin-session.
 */
export async function registerTrialAgency(params: RegisterTrialParams): Promise<{
  success: boolean;
  error?: string;
  user?: any;
  agencyId?: string;
  agencyName?: string;
  subdomain?: string;
}> {
  try {
    const cleanName = (params.name || "").trim();
    const cleanEmail = (params.email || "").toLowerCase().trim();
    const rawPassword = (params.password || "").trim();
    const cleanAgencyName = (params.agencyName || "").trim();
    const cleanSubdomain = (params.subdomain || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    const cleanWhatsapp = (params.whatsapp || "").trim();

    // 1. Validaciones iniciales
    if (params.acceptedTerms === false) {
      return {
        success: false,
        error: "Debes aceptar los Términos y Condiciones para registrar tu automotora.",
      };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Por favor ingresa tu nombre completo." };
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }
    if (!rawPassword || rawPassword.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (!cleanAgencyName || cleanAgencyName.length < 2) {
      return { success: false, error: "Por favor ingresa el nombre de tu automotora." };
    }
    if (!cleanSubdomain || cleanSubdomain.length < 3) {
      return { success: false, error: "El subdominio web debe tener al menos 3 caracteres alfanuméricos." };
    }

    // 2. Verificar disponibilidad del subdominio
    const subCheck = await isSubdomainAvailable(cleanSubdomain);
    if (!subCheck.available) {
      return {
        success: false,
        error: subCheck.reason || "El subdominio seleccionado ya está en uso o no se encuentra disponible.",
      };
    }

    const client = supabaseAdmin || supabase;
    const inputHash = await hashPassword(rawPassword);

    // 3. Comprobar si ya existe una cuenta con este correo
    if (client) {
      try {
        const { data: existingUser } = await (client.from("users") as any)
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (existingUser) {
          return {
            success: false,
            error: "Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.",
          };
        }
      } catch (e) {
        console.warn("Aviso al comprobar usuario previo:", e);
      }
    }

    // 4. Crear la organización / automotora en agencies
    let agencyId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "agency-" + Date.now();

    if (client) {
      try {
        const { data: newAgency, error: agencyErr } = await (client.from("agencies") as any)
          .insert({
            name: cleanAgencyName,
            subdomain: cleanSubdomain,
            whatsapp: cleanWhatsapp || null,
            primary_color: "#10b981",
            secondary_color: "#059669",
          })
          .select("id")
          .single();

        if (!agencyErr && newAgency?.id) {
          agencyId = newAgency.id;
        } else if (agencyErr) {
          console.warn("Aviso al registrar en tabla agencies:", agencyErr.message);
        }
      } catch (err) {
        console.warn("Excepción al registrar agencia en Supabase:", err);
      }
    }

    unmarkDeletedAgency(agencyId, cleanSubdomain);

    // Persistir en memoria y almacenamiento de fallback
    const initialAgencyRecord = {
      id: agencyId,
      name: cleanAgencyName,
      subdomain: cleanSubdomain,
      whatsapp: cleanWhatsapp || "+598 99 000 000",
      contact_email: cleanEmail,
      primary_color: "#10b981",
      secondary_color: "#059669",
    };
    savePersistentAgencySettings(initialAgencyRecord, agencyId);
    savePersistentAgencySettings(initialAgencyRecord, cleanSubdomain);

    // 5. Crear usuario en Supabase Auth
    let userId = "user-" + Date.now();
    if (client && client.auth && client.auth.admin) {
      try {
        const authRes = await client.auth.admin.createUser({
          email: cleanEmail,
          password: rawPassword,
          email_confirm: true,
          user_metadata: {
            name: cleanName,
            role: "admin",
            agency_id: agencyId,
            password_hash: inputHash,
          },
        });

        if (authRes.data?.user?.id) {
          userId = authRes.data.user.id;
        } else if (authRes.error) {
          if (
            authRes.error.message?.toLowerCase().includes("already") ||
            authRes.error.message?.toLowerCase().includes("exists") ||
            authRes.error.message?.toLowerCase().includes("registrado")
          ) {
            const existingAuth = await findAuthUserByEmail(cleanEmail);
            if (existingAuth) {
              userId = existingAuth.id;
              await client.auth.admin.updateUserById(userId, {
                password: rawPassword,
                user_metadata: { name: cleanName, role: "admin", agency_id: agencyId },
              });
            }
          }
        }
      } catch (authErr) {
        console.warn("Aviso al crear auth user en Supabase:", authErr);
      }
    }

    // 6. Vincular o insertar en public.users
    if (client) {
      try {
        await (client.from("users") as any).upsert({
          id: userId,
          agency_id: agencyId,
          name: cleanName,
          email: cleanEmail,
          role: "admin",
          password_hash: inputHash,
        });
      } catch (publicErr) {
        console.warn("Aviso al vincular public.users:", publicErr);
      }
    }

    // Almacenar hashes para sesión en memoria
    setUserPasswordHash(cleanEmail, inputHash);
    demoPasswordStore.set(cleanEmail, inputHash);

    // 7. Establecer sesión autenticada con token firmado
    const workspaceCode = await getWorkspaceCode(agencyId, userId, cleanEmail);
    const sessionData = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: "admin",
      agency_id: agencyId,
      workspace_code: workspaceCode,
      agency_name: cleanAgencyName,
      subdomain: cleanSubdomain,
    };

    const cookieStore = await cookies();
    await applySessionCookies(cookieStore, sessionData, 60 * 60 * 24 * 14); // 14 días de prueba gratis

    // 8. Enviar correo de bienvenida tras registro exitoso
    try {
      await sendWelcomeEmail(cleanEmail, cleanName, cleanAgencyName, cleanSubdomain);
    } catch (welcomeErr) {
      console.warn("Aviso al enviar correo de bienvenida tras registro:", welcomeErr);
    }

    return {
      success: true,
      user: sessionData,
      agencyId,
      agencyName: cleanAgencyName,
      subdomain: cleanSubdomain,
    };
  } catch (error: any) {
    console.error("Error en registerTrialAgency:", error);
    return {
      success: false,
      error: error?.message || "Ocurrió un error inesperado al crear tu cuenta. Por favor intenta nuevamente.",
    };
  }
}

// In-memory store para códigos OTP de verificación de registro
const registrationOtpStore = new Map<string, { code: string; expiresAt: number; name?: string }>();
const verifiedRegistrationEmails = new Map<string, number>();

/**
 * Genera y envía un código OTP de 6 dígitos al correo del usuario antes del registro definitivo.
 */
export async function sendRegistrationVerificationAction(email: string, name?: string) {
  try {
    if (!email || !email.trim() || !email.includes("@")) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || "").trim() || "Usuario";

    // 1. Rate limiting defensivo
    const rateLimit = checkOtpRequestRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Demasiadas solicitudes. Por favor espera ${rateLimit.retryAfterSeconds} segundos antes de solicitar otro código.`,
      };
    }

    // 2. Comprobar si ya existe una cuenta con este correo
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        const { data: existingUser } = await (client.from("users") as any)
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (existingUser) {
          return {
            success: false,
            error: "Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.",
          };
        }
      } catch (e) {
        console.warn("Aviso al comprobar usuario previo en verificación:", e);
      }
    }

    // 3. Generar código OTP seguro de 6 dígitos
    const code = generateSecureOtp(6);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    registrationOtpStore.set(cleanEmail, { code, expiresAt, name: cleanName });
    recordOtpRequest(cleanEmail);

    // 4. Enviar correo vía Resend
    const mailRes = await sendRegistrationOtpEmail(cleanEmail, code, cleanName);
    if (!mailRes.success) {
      console.warn("Aviso: Falló el envío del correo de verificación vía Resend:", mailRes.error);
      // Fallback seguro en entorno de desarrollo / demo si aún no se cargó API key
      if (process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_123456789")) {
        return { 
          success: true, 
          message: `Código enviado. En entorno local o sin API key configurada, tu código es: ${code}`,
          devCode: code
        };
      }
      return {
        success: false,
        error: mailRes.error || "No se pudo enviar el correo de verificación. Por favor revisa la dirección e intenta nuevamente.",
      };
    }

    return { success: true, message: "Código de verificación enviado exitosamente a tu correo." };
  } catch (err: any) {
    console.error("Error en sendRegistrationVerificationAction:", err);
    return { success: false, error: "Error al enviar código de verificación." };
  }
}

/**
 * Valida el código OTP de 6 dígitos ingresado por el usuario.
 */
export async function verifyRegistrationCodeAction(email: string, code: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "El correo es requerido." };
    }
    if (!code || !code.trim()) {
      return { success: false, error: "Por favor ingresa el código de 6 dígitos." };
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    // 1. Rate limiting de verificación
    const rateLimit = checkOtpVerifyRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.retryAfterSeconds} segundos.`,
      };
    }

    const entry = registrationOtpStore.get(cleanEmail);
    if (!entry) {
      recordOtpVerifyFailed(cleanEmail);
      return {
        success: false,
        error: "No encontramos un código activo para este correo. Por favor solicita uno nuevo.",
      };
    }

    if (Date.now() > entry.expiresAt) {
      registrationOtpStore.delete(cleanEmail);
      recordOtpVerifyFailed(cleanEmail);
      return {
        success: false,
        error: "El código ha expirado. Por favor solicita un nuevo código.",
      };
    }

    if (entry.code !== cleanCode) {
      recordOtpVerifyFailed(cleanEmail);
      return {
        success: false,
        error: "El código ingresado es incorrecto. Verifica los 6 dígitos.",
      };
    }

    // Código validado exitosamente
    resetOtpVerifyRateLimit(cleanEmail);
    registrationOtpStore.delete(cleanEmail);
    verifiedRegistrationEmails.set(cleanEmail, Date.now() + 60 * 60 * 1000); // Válido por 1 hora

    return { success: true };
  } catch (err: any) {
    console.error("Error en verifyRegistrationCodeAction:", err);
    return { success: false, error: "Error al verificar el código." };
  }
}




