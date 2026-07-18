import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data } = await (supabase.from("auto_integrations") as any)
      .select("*")
      .eq("agency_id", "00000000-0000-0000-0000-000000000000")
      .eq("channel", "mercadolibre");

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No integration" });
    }

    const ml = data[0];
    const token = ml.token;

    const userRes = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const userData = await userRes.json();

    const searchRes = await fetch(`https://api.mercadolibre.com/users/${userData.id}/items/search`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const searchData = await searchRes.json();

    // try to get all statuses
    const searchAllRes = await fetch(`https://api.mercadolibre.com/users/${userData.id}/items/search?status=active,paused,closed,under_review`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const searchAllData = await searchAllRes.json();

    return NextResponse.json({ 
      user: userData.id, 
      user_nickname: userData.nickname,
      search: searchData,
      searchAll: searchAllData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
