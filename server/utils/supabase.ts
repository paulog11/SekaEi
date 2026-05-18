import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function useSupabase(event: H3Event) {
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.SUPABASE_KEY ?? ''
  const authHeader = getHeader(event, 'authorization') ?? ''
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  })
}

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
