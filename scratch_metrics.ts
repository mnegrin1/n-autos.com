import 'dotenv/config'; // will load .env
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: mlIntegration } = await supabase
    .from("auto_integrations")
    .select("*")
    .eq("agency_id", "demo-agency-id")
    .eq("provider", "mercadolibre")
    .single();

  const token = mlIntegration?.access_token;
  if (!token) throw new Error("No token");

  const itemId = "MLU1454652190";
  
  // Try to get item
  const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const itemData = await itemRes.json();
  console.log("ITEM THUMBNAIL:", itemData.thumbnail, itemData.secure_thumbnail, itemData.pictures?.[0]?.secure_url);
  
  // Try to get visits
  const visitsRes = await fetch(`https://api.mercadolibre.com/visits/items?ids=${itemId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const visitsData = await visitsRes.json();
  console.log("VISITS:", visitsData);
  
  // Try to get questions
  const qRes = await fetch(`https://api.mercadolibre.com/questions/search?item=${itemId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const qData = await qRes.json();
  console.log("QUESTIONS TOTAL:", qData.total);
}

main().catch(console.error);
