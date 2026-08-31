// src/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Bersihkan URL dan Token dari spasi atau tanda kutip tidak sengaja
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/['"]/g, '');
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');

export const isSupabaseConfigured: boolean = Boolean(
  rawUrl && 
  rawKey && 
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('https://') &&
  rawKey.startsWith('eyJ') // Kunci JWT Supabase selalu diawali eyJ
);

export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': isSupabaseConfigured ? rawKey : '',
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      }
    }
  }
);