import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * - Put these in Vercel Environment Variables:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * - DO NOT hardcode keys in the frontend.
 * - After changing this file, rotate the exposed key in Supabase dashboard.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A safe storage adapter for mobile browsers.
// If localStorage is blocked (some mobile modes), it falls back to in-memory storage.
const memoryStore = new Map();

const safeStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
});

export const testConnection = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase env variables missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  } else {
    console.log("✅ Supabase client initialized");
  }
};
