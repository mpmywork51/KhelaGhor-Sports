import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wvwnpnnqijtgupxtodug.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2tN_SeBb-0gtUGn5BquZoA_K1AP28aX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if Supabase is reachable
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('channels').select('count', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.warn('Supabase dry-run connection check failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase dry-run connection error:', err);
    return false;
  }
}
