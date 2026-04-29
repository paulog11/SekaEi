import { useSupabase } from '../utils/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const deviceId = getHeader(event, 'x-device-id')
  if (!deviceId || !UUID_RE.test(deviceId)) {
    throw createError({ statusCode: 401, message: 'Missing or invalid x-device-id header.' })
  }

  const db = useSupabase()

  // Find existing user row
  const { data: existing, error: findError } = await db
    .from('users')
    .select('id, created_at')
    .eq('id', deviceId)
    .maybeSingle()

  if (findError) throw createError({ statusCode: 500, message: findError.message })

  if (existing) {
    return { user: { id: existing.id, createdAt: existing.created_at } }
  }

  // First visit — create row with the device id as the primary key
  const { data: created, error: insertError } = await db
    .from('users')
    .insert({ id: deviceId })
    .select('id, created_at')
    .single()

  if (insertError) throw createError({ statusCode: 500, message: insertError.message })

  return { user: { id: created.id, createdAt: created.created_at } }
})
