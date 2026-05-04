import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id is required.' })
  }

  const db = useSupabase()

  const { error } = await db
    .from('custom_passages')
    .delete()
    .eq('id', id)
    .eq('user_id', authUser.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
