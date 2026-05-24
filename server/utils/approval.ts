import type { H3Event } from 'h3'
import { useSupabase, useSupabaseUser } from './supabase'
import type { Tier } from './tierLimits'

export type AccessLevel = 'free' | 'attendee' | 'approved'

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
