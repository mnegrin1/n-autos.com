import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('auto_integrations').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);

  // Try to test the upsert logic exactly as the app does
  const { error: upsertError } = await supabase.from('auto_integrations').upsert({
    channel: "mercadolibre",
    agency_id: "00000000-0000-0000-0000-000000000000",
    connected: true,
    username: "Test ML User",
    token: "test_token",
    refresh_token: "test_refresh_token",
    expires_at: Date.now() + 100000,
    mode: "production",
    settings: { user_id: 12345 },
    updated_at: new Date().toISOString()
  }, { onConflict: "channel" });

  console.log('Upsert Error:', upsertError);
}

test();
