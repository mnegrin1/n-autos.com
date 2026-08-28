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
  const client = supabaseAdmin || supabase;
  let user: any = null;
  let error: any = null;

  try {
    const res = await (client.from("users") as any)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();
    user = res.data;
    error = res.error;
  } catch (err) {
    console.error("Error al consultar Supabase en login:", err);
    error = err;
  }

  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";
  const inputHash = await hashPassword(password.trim());
  const storedHash = getUserPasswordHash(cleanEmail) || user?.password_hash || demoPasswordStore.get(cleanEmail);

  if (!user) {
    // Si el usuario no existe en la base de datos de Supabase:
    // Verificar si existe una contraseña guardada previamente en almacenamiento persistente o memoria
    if (storedHash) {
      if (storedHash !== inputHash) {
        return { success: false, error: "Contraseña incorrecta." };
      }
      const namePart = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = namePart
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const userSlug = cleanEmail.replace(/[^a-z0-9]/g, "-");

      user = {
        id: "user-" + userSlug,
        email: cleanEmail,
        name: isSuperAdminEmail ? "Mauricio Negrin" : (formattedName || "Usuario Demo"),
        role: isSuperAdminEmail ? "superadmin" : "admin",
        agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : cleanEmail === "mauricionegrinmogni1@gmail.com" ? "7bdc2014-f7e0-44c3-a8b4-33152937bfa6" : "agency-" + userSlug,
      };
    } else {
      return { success: false, error: "Correo electrónico o contraseña incorrectos." };
    }
  } else {
    // Si el usuario existe en Supabase DB:
    if (storedHash) {
      if (storedHash !== inputHash) {
        return { success: false, error: "Contraseña incorrecta." };
      }
    } else {
      return {
        success: false,
        error: "La cuenta no posee una contraseña configurada. Por favor, utiliza la opción '¿Olvidaste tu contraseña?' para establecer tu contraseña.",
      };
    }

    if (isSuperAdminEmail) {
      user.role = "superadmin";
    }
  }

  if (!user) {
    return { success: false, error: "No se pudo obtener el usuario." };
  }

  // Generar sesión con token firmado criptográficamente
  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name || (isSuperAdminEmail ? "Mauricio Negrin" : "Usuario"),
    role: isSuperAdminEmail ? "superadmin" : (user.role || "admin"),
    agency_id: user.agency_id || (isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : cleanEmail === "mauricio@automotora.com" ? "00000000-0000-0000-0000-000000000000" : cleanEmail === "mauricionegrinmogni1@gmail.com" ? "7bdc2014-f7e0-44c3-a8b4-33152937bfa6" : `agency-${user.id}`),
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
 */
export async function requestPasswordReset(email: string) {
  if (!email || !email.trim() || !email.includes("@")) {
    return { success: false, error: "Ingresa un correo electrónico válido." };
  }

  const cleanEmail = email.toLowerCase().trim();

  // Generar código OTP aleatorio de 6 dígitos (ej: 849204)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = Date.now() + 15 * 60 * 1000; // Expira en 15 minutos
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  let userName = "Usuario";
  let supabaseSuccess = false;

  try {
    const client = supabaseAdmin || supabase;
    const { data: user } = await (client.from("users") as any)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (user) {
      userName = user.name || userName;
      const { error: updateErr } = await (client.from("users") as any)
        .update({
          reset_code: otpCode,
          reset_expires_at: expiresAtIso,
        })
        .eq("id", user.id);

      if (!updateErr) {
        supabaseSuccess = true;
      }
    }
  } catch (err) {
    console.warn("No se pudo actualizar reset_code en Supabase DB (usando fallback demo):", err);
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
    // Si Resend no está configurado (ej: ambiente local o dev sin API key), informamos de forma amigable y entregamos el código para pruebas locales
    console.log(`[DEMO AUTH OTP] Código de recuperación generado para ${cleanEmail}: ${otpCode}`);
    return {
      success: true,
      demoCode: otpCode,
      message: `Código enviado. (Modo pruebas: tu código es ${otpCode})`,
    };
  }
}

