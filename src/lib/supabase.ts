import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    // Inyectamos explícitamente el fetch nativo del entorno para evitar el Error 1016 de Cloudflare (O2O).
    // Y forzamos no-store para evitar problemas de caché agresiva de Next.js
    fetch: (url, options = {}) => {
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});
