"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { sendAccountInvitationEmail } from "@/actions/emailActions";
import { registerUserSession } from "@/actions/authActions";
import { deletePersistentAgencySettings, getPersistentAgencySettings } from "@/lib/persistentAgencyStore";
import { clearServerAgencyCache } from "@/actions/agencyActions";


function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://joadvlatdeyamtspvruu.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    const cleanSubdomain = (formData.get("subdomain") as string)?.toLowerCase().trim();
    const adminName = (formData.get("admin_name") as string)?.trim() || "Administrador";
    const email = formData.get("email") as string;
    const plan = (formData.get("plan") as string) || "Free";

    if (!name || !cleanSubdomain || !email) {
      return { success: false, error: "El nombre, subdominio y correo electrónico son requeridos." };
    }


    const supabaseAdmin = getAdminClient();

    if (!supabaseAdmin) {
      return { 
        success: false, 
        error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Imposible crear agencias de forma segura." 
      };
    }

    // 1. Verificar si el subdominio existe en Supabase DB
    const { data: existingAgency } = await supabaseAdmin
      .from("agencies")
      .select("id")
      .eq("subdomain", cleanSubdomain)
      .maybeSingle();

    if (existingAgency) {
      // Verificar si la agencia existente tiene usuarios activos
      const { data: activeUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("agency_id", existingAgency.id);

      if (!activeUsers || activeUsers.length === 0) {
        // Registro huérfano sin usuarios: Purgar la agencia residual
        await deleteAgency(existingAgency.id);
        await deleteAgency(cleanSubdomain);
      } else {
        return { success: false, error: "El subdominio ya está en uso por otra organización activa." };
      }
    }

    // 2. Crear la Organización
    const { data: newAgency, error: agencyError } = await supabaseAdmin
      .from("agencies")
      .insert({
        name,
        subdomain: cleanSubdomain,
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

    const cleanEmail = email.toLowerCase().trim();
    let authUserId: string | null = null;

    // 3. Crear usuario en Auth (con purga de usuarios previos huérfanos)
    let authRes = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (authRes.data?.user?.id) {
      authUserId = authRes.data.user.id;
    } else if (
      authRes.error && 
      (authRes.error.message?.toLowerCase().includes("already") || 
       authRes.error.message?.toLowerCase().includes("registrado") || 
       authRes.error.message?.toLowerCase().includes("exists"))
    ) {
      // Intentar listar paginado hasta 1000 usuarios para encontrar y purgar/actualizar la cuenta huérfana
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingAuthUser = listData?.users?.find(
          (u) => u.email?.toLowerCase().trim() === cleanEmail
        );

        if (existingAuthUser?.id) {
          authUserId = existingAuthUser.id;
          // Purga previa en public.users por si existía un registro viejo con otro ID
          try {
            await supabaseAdmin.from("users").delete().ilike("email", cleanEmail);
          } catch (e) {}

          // Actualizar contraseña y metadata en Supabase Auth
          await supabaseAdmin.auth.admin.updateUserById(authUserId, {
            password: tempPassword,
            email_confirm: true,
          });
        } else {
          // Si no se encontró en la lista, forzar eliminación por mail si fuera necesario y reintentar
          authRes = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: tempPassword,
            email_confirm: true,
          });
          if (authRes.data?.user?.id) {
            authUserId = authRes.data.user.id;
          }
        }
      } catch (e) {
        console.warn("Error al resolver usuario previo en Auth:", e);
      }
    }

    if (!authUserId) {
      await supabaseAdmin.from("agencies").delete().eq("id", agencyId);
      return { 
        success: false, 
        error: `Error creando usuario (Auth): ${authRes.error?.message || "No se pudo vincular la cuenta."}` 
      };
    }


    // 4. Vincular o actualizar en public.users
    const { data: existingPublicUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingPublicUser) {
      await supabaseAdmin
        .from("users")
        .update({
          agency_id: agencyId,
          name: adminName,
          role: "admin",
          reset_code: activationCode,
          reset_expires_at: expiresAtIso,
        })
        .eq("id", existingPublicUser.id);
    } else {
      let { error: publicUserError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authUserId,
          agency_id: agencyId,
          name: adminName,
          email,
          role: "admin",
          reset_code: activationCode,
          reset_expires_at: expiresAtIso,
        });

      if (publicUserError) {
        // Retry sin reset_code por si hay desincronización de esquema
        await supabaseAdmin
          .from("users")
          .upsert({
            id: authUserId,
            agency_id: agencyId,
            name: adminName,
            email,
            role: "admin",
          });
      }
    }

    // 5. Generar enlace directo de invitación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://superadmin.n-autos.com";
    const inviteUrl = `${appUrl}/admin/accept-invite?email=${encodeURIComponent(email)}&code=${activationCode}&agency=${encodeURIComponent(name)}&agencyId=${agencyId}&name=${encodeURIComponent(adminName)}`;

    // Enviar correo de invitación
    const emailRes = await sendAccountInvitationEmail(email, activationCode, adminName, name, inviteUrl);


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
    let dbAgencies: any[] = [];

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("agencies")
        .select("*, users(id)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        dbAgencies = data;
      }
    }

    // Combinar con almacenamiento persistente en disco (.agency_settings.json)
    const map = new Map<string, any>();
    dbAgencies.forEach((a) => {
      map.set(a.id, a);
      if (a.subdomain) map.set(a.subdomain.toLowerCase(), a);
    });

    const persistentStore = getPersistentAgencySettings() as any;
    if (persistentStore && persistentStore.agencies) {
      Object.entries(persistentStore.agencies).forEach(([key, settings]: [string, any]) => {
        if (settings && (settings.subdomain || settings.agencyId)) {
          const agencyId = settings.agencyId || key;
          const sub = settings.subdomain || key;
          if (!map.has(agencyId) && !map.has(sub.toLowerCase())) {
            map.set(agencyId, {
              id: agencyId,
              name: settings.agencyName || settings.name || key,
              subdomain: sub,
              created_at: new Date().toISOString(),
              users: []
            });
          }
        }
      });
    }

    return { success: true, data: Array.from(map.values()) };
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

    // Obtener correo del usuario antes de eliminar
    let targetEmail: string | null = null;
    try {
      const { data: userRec } = await supabaseAdmin.from("users").select("email").eq("id", userId).maybeSingle();
      if (userRec?.email) targetEmail = userRec.email;
    } catch {}

    // Unset / nullify foreign key references to this user if any
    try {
      await supabaseAdmin.from("events").update({ agent_id: null }).eq("agent_id", userId);
    } catch {}
    try {
      await supabaseAdmin.from("auto_leads").update({ assigned_agent_id: null }).eq("assigned_agent_id", userId);
    } catch {}

    // Delete from public.users
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return { success: false, error: `Error al eliminar de base de datos: ${dbError.message}` };
    }

    // Delete from auth.users (por ID y por email)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.warn("No se pudo eliminar auth user de Supabase por ID:", e);
    }

    if (targetEmail) {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = listData?.users?.find((u) => u.email?.toLowerCase().trim() === targetEmail!.toLowerCase().trim());
        if (authUser?.id) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        }
      } catch (e) {}
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

