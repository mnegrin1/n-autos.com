"use server";

import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const isSupabaseActive = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && !url.includes("mock-project") && key && !key.includes("mock-anon-key"));
};

export async function getAgencyBySlug(slug: string) {
  if (isSupabaseActive()) {
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
  }
  const db = getDb();
  return db.agencies.find((a) => a.subdomain === slug) || null;
}

export async function updateAgencySettings(
  agencyId: string,
  updates: { name?: string; primary_color?: string; subdomain?: string; logo_url?: string; whatsapp?: string; cover_url?: string; publish_sold?: boolean }
) {
  if (isSupabaseActive()) {
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
    } catch (e) {
      console.error("Error updating settings in Supabase:", e);
    }
  }

  const db = getDb();
  const agencyIndex = db.agencies.findIndex((a) => a.id === agencyId);
  
  if (agencyIndex === -1) {
    return { success: false, error: "Inmobiliaria no encontrada" };
  }

  db.agencies[agencyIndex] = {
    ...db.agencies[agencyIndex],
    ...updates,
  };
  saveDb(db);

  revalidatePath("/realstate/admin/settings");
  revalidatePath(`/realstate/portal/[agency]`, 'layout');
  
  return { success: true, data: db.agencies[agencyIndex] };
}


