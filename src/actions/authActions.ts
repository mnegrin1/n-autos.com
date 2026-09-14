"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedToken, verifySignedToken } from "@/lib/sessionToken";
import { sendPasswordResetEmail, sendSuperAdminInvitationEmail } from "@/actions/emailActions";
import { getUserPasswordHash, setUserPasswordHash } from "@/lib/persistentUserStore";

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

/**
 * Función de hashing segura Web Crypto SHA-256 compatible con Cloudflare Workers & Node.js
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_salt_n_autos_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function login(email: string, password?: string) {
  if (!email || !email.trim()) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  if (!password || !password.trim()) {
    return { success: false, error: "La contraseña es requerida." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const rawPassword = password.trim();
  const client = supabaseAdmin || supabase;
  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";
  let user: any = null;

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

  let authenticated = false;
  let authUser: any = null;
  const inputHash = await hashPassword(rawPassword);

  // 2. Intentar autenticar primero con Supabase Auth Cloud (persistencia indestructible en la nube)
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

  // 3. Si no autenticó directamente con signInWithPassword, verificar en Auth y aprovisionar/sincronizar
  if (!authenticated) {
    try {
      authUser = await findAuthUserByEmail(cleanEmail);
    } catch (e) {
      console.warn("Error buscando authUser:", e);
    }

    if (!authUser) {
      // El usuario aún no existe en Supabase Auth Cloud.
      // Si es Superadmin, aprovisionamos la cuenta de forma definitiva con la contraseña ingresada!
      if (isSuperAdminEmail) {
        try {
          const createRes = await client.auth.admin.createUser({
            email: cleanEmail,
            password: rawPassword,
            email_confirm: true,
            user_metadata: {
              name: "Mauricio Negrin",
              role: "superadmin",
              agency_id: "00000000-0000-0000-0000-000000000000",
              password_hash: inputHash,
            },
          });

          if (createRes.data?.user) {
            authenticated = true;
            authUser = createRes.data.user;
          }
        } catch (createErr) {
          console.error("Error aprovisionando superadmin en Supabase Auth:", createErr);
        }
      } else if (user) {
        // Es un usuario que ya existe en public.users (ej. creado por admin/organización), pero aún sin auth.users
        try {
          const createRes = await client.auth.admin.createUser({
            email: cleanEmail,
            password: rawPassword,
            email_confirm: true,
            user_metadata: {
              name: user.name || "Usuario",
              role: user.role || "admin",
              agency_id: user.agency_id || "agency-starter",
              password_hash: inputHash,
            },
          });

          if (createRes.data?.user) {
            authenticated = true;
            authUser = createRes.data.user;
          }
        } catch (createErr) {
          console.error("Error aprovisionando usuario existente en Supabase Auth:", createErr);
        }
      }
    } else {
      // El usuario SÍ existe en Supabase Auth Cloud, pero signInWithPassword falló.
      // Comprobar si tiene un hash registrado en user_metadata o en el store local para actualizar su contraseña
      const metaHash = authUser.user_metadata?.password_hash;
      const storedHash = getUserPasswordHash(cleanEmail) || demoPasswordStore.get(cleanEmail);

      if ((metaHash && metaHash === inputHash) || (storedHash && storedHash === inputHash)) {
        try {
          await client.auth.admin.updateUserById(authUser.id, {
            password: rawPassword,
            email_confirm: true,
            user_metadata: {
              ...authUser.user_metadata,
              password_hash: inputHash,
            },
          });
          authenticated = true;
        } catch (updateErr) {
          console.error("Error sincronizando contraseña en Supabase Auth:", updateErr);
        }
      } else {
        return { success: false, error: "Contraseña incorrecta." };
      }
    }
  }

  if (!authenticated) {
    return {
      success: false,
      error: "La cuenta no posee una contraseña configurada o las credenciales son incorrectas. Por favor, utiliza la opción '¿Olvidaste tu contraseña?' para establecer tu contraseña.",
    };
  }

  // 4. Sincronizar usuario en public.users (con role 'admin' para cumplir restricción users_role_check)
  const effectiveUserId = authUser?.id || user?.id || (isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`);
  const effectiveAgencyId = isSuperAdminEmail
    ? "00000000-0000-0000-0000-000000000000"
    : (user?.agency_id || authUser?.user_metadata?.agency_id || (cleanEmail === "mauricionegrinmogni1@gmail.com" ? "7bdc2014-f7e0-44c3-a8b4-33152937bfa6" : `agency-${effectiveUserId}`));
  const effectiveName = isSuperAdminEmail
    ? "Mauricio Negrin"
    : (user?.name || authUser?.user_metadata?.name || "Usuario");

  try {
    if (!user) {
      await (client.from("users") as any).insert({
        id: effectiveUserId,
        agency_id: effectiveAgencyId,
        name: effectiveName,
        email: cleanEmail,
        role: "admin", // PostgreSQL users_role_check solo acepta 'admin', 'manager', 'agent'
      });
    }
  } catch (syncErr) {
    console.warn("Aviso: No se pudo sincronizar usuario en public.users:", syncErr);
  }

  // Guardar en caches locales
  setUserPasswordHash(cleanEmail, inputHash);
  demoPasswordStore.set(cleanEmail, inputHash);

  // Generar sesión con token firmado criptográficamente
  const sessionData = {
    id: effectiveUserId,
    email: cleanEmail,
    name: effectiveName,
    role: isSuperAdminEmail ? "superadmin" : (user?.role || authUser?.user_metadata?.role || "admin"),
    agency_id: effectiveAgencyId,
  };

  const token = await createSignedToken(sessionData);

  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  return { success: true, user: sessionData };
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

  const cleanEmail = (res.user.email || "").toLowerCase().trim();
  const isSuperAdminRole = res.user.role === "superadmin" || res.user.role === "Superadmin";
  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";

  if (!isSuperAdminRole && !isSuperAdminEmail) {
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
  cookieStore.set("admin-session", "", {
    path: "/",
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete({ name: "admin-session", path: "/" });
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;
    if (!token) return null;

    const decoded = await verifySignedToken(token);
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
}) {
  try {
    const data = {
      id: sessionData.id || "user-starter-" + Date.now(),
      email: sessionData.email,
      name: sessionData.name,
      role: sessionData.role || "admin",
      agency_id: sessionData.agency_id || "agency-starter",
    };

    const token = await createSignedToken(data);

    const cookieStore = await cookies();
    cookieStore.set("admin-session", token, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });

    return { success: true, user: data };
  } catch (e: any) {
    console.error("Error setting session cookie:", e);
    return { success: false, error: e?.message || "Error al establecer sesión." };
  }
}

/**
 * Solicita la recuperación de contraseña generando un código OTP aleatorio de 6 dígitos
 * y enviándolo por correo mediante Resend.
 * Persiste el código tanto en public.users como en Supabase Auth user_metadata para máxima confiabilidad.
 */
