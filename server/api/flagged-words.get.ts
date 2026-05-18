import { useSupabase, useSupabaseUser } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const query = getQuery(event)
  const status = (query.status as string) ?? 'active'
  const limit = Math.min(Number(query.limit) || 100, 200)

  let q = db
    .from('flagged_words')
    .select('*')
    .eq('user_id', authUser.id)
    .order('last_seen', { ascending: false })
    .limit(limit)

  if (status === 'active') {
    q = q.is('retired_at', null)
  } else if (status === 'retired') {
    q = q.not('retired_at', 'is', null)
  }

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { words: data ?? [] }
})
