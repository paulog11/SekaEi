/**
 * @fileoverview Server-side access guards. Every protected API handler should
 * call one of these as its first line to enforce auth + the right tier/approval
 * level before touching any data.
 */

import type { H3Event } from 'h3'
import { useSupabase, useSupabaseUser } from './supabase'
import type { Tier } from './tierLimits'

export type AccessLevel = 'free' | 'attendee' | 'approved'

/**
 * Requires the request to come from an authenticated user whose
 * `profiles.approval_status` is `'approved'`. Throws 401 if no valid bearer
 * token, 403 if the account is pending/rejected.
 */
export async function requireApprovedUser(event: H3Event) {
  const user = await useSupabaseUser(event)
  const db = useSupabase(event)
  const { data } = await db
    .from('profiles')
    .select('approval_status')
    .eq('id', user.id)
    .single() as { data: { approval_status?: string } | null }
  if (data?.approval_status !== 'approved') {
    throw createError({ statusCode: 403, message: 'Account pending approval.' })
  }
  return user
}

/**
 * Looks up the user's tier from `profiles.tier`. Defaults to `'public'` when
 * the row or column is missing — never throws (callers can rely on a value).
 */
export async function getUserTier(event: H3Event, userId?: string): Promise<Tier> {
  const id = userId ?? (await useSupabaseUser(event)).id
  const db = useSupabase(event)
  const { data } = await db
    .from('profiles')
    .select('tier')
    .eq('id', id)
    .single() as { data: { tier?: string } | null }
  return (data?.tier as Tier) ?? 'public'
}

/**
 * Generic access gate.
 * - `'free'`     → any authenticated user (returns user)
 * - `'attendee'` → user with `tier = 'attendee'` (throws 403 otherwise)
 * - `'approved'` → delegates to {@link requireApprovedUser}
 */
export async function requireAccess(event: H3Event, level: AccessLevel) {
  if (level === 'free') return useSupabaseUser(event)
  if (level === 'attendee') {
    const user = await useSupabaseUser(event)
    const tier = await getUserTier(event, user.id)
    if (tier !== 'attendee') {
      throw createError({ statusCode: 403, message: 'This feature is for program attendees.' })
    }
    return user
  }
  return requireApprovedUser(event)
}
