import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  console.log("=== INICIANDO SYNC TEST ===");
  const { data, error } = await supabase.from('auto_integrations').select('*').eq('channel', 'mercadolibre').eq('agency_id', 'demo-agency-id');
  if (error) return console.error("DB Error:", error);
  const ml = data?.[0];
  if (!ml || !ml.connected) return console.log("ML no conectado");

  const token = ml.token;
  console.log("Token obtenido (primeros chars):", token.substring(0, 15) + "...");

  const userRes = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const userData = await userRes.json();
  if (!userRes.ok) return console.log("Error perfil ML:", userData);
  const userId = userData.id;
  console.log("Perfil OK. User ID:", userId);

  // 1. Busqueda interna
  const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  let itemIds = searchData.results || [];
  console.log("Internal search results length:", itemIds.length);

  // 2. Busqueda publica
  if (itemIds.length === 0) {
    console.log("Internal vacio, probando busqueda publica...");
    const publicSearchRes = await fetch(`https://api.mercadolibre.com/sites/MLU/search?seller_id=${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const publicSearchData = await publicSearchRes.json();
    if (publicSearchData.results) {
      itemIds = publicSearchData.results.map((r: any) => r.id);
    }
    console.log("Public search results length:", itemIds.length);
  }

  console.log("Item IDs finales a procesar:", itemIds);

  const syncedPubs = [];
  for (const itemId of itemIds) {
    console.log(`Consultando detalles para ${itemId}...`);
    const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const itemData = await itemRes.json();
    if (!itemRes.ok) {
       console.log(`FALLO fetch item ${itemId}:`, itemData);
    } else {
       console.log(`EXITO fetch item ${itemId}:`, itemData.title, itemData.price);
       syncedPubs.push(itemData.id);
    }
  }

  console.log("Publicaciones sincronizadas con exito:", syncedPubs.length);
}

testSync();
