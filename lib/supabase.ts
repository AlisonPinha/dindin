import { createBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

// ===========================================
// Environment Variables
// ===========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ===========================================
// Browser Client (Client Components)
// ===========================================

/**
 * Creates a Supabase client for use in browser/client components
 * Uses the anon key and handles auth state automatically
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ===========================================
// Server Client (Server Components, API Routes)
// ===========================================

/**
 * Creates a Supabase client for use in server components and API routes
 * This client respects RLS policies and uses the anon key
 */
export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Admin Client (Server-side only, bypasses RLS)
// ===========================================

/**
 * Creates an admin Supabase client that bypasses RLS
 * ONLY use this on the server for administrative tasks
 * NEVER expose this client to the browser
 */
export function createSupabaseAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Server Action Client
// ===========================================

/**
 * Creates a Supabase client for use in Server Actions
 * Handles cookie-based auth for server actions
 */
export function createSupabaseServerActionClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Singleton instance for simple use cases
// ===========================================

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

/**
 * Get a singleton instance of the browser client
 * Useful for simple use cases where you don't need a new client each time
 */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient can only be used in browser environment")
  }

  if (!browserClient) {
    browserClient = createSupabaseBrowserClient()
  }

  return browserClient
}

// ===========================================
// Type exports
// ===========================================

export type { User, Session } from "@supabase/supabase-js"
