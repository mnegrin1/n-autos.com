"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { sendAccountInvitationEmail } from "@/actions/emailActions";
import { registerUserSession } from "@/actions/authActions";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function createAgencyAndAdmin(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const subdomain = formData.get("subdomain") as string;
    const email = formData.get("email") as string;
    const plan = (formData.get("plan") as string) || "Free";

    if (!name || !subdomain || !email) {
      return { success: false, error: "El nombre, subdominio y correo electrónico son requeridos." };
    }

    const supabaseAdmin = getAdminClient();

    if (!supabaseAdmin) {
      return { 
        success: false, 
        error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Imposible crear agencias de forma segura." 
      };
    }

    // 1. Check if subdomain exists
    const { data: existingAgency } = await supabaseAdmin
      .from("agencies")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existingAgency) {
      return { success: false, error: "El subdominio ya está en uso." };
    }

    // 2. Create the Agency
    const { data: newAgency, error: agencyError } = await supabaseAdmin
      .from("agencies")
      .insert({
        name,
        subdomain,
        primary_color: "#2563eb",
        secondary_color: "#1e3a8a",
      })
      .select("id")
      .single();

    if (agencyError || !newAgency) {
      return { success: false, error: `Error creando organización: ${agencyError?.message}` };
    }

    const agencyId = newAgency.id;

    // Generar contraseña temporal segura e interna + código de activación OTP
    const tempPassword = `P@ss-${Math.random().toString(36).substring(2)}${Date.now()}`;
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 3. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      await supabaseAdmin.from("agencies").delete().eq("id", agencyId);
      return { success: false, error: `Error creando usuario (Auth): ${authError?.message}` };
    }

    const authUserId = authData.user.id;

    // 4. Link user in public.users
    let { error: publicUserError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUserId,
        agency_id: agencyId,
        name: "Admin",
        email,
        role: "admin",
        reset_code: activationCode,
        reset_expires_at: expiresAtIso,
      });

    if (publicUserError && (publicUserError.message?.includes("reset_code") || publicUserError.message?.includes("schema cache"))) {
      const retry = await supabaseAdmin
        .from("users")
        .insert({
          id: authUserId,
          agency_id: agencyId,
          name: "Admin",
          email,
          role: "admin",
        });
      publicUserError = retry.error;
    }

    if (publicUserError) {
      return { success: false, error: `Error vinculando usuario: ${publicUserError?.message}` };
    }

    // 5. Generar enlace directo de invitación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://superadmin.n-autos.com";
    const inviteUrl = `${appUrl}/admin/accept-invite?email=${encodeURIComponent(email)}&code=${activationCode}&agency=${encodeURIComponent(name)}&agencyId=${agencyId}&name=Admin`;

    // Enviar correo de invitación
    const emailRes = await sendAccountInvitationEmail(email, activationCode, "Admin", name, inviteUrl);

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");
    revalidatePath("/superadmin");

    return { 
      success: true, 
      message: `Organización creada exitosamente.`, 
      agencyId,
      userId: authUserId,
      activationCode,
      inviteUrl,
      emailSent: emailRes?.success || false,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al procesar la solicitud." };
  }
}

export async function fetchAgencies() {
  try {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, data: [] };
    }

    const { data: agencies, error } = await supabaseAdmin
      .from("agencies")
      .select("*, users(id)")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: agencies || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function fetchAgencyUsers(agencyId: string) {
  try {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, data: [] };
    }

    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: users || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function addUserToAgency(formData: FormData) {
  try {
    const agencyId = formData.get("agency_id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = (formData.get("role") as string) || "agent";

    if (!agencyId || !name || !email) {
      return { success: false, error: "El nombre y correo electrónico son obligatorios." };
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
    }

    // Generar contraseña temporal segura e interna + código de activación OTP
    const tempPassword = `P@ss-${Math.random().toString(36).substring(2)}${Date.now()}`;
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return { success: false, error: `Error en Autenticación: ${authError?.message}` };
    }

    // Obtener nombre de la agencia para personalizar el correo
    let agencyName = "Tu Automotora";
    const { data: agencyData } = await supabaseAdmin
      .from("agencies")
      .select("name")
      .eq("id", agencyId)
      .maybeSingle();
    if (agencyData?.name) {
      agencyName = agencyData.name;
    }

    // 2. Link in public.users
    let { error: publicUserError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        agency_id: agencyId,
        name,
        email,
        role,
        reset_code: activationCode,
        reset_expires_at: expiresAtIso,
      });

    if (publicUserError && (publicUserError.message?.includes("reset_code") || publicUserError.message?.includes("schema cache"))) {
      const retry = await supabaseAdmin
        .from("users")
        .insert({
          id: authData.user.id,
          agency_id: agencyId,
          name,
          email,
          role,
        });
      publicUserError = retry.error;
    }

    if (publicUserError) {
      return { success: false, error: `Error al crear usuario en base de datos: ${publicUserError?.message}` };
    }

    // 3. Generar enlace directo de invitación y enviar correo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://superadmin.n-autos.com";
    const inviteUrl = `${appUrl}/admin/accept-invite?email=${encodeURIComponent(email)}&code=${activationCode}&agency=${encodeURIComponent(agencyName)}&agencyId=${agencyId}&name=${encodeURIComponent(name)}`;

    const emailRes = await sendAccountInvitationEmail(email, activationCode, name, agencyName, inviteUrl);

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");

    return { 
      success: true, 
      message: `Usuario agregado exitosamente.`,
      userId: authData.user.id,
      activationCode,
      inviteUrl,
      emailSent: emailRes?.success || false,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al agregar usuario." };
  }
}

