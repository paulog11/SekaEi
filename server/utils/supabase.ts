import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function useSupabase() {
  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const serviceKey = config.supabaseSecretKey || (process.env.NUXT_SUPABASE_SECRET_KEY ?? '')
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
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
