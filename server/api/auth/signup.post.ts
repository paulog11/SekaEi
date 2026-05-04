import { createClient } from '@supabase/supabase-js'
import { claimDevice } from '~/server/utils/claimDevice'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, deviceId } = body ?? {}

  if (typeof email !== 'string' || !email.trim()) {
    throw createError({ statusCode: 400, message: 'email is required.' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw createError({ statusCode: 400, message: 'password must be at least 8 characters.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.SUPABASE_KEY ?? ''
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })

  const { data, error } = await client.auth.signUp({ email: email.trim(), password })

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  // Claim any pre-auth anonymous attempts under this device id
  if (typeof deviceId === 'string' && data.user && /^[0-9a-f-]{36}$/i.test(deviceId)) {
    try {
      await claimDevice(deviceId, data.user.id)
    } catch {
      // Non-fatal — claim can fail silently
    }
  }

  return {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: data.session,
  }
})
