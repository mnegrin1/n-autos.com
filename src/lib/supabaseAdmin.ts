import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
// Usamos el SERVICE ROLE KEY para evitar las restricciones de RLS en el servidor, 
// ya que Next.js maneja su propia autenticación con cookies en vez de Supabase Auth.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-service-key';

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});
