/**
 * @fileoverview POST /api/coach — generates an AI coach reply from the user's
 * flagged words + weak phonemes. Auth: signed-in user, but gated by tier —
 * tiers with `coachDaily = 0` get 403. Daily quota enforced via
 * `increment_coach_usage` RPC (server-counted, not client-trusted).
 */

import { useSupabase } from '../utils/supabase'
import { requireAccess, getUserTier } from '../utils/approval'
import { TIER_LIMITS } from '../utils/tierLimits'
import { generateCoachReply } from '../utils/coach'

export default defineEventHandler(async (event) => {
  const authUser = await requireAccess(event, 'free')
  const db = useSupabase(event)
  const config = useRuntimeConfig()

  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 503, message: 'Coaching service not configured.' })
  }

  const tier = await getUserTier(event, authUser.id)
  const coachDaily = TIER_LIMITS[tier].coachDaily

  if (coachDaily === 0) {
    throw createError({ statusCode: 403, message: 'AI coaching is available to program attendees. Enter your invite code in Account settings to unlock it.' })
  }

  // Enforce daily quota
  const today = new Date().toISOString().slice(0, 10)
  const { data: usageCount } = await db
    .rpc('increment_coach_usage', { p_user_id: authUser.id, p_day: today })

  if (typeof usageCount === 'number' && usageCount > coachDaily) {
    throw createError({ statusCode: 429, message: `Daily coaching limit of ${coachDaily} reached. Try again tomorrow.` })
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
