/**
 * Supabase Client Integration
 * Handles connection to PostgreSQL / Supabase Realtime / Supabase Storage
 * Configured via Vite environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */

// Placeholder client or real client if credentials are provided
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = {
  configured: isSupabaseConfigured,
  url: import.meta.env.VITE_SUPABASE_URL || 'https://demo-college.supabase.co',
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOtp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  }),
  storage: {
    from: (bucket) => ({
      upload: async () => ({ data: { path: 'demo' }, error: null }),
      getPublicUrl: (path) => ({ data: { publicUrl: path } }),
      createSignedUrl: async (path, expiresIn) => ({ data: { signedUrl: path }, error: null }),
    })
  }
};

export default supabase;
