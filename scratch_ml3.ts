import 'dotenv/config'; // will load .env
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('auto_integrations').select('*').eq('channel', 'mercadolibre').eq('agency_id', 'demo-agency-id');
  if (error) console.log("DB Error:", error);
  const ml = data?.[0];
  if (!ml) return console.log("No ML integration found");
  
  const token = ml.token;
  console.log("Got token");

  const userRes = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const userData = await userRes.json();
  console.log("User Data ID:", userData.id);

  const searchRes = await fetch(`https://api.mercadolibre.com/users/${userData.id}/items/search`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  console.log("Search items/search response:", JSON.stringify(searchData, null, 2));

  // try with status=active
  const searchRes2 = await fetch(`https://api.mercadolibre.com/users/${userData.id}/items/search?status=active`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const searchData2 = await searchRes2.json();
  console.log("Search with status=active:", JSON.stringify(searchData2, null, 2));
}
test();
