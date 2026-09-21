import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    // Inyectamos explícitamente el fetch nativo del entorno para evitar el Error 1016 de Cloudflare (O2O).
    // Y forzamos no-store con timeout defensivo de 8s (Nygard: Puntos de Integración)
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(new Error("Supabase request timeout (8000ms)")),
        8000
      );

      if (options.signal) {
        options.signal.addEventListener("abort", () => controller.abort(options.signal?.reason));
      }

      return fetch(url, { ...options, signal: controller.signal, cache: 'no-store' })
        .finally(() => clearTimeout(timeoutId));
    }
  }
});
