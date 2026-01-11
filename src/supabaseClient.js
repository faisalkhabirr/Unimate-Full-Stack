import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfkizzmsxwwxkrlsvpdb.supabase.co/';
const supabaseAnonKey = 'sb_publishable_93rGe0WG6Gr3TFzwOhvU2w_ZbNAB1ds';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testConnection = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env variables missing');
  } else {
    console.log('✅ Supabase client initialized');
  }
};
