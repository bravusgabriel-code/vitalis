import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Lazy initialization to avoid crashing on module load if environment variables are missing
let supabaseClient: any = null;

// Mock object that returns no-ops for common Supabase methods to prevent crashing when vars are missing
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
    signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), eq: () => ({}) }), order: () => ({}) }),
    insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({ eq: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
    upsert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    delete: () => ({ eq: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
  }),
  rpc: async () => ({ data: null, error: new Error('Supabase not configured') }),
};

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
    const isConfigured = !!(isValidUrl && supabaseAnonKey);

    if (prop === 'isConfigured') return isConfigured;

    if (!supabaseClient) {
      if (!isConfigured) {
        if (!(globalThis as any).__supabase_warned) {
          console.warn('Supabase URL or Anon Key is missing or invalid. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
          (globalThis as any).__supabase_warned = true;
        }
        // Return from mock object if it exists, otherwise a no-op function
        return (mockSupabase as any)[prop] || (() => {});
      }
      
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    const value = supabaseClient[prop];
    return typeof value === 'function' ? value.bind(supabaseClient) : value;
  }
});