export async function deleteAgency(agencyIdOrSubdomain: string) {
  try {
    if (!agencyIdOrSubdomain) {
      return { success: false, error: "ID de organización no proporcionado." };
    }

    const key = agencyIdOrSubdomain.trim();
    const supabaseAdmin = getAdminClient();

    if (supabaseAdmin) {
      // 1. Buscar la agencia en Supabase por ID o por subdominio
      let agencyRecord: any = null;

      if (isValidUUID(key)) {
        const { data } = await supabaseAdmin.from("agencies").select("*").eq("id", key).maybeSingle();
        agencyRecord = data;
      }

      if (!agencyRecord) {
        const { data } = await supabaseAdmin.from("agencies").select("*").eq("subdomain", key.toLowerCase()).maybeSingle();
        agencyRecord = data;
      }

      // Buscar también por carmax o demo si la clave coincide
      if (!agencyRecord && (key.toLowerCase() === "carmax" || key === "tenant-carmax-001")) {
        const { data } = await supabaseAdmin.from("agencies").select("*").eq("subdomain", "carmax").maybeSingle();
        agencyRecord = data;
      }

      const realAgencyId = agencyRecord?.id || (isValidUUID(key) ? key : null);
      const agencySubdomain = agencyRecord?.subdomain || key.toLowerCase();

      // 2. Si encontramos un ID o subdominio en Supabase, borrar usuarios asociados de Auth y tablas secundarias
      if (realAgencyId) {
        const { data: agencyUsers } = await supabaseAdmin.from("users").select("id").eq("agency_id", realAgencyId);
        if (agencyUsers && agencyUsers.length > 0) {
          for (const u of agencyUsers) {
            try {
              await supabaseAdmin.auth.admin.deleteUser(u.id);
            } catch (e) {
              console.warn(`No se pudo eliminar usuario de auth ${u.id}:`, e);
            }
          }
        }

        const tablesToDelete = [
          "auto_vehicle_publications",
          "auto_publication_automations",
          "inbox_conversations",
          "auto_leads",
          "vehicles",
          "auto_integrations",
          "rentals",
          "tickets",
          "developments",
          "lots",
          "notifications",
          "payments",
          "events",
          "offers",
          "properties",
          "leads",
          "subdomain_history",
          "users"
        ];

        for (const table of tablesToDelete) {
          try {
            await supabaseAdmin.from(table).delete().eq("agency_id", realAgencyId);
          } catch (e) {}
        }

        await supabaseAdmin.from("agencies").delete().eq("id", realAgencyId);
      }

      if (agencySubdomain) {
        try {
          await supabaseAdmin.from("agencies").delete().eq("subdomain", agencySubdomain);
        } catch (e) {}
      }
    }

    // 3. Limpieza profunda en disco (.agency_settings.json)
    deletePersistentAgencySettings(key);
    deletePersistentAgencySettings(key.toLowerCase());
    if (key.toLowerCase() === "carmax" || key === "tenant-carmax-001") {
      deletePersistentAgencySettings("carmax");
      deletePersistentAgencySettings("tenant-carmax-001");
      deletePersistentAgencySettings("00000000-0000-0000-0000-000000000000");
    }

    // 4. Limpieza en memoria del servidor
    await clearServerAgencyCache(key);
    await clearServerAgencyCache(key.toLowerCase());
    if (key.toLowerCase() === "carmax" || key === "tenant-carmax-001") {
      await clearServerAgencyCache("carmax");
      await clearServerAgencyCache("tenant-carmax-001");
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
    const supabaseAdmin = getAdminClient();
    let targetEmail = `admin@${subdomain}.n-autos.com`;
    let targetName = `Superadmin (${agencyName})`;

    if (supabaseAdmin) {
      const { data: adminUser } = await supabaseAdmin
        .from("users")
        .select("email, name")
        .eq("agency_id", agencyId)
        .limit(1)
        .maybeSingle();

      if (adminUser?.email) {
        targetEmail = adminUser.email;
        targetName = adminUser.name || targetName;
      }
    }

    const sessionRes = await registerUserSession({
      id: `user-superadmin-${agencyId}`,
      email: targetEmail,
      name: targetName,
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



