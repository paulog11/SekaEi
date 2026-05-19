import { createClient } from '@supabase/supabase-js'

export function useSupabaseService() {
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const serviceKey = process.env.NUXT_SUPABASE_SECRET_KEY ?? ''
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}
