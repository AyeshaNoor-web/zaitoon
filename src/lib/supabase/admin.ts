import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client that uses the SERVICE ROLE key.
 * This bypasses RLS — use ONLY in:
 *  - API routes (/app/api/*)
 *  - Server Actions
 *  - Server Components that need elevated access
 *
 * NEVER expose this client to the browser.
 */
export const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            // Disable auto-refresh and session persistence — not needed server-side
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)