export async function updateUserInAgency(formData: FormData) {
  try {
    const userId = formData.get("user_id") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("password") as string;

    if (!userId || !name || !role) {
      return { success: false, error: "Faltan datos requeridos." };
    }

    if (!isValidUUID(userId)) {
      return { success: true, message: "Usuario actualizado." };
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
    }

    // 1. Update public.users
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ name, role })
      .eq("id", userId);

    if (updateError) {
      return { success: false, error: `Error al actualizar: ${updateError.message}` };
    }

    // 2. Update password if provided
    if (newPassword && newPassword.trim().length > 0) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (passError) {
        return { success: false, error: `Error al cambiar contraseña: ${passError.message}` };
      }
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");

    return { success: true, message: "Usuario actualizado exitosamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar usuario." };
  }
}

export async function deleteUserFromAgency(userId: string) {
  try {
    if (!userId) return { success: false, error: "ID de usuario inválido." };

    if (!isValidUUID(userId)) {
      return { success: true, message: "Usuario eliminado." };
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
    }

    // Delete from public.users
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return { success: false, error: `Error al eliminar de base de datos: ${dbError.message}` };
    }

    // Delete from auth.users
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.warn("No se pudo eliminar auth user de Supabase:", e);
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");

    return { success: true, message: "Usuario eliminado exitosamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar usuario." };
  }
}

export async function updateAgency(formData: FormData) {
  try {
    const agencyId = formData.get("agency_id") as string;
    const name = formData.get("name") as string;
    const subdomain = formData.get("subdomain") as string;

    if (!agencyId || !name || !subdomain) {
      return { success: false, error: "El ID, nombre y subdominio de la organización son requeridos." };
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
    }

    // Verificar si el subdominio está libre en otra agencia
    const { data: existing } = await supabaseAdmin
      .from("agencies")
      .select("id")
      .eq("subdomain", subdomain)
      .neq("id", agencyId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "El subdominio especificado ya está siendo utilizado por otra organización." };
    }

    const { error } = await supabaseAdmin
      .from("agencies")
      .update({ name, subdomain })
      .eq("id", agencyId);

    if (error) {
      return { success: false, error: `Error al actualizar la organización: ${error.message}` };
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin");

    return { success: true, message: "Organización actualizada exitosamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar la organización." };
  }
}

export async function deleteAgency(agencyId: string) {
  try {
    if (!agencyId) {
      return { success: false, error: "ID de organización no proporcionado." };
    }

    const supabaseAdmin = getAdminClient();
    if (supabaseAdmin && isValidUUID(agencyId)) {
      // 1. Eliminar usuarios vinculados en public.users
      await supabaseAdmin.from("users").delete().eq("agency_id", agencyId);
      // 2. Eliminar la organización
      const { error } = await supabaseAdmin.from("agencies").delete().eq("id", agencyId);
      if (error) {
        return { success: false, error: `Error al eliminar en base de datos: ${error.message}` };
      }
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");
    revalidatePath("/superadmin");

    return { success: true, message: "Organización eliminada correctamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar organización." };
  }
}

export async function switchTenantSessionAction(agencyId: string, subdomain: string, agencyName: string) {
  try {
    const sessionRes = await registerUserSession({
      id: `user-superadmin-${agencyId}`,
      email: `admin@${subdomain}.n-autos.com`,
      name: `Superadmin (${agencyName})`,
      role: "admin",
      agency_id: agencyId,
    });

    if (sessionRes.success) {
      return { success: true, redirectUrl: "/admin" };
    } else {
      return { success: false, error: sessionRes.error || "No se pudo establecer la sesión del inquilino." };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Error al cambiar de organización." };
  }
}


