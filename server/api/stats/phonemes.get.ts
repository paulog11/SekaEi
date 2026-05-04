import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase()

  const { data, error } = await db
    .from('phoneme_stats')
    .select('phoneme, attempts_count, score_sum, last_seen')
    .eq('user_id', authUser.id)
    .gte('attempts_count', 3) // Minimum 3 attempts for meaningful stats

  if (error) throw createError({ statusCode: 500, message: error.message })

  const rows = (data ?? []).map(r => ({
    phoneme: r.phoneme,
    avgScore: r.attempts_count > 0 ? Math.round(r.score_sum / r.attempts_count) : 0,
    attemptsCount: r.attempts_count,
  }))

  rows.sort((a, b) => a.avgScore - b.avgScore)

  const weakest = rows.slice(0, 10)
  const strongest = rows.slice(-10).reverse()

  return { weakest, strongest }
})
