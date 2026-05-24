/**
 * @fileoverview Service-role Supabase client — bypasses RLS. Use ONLY from
 * trusted server-side flows that have already enforced authorization (e.g.
 * the approve-user admin endpoint). Never expose to user-driven code paths.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses RLS, so callers are responsible for any
 * authorization checks. Read the file header before using.
 */
export function useSupabaseService() {
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const serviceKey = process.env.NUXT_SUPABASE_SECRET_KEY ?? ''
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}
