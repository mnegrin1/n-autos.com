import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://joadvlatdeyamtspvruu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg');

async function test() {
  const { data } = await supabase.from('auto_integrations').select('*').eq('channel', 'mercadolibre').eq('agency_id', 'demo-agency-id');
  const ml = data?.[0];
  if (!ml) return console.log("No ML integration found");
  
  const token = ml.token;
  console.log("Got token");

  // Get user profile
  const userRes = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const userData = await userRes.json();
  console.log("User Data:", userData.id);

  // Get items
  const searchRes = await fetch(`https://api.mercadolibre.com/users/${userData.id}/items/search`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  console.log("Items response:", JSON.stringify(searchData, null, 2));

  // If no items, try searching public API
  const publicRes = await fetch(`https://api.mercadolibre.com/sites/MLU/search?seller_id=${userData.id}`);
  const publicData = await publicRes.json();
  console.log("Public Search response:", JSON.stringify(publicData, null, 2));

}

test();
