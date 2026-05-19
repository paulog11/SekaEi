import type { H3Event } from 'h3'
import { useSupabase, useSupabaseUser } from './supabase'

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
