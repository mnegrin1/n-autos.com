import 'dotenv/config'; // will load .env
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('auto_integrations').select('*').eq('channel', 'mercadolibre').eq('agency_id', 'demo-agency-id');
  const ml = data?.[0];
  const token = ml.token;

  console.log("Fetching MLU1454652190 WITH token...");
  const itemRes = await fetch(`https://api.mercadolibre.com/items/MLU1454652190`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Item OK?", itemRes.ok, itemRes.status);
  const itemData = await itemRes.json();
  console.log(itemData.error ? itemData : { id: itemData.id, status: itemData.status, price: itemData.price });
}
test();
