import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Custom fetch to bypass Cloudflare O2O Error 1016
const customFetch = (url: URL | RequestInfo, init?: RequestInit) => {
  return fetch(url, {
    ...init,
    // @ts-ignore - cf is a Cloudflare specific option
    cf: {
      ...init?.cf,
      dns: "public",
    },
  });
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  }
});
