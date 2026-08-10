"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

export async function createAgencyAndAdmin(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const subdomain = formData.get("subdomain") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const plan = (formData.get("plan") as string) || "Free";

    if (!name || !subdomain || !email || !password) {
      return { success: false, error: "Todos los campos son requeridos." };
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

    // 3. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      await supabaseAdmin.from("agencies").delete().eq("id", agencyId);
      return { success: false, error: `Error creando usuario (Auth): ${authError?.message}` };
    }

    const authUserId = authData.user.id;

    // 4. Link user in public.users
    const { error: publicUserError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authUserId,
        agency_id: agencyId,
        name: "Admin",
        email,
        role: "admin",
      });

    if (publicUserError) {
      return { success: false, error: `Error vinculando usuario: ${publicUserError?.message}` };
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");
    revalidatePath("/superadmin");

    return { success: true, message: "Organización y usuario creados exitosamente.", agencyId };
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
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "agent";

    if (!agencyId || !name || !email || !password) {
      return { success: false, error: "Todos los campos obligatorios deben ser completados." };
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return { success: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return { success: false, error: `Error en Autenticación: ${authError?.message}` };
    }

    // 2. Link in public.users
    const { error: publicUserError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        agency_id: agencyId,
        name,
        email,
        role,
      });

    if (publicUserError) {
      return { success: false, error: `Error al crear usuario en base de datos: ${publicUserError?.message}` };
    }

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");

    return { success: true, message: "Usuario agregado exitosamente a la organización." };
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
    await supabaseAdmin.auth.admin.deleteUser(userId);

    revalidatePath("/superadmin/agencies");
    revalidatePath("/superadmin/users");

    return { success: true, message: "Usuario eliminado exitosamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar usuario." };
  }
}
