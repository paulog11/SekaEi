import { useSupabase, useSupabaseUser } from '../utils/supabase'
import { generateCoachReply, COACH_DAILY_LIMIT } from '../utils/coach'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase()
  const config = useRuntimeConfig()

  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 503, message: 'Coaching service not configured.' })
  }

  // Enforce daily quota
  const today = new Date().toISOString().slice(0, 10)
  const { data: usageCount } = await db
    .rpc('increment_coach_usage', { p_user_id: authUser.id, p_day: today })

  if ((usageCount as unknown as number) > COACH_DAILY_LIMIT) {
    throw createError({ statusCode: 429, message: `Daily coaching limit of ${COACH_DAILY_LIMIT} reached. Try again tomorrow.` })
  }

  // Load top 10 active flagged words
  const { data: flaggedWords, error: fwError } = await db
    .from('flagged_words')
    .select('display_word, lowest_score, weak_phonemes')
    .eq('user_id', authUser.id)
    .is('retired_at', null)
    .order('lowest_score', { ascending: true })
    .limit(10)

  if (fwError) throw createError({ statusCode: 500, message: fwError.message })

  // Load bottom 10 phonemes by average score (min 3 attempts)
  const { data: phonemeRows, error: phError } = await db
    .from('phoneme_stats')
    .select('phoneme, attempts_count, score_sum')
    .eq('user_id', authUser.id)
    .gte('attempts_count', 3)
    .order('score_sum', { ascending: true })
    .limit(10)

  if (phError) throw createError({ statusCode: 500, message: phError.message })

  const weakPhonemes = (phonemeRows ?? []).map(p => ({
    phoneme: p.phoneme,
    avgScore: p.attempts_count > 0 ? p.score_sum / p.attempts_count : 0,
    attemptsCount: p.attempts_count,
  }))

  try {
    const reply = await generateCoachReply(config.anthropicApiKey as string, {
      flaggedWords: flaggedWords ?? [],
      weakPhonemes,
    })
    return reply
  } catch (err) {
    throw createError({ statusCode: 422, message: err instanceof Error ? err.message : 'Coach service error.' })
  }
})