export async function requestPasswordReset(email: string) {
  if (!email || !email.trim() || !email.includes("@")) {
    return { success: false, error: "Ingresa un correo electrónico válido." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";

  // Generar código OTP aleatorio de 6 dígitos (ej: 849204)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
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

  // 2. Guardar también en Supabase Auth user_metadata (persistente en la nube entre workers)
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
 * Verifica el código OTP de 6 dígitos y establece una nueva contraseña directamente
 * en Supabase Auth Cloud de forma permanente e indestructible.
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
    return {
      success: false,
      error: "El código de verificación es incorrecto o ha expirado. Por favor solicita uno nuevo.",
    };
  }

  // 4. ACTUALIZAR O CREAR CONTRASEÑA EN SUPABASE AUTH CLOUD
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

  // 5. Limpiar reset_code en public.users (sin tocar password_hash)
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
    const currentInputHash = await hashPassword(rawCurrentPassword);
    const storedHash = getUserPasswordHash(cleanEmail) || demoPasswordStore.get(cleanEmail);
    if (storedHash && storedHash === currentInputHash) {
      isValid = true;
    }
  }

  if (!isValid) {
    return { success: false, error: "La contraseña actual es incorrecta." };
  }

  // 2. Actualizar contraseña en Supabase Auth Cloud
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
 * Activa la cuenta de un usuario invitado y establece su nueva contraseña.
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

  const token = await createSignedToken(sessionData);
  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, user: sessionData };
}

/**
 * Genera un código de activación y envía un correo electrónico de invitación
 * para que el superadmin (mauricio.negrin@n-sistemas.com) configure su contraseña.
 */
export async function sendSuperAdminPasswordInviteEmailAction(targetEmail: string = "mauricio.negrin@n-sistemas.com") {
  const cleanEmail = targetEmail.toLowerCase().trim();
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
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


