const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase upsert...");
  const { data, error } = await supabase
    .from('auto_integrations')
    .upsert({
      agency_id: 'demo-agency-id',
      channel: 'mercadolibre',
      connected: true,
      username: 'Test User',
      token: 'test_token',
      refresh_token: 'test_refresh',
      expires_at: Date.now(),
      mode: 'production',
      updated_at: new Date().toISOString()
    }, { onConflict: 'channel' });

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Supabase Success:", data);
  }
}

test();
