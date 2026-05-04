import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    const supabaseUrl = process.env.SUPABASE_URL ?? ''
    const anonKey = process.env.SUPABASE_KEY ?? ''
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    await client.auth.signOut()
  }

  return { ok: true }
})
