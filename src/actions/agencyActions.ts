"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function getAgencyBySlug(slug: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("subdomain", slug)
      .maybeSingle();
    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.error("Error connecting to Supabase for agency:", e);
  }
  return null;
}

export async function updateAgencySettings(
  agencyId: string,
  updates: { name?: string; primary_color?: string; subdomain?: string; logo_url?: string; whatsapp?: string; cover_url?: string; publish_sold?: boolean }
) {
  try {
    const { data, error } = await (supabase.from("agencies") as any)
      .update(updates as any)
      .eq("id", agencyId)
      .select()
      .single();
    if (!error && data) {
      revalidatePath("/realstate/admin/settings");
      revalidatePath(`/realstate/portal/[agency]`, 'layout');
      return { success: true, data };
    }
    return { success: false, error: error?.message || "Inmobiliaria no encontrada" };
  } catch (e) {
    console.error("Error updating settings in Supabase:", e);
    return { success: false, error: "Internal server error" };
  }
}
