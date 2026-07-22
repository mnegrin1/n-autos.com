"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function createAgencyAndUser(
  agencyName: string,
  userName: string,
  userEmail: string,
  subdomain: string
) {
  try {
    // 1. Create the agency
    const { data: agency, error: agencyError } = await (supabase
      .from("agencies") as any)
      .insert([
        {
          name: agencyName,
          subdomain: subdomain,
          primary_color: "#10b981", // default color
        },
      ])
      .select()
      .single();

    if (agencyError || !agency) {
      console.error("Error creating agency:", agencyError);
      return { success: false, error: agencyError?.message || "Error al crear la organización" };
    }

    // 2. Create the user
    const { data: user, error: userError } = await (supabase
      .from("users") as any)
      .insert([
        {
          agency_id: agency.id,
          name: userName,
          email: userEmail,
          role: "admin",
        },
      ])
      .select()
      .single();

    if (userError || !user) {
      console.error("Error creating user:", userError);
      return { success: false, error: userError?.message || "Error al crear el usuario principal" };
    }

    return { success: true, agency, user };
  } catch (e) {
    console.error("Exception in createAgencyAndUser:", e);
    return { success: false, error: "Internal server error" };
  }
}

export async function getUsersByAgency(agencyId: string) {
  try {
    const { data, error } = await (supabase
      .from("users") as any)
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true });
      
    if (!error && data) {
      return data;
    }
    return [];
  } catch (e) {
    console.error("Error connecting to Supabase for users:", e);
    return [];
  }
}

export async function createUser(agencyId: string, name: string, email: string, role: string = "agent") {
  try {
    const { data, error } = await (supabase
      .from("users") as any)
      .insert([{ agency_id: agencyId, name, email, role }])
      .select()
      .single();

    if (!error && data) {
      revalidatePath("/admin/settings");
      return { success: true, data };
    }
    return { success: false, error: error?.message || "Error al crear usuario" };
  } catch (e) {
    console.error("Error creating user:", e);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteUser(userId: string) {
  try {
    const { error } = await (supabase
      .from("users") as any)
      .delete()
      .eq("id", userId);

    if (!error) {
      revalidatePath("/admin/settings");
      return { success: true };
    }
    return { success: false, error: error.message };
  } catch (e) {
    console.error("Error deleting user:", e);
    return { success: false, error: "Internal server error" };
  }
}
