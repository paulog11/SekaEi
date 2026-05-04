import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase()

  const { data, error } = await db
    .from('custom_passages')
    .select('id, title, text, ipa, created_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { passages: data ?? [] }
})
