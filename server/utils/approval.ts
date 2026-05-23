import type { H3Event } from 'h3'
import { useSupabase, useSupabaseUser } from './supabase'

export type AccessLevel = 'free' | 'approved'

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

export async function requireAccess(event: H3Event, level: AccessLevel) {
  if (level === 'free') return useSupabaseUser(event)
  return requireApprovedUser(event)
}
