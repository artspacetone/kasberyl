// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/['"]/g, '');
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');

export const isSupabaseConfigured: boolean = Boolean(
  rawUrl && 
  rawKey && 
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('https://') &&
  rawKey.startsWith('eyJ')
);

// Inisialisasi resmi tanpa menimpa header Authorization bawaan Supabase
export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  }
);