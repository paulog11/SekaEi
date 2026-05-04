import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body ?? {}

  if (typeof email !== 'string' || !email.trim()) {
    throw createError({ statusCode: 400, message: 'email is required.' })
  }
  if (typeof password !== 'string' || !password) {
    throw createError({ statusCode: 400, message: 'password is required.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.SUPABASE_KEY ?? ''
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw createError({ statusCode: 401, message: error.message })
  }

  return {
    user: { id: data.user.id, email: data.user.email },
    session: data.session,
  }
})