/**
 * Verifica el código OTP de 6 dígitos y establece una nueva contraseña.
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
  const newHash = await hashPassword(newPassword.trim());

  let verified = false;

  // 1. Intentar verificar en Supabase DB
  try {
    const client = supabaseAdmin || supabase;
    const { data: user } = await (client.from("users") as any)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (user && user.reset_code) {
      const isCodeValid = user.reset_code === cleanCode;
      const isNotExpired = user.reset_expires_at && new Date(user.reset_expires_at) > new Date();

      if (isCodeValid && isNotExpired) {
        await (client.from("users") as any)
          .update({
            password_hash: newHash,
            reset_code: null,
            reset_expires_at: null,
          })
          .eq("id", user.id);

        verified = true;
      }
    }
  } catch (err) {
    console.warn("Error al verificar en Supabase DB:", err);
  }

  // 2. Fallback verificar en demoResetStore si no fue verificado en DB
  if (!verified) {
    const demoData = demoResetStore.get(cleanEmail);
    if (demoData && demoData.code === cleanCode && demoData.expiresAt > Date.now()) {
      demoPasswordStore.set(cleanEmail, newHash);
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

  setUserPasswordHash(cleanEmail, newHash);

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
  const currentInputHash = await hashPassword(currentPassword.trim());
  const newHash = await hashPassword(newPassword.trim());
  const storedHash = getUserPasswordHash(cleanEmail);

  let updated = false;

  try {
    const client = supabaseAdmin || supabase;
    const { data: user } = await (client.from("users") as any)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (user) {
      if ((user.password_hash && user.password_hash !== currentInputHash) || (storedHash && storedHash !== currentInputHash)) {
        return { success: false, error: "La contraseña actual es incorrecta." };
      }

      const { error: updateErr } = await (client.from("users") as any)
        .update({ password_hash: newHash })
        .eq("id", user.id);

      if (!updateErr) {
        updated = true;
      }
    }
  } catch (err) {
    console.warn("Error al actualizar contraseña en Supabase DB:", err);
  }

  // Fallback / Guardar siempre en almacenamiento persistente
  if (!updated) {
    const storedDemoHash = storedHash || demoPasswordStore.get(cleanEmail);
    if (storedDemoHash && storedDemoHash !== currentInputHash) {
      return { success: false, error: "La contraseña actual es incorrecta." };
    }
    updated = true;
  }

  setUserPasswordHash(cleanEmail, newHash);

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
  const passwordHash = await hashPassword(password.trim());
  const isSuperAdminEmail = cleanEmail === "mauricio.negrin@n-sistemas.com";

  setUserPasswordHash(cleanEmail, passwordHash);

  try {
    const client = supabaseAdmin || supabase;
    if (client) {
      const { data: user } = await (client.from("users") as any)
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (user) {
        await (client.from("users") as any)
          .update({
            password_hash: passwordHash,
            reset_code: null,
            reset_expires_at: null,
            ...(isSuperAdminEmail ? { role: "superadmin" } : {})
          })
          .eq("id", user.id);

        if (supabaseAdmin) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
          } catch (e) {
            console.warn("No se pudo actualizar auth user directamente:", e);
          }
        }

        const sessionData = {
          id: user.id,
          email: user.email,
          name: isSuperAdminEmail ? "Mauricio Negrin" : (user.name || name || "Usuario"),
          role: isSuperAdminEmail ? "superadmin" : (user.role || "admin"),
          agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : (user.agency_id || agencyId || `agency-${user.id}`),
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
    }
  } catch (err) {
    console.error("Error activando cuenta en Supabase:", err);
  }

  // Fallback demo
  demoPasswordStore.set(cleanEmail, passwordHash);

  const fallbackUser = {
    id: `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
    email: cleanEmail,
    name: isSuperAdminEmail ? "Mauricio Negrin" : (name || "Usuario"),
    role: isSuperAdminEmail ? "superadmin" : "admin",
    agency_id: isSuperAdminEmail ? "00000000-0000-0000-0000-000000000000" : (agencyId || `agency-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`),
  };

  const token = await createSignedToken(fallbackUser);
  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, user: fallbackUser };
}

/**
 * Genera un código de activación y envía un correo electrónico de invitación
 * para que el superadmin (mauricio.negrin@n-sistemas.com) configure su contraseña.
 */
export async function sendSuperAdminPasswordInviteEmailAction(targetEmail: string = "mauricio.negrin@n-sistemas.com") {
  const cleanEmail = targetEmail.toLowerCase().trim();
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;

  // Registrar en Supabase si el cliente está disponible
  try {
    const client = supabaseAdmin || supabase;
    if (client) {
      const { data: existingUser } = await (client.from("users") as any)
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingUser) {
        await (client.from("users") as any)
          .update({
            role: "superadmin",
            reset_code: activationCode,
            reset_expires_at: new Date(expiresAtMs).toISOString(),
          })
          .eq("id", existingUser.id);
      } else {
        await (client.from("users") as any)
          .insert([{
            id: `user-superadmin-${Date.now()}`,
            email: cleanEmail,
            name: "Mauricio Negrin",
            role: "superadmin",
            agency_id: "00000000-0000-0000-0000-000000000000",
            reset_code: activationCode,
            reset_expires_at: new Date(expiresAtMs).toISOString(),
          }]);
      }
    }
  } catch (err) {
    console.warn("Aviso: No se pudo guardar el usuario superadmin en Supabase DB:", err);
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


