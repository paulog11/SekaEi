/**
 * @fileoverview Per-request Supabase clients for handlers. {@link useSupabase}
 * forwards the caller's bearer token so RLS policies apply as that user;
 * {@link useSupabaseUser} additionally validates the token and returns the user.
 * For service-role access (bypassing RLS) use `supabaseService.ts` instead.
 */

import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

/**
 * RLS-respecting Supabase client scoped to the current request's bearer token.
 * Use this for any per-user read/write where row-level security should apply.
 */
export function useSupabase(event: H3Event) {
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.SUPABASE_KEY ?? ''
  const authHeader = getHeader(event, 'authorization') ?? ''
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  })
}

/**
 * Validates the request's `Authorization: Bearer <token>` header and returns
 * the Supabase auth user. Throws 401 on missing / malformed / invalid token.
 */
export async function useSupabaseUser(event: H3Event) {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw createError({ statusCode: 401, message: 'Not authenticated.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.SUPABASE_KEY ?? ''
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session.' })
  }

  return user
}
