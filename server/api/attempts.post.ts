/**
 * @fileoverview POST /api/attempts — persist a completed attempt. Auth: approved user.
 * Generates a 12-char nanoid slug for shareable links. After insert, kicks off
 * three fire-and-forget background updates (streak, phoneme stats, flagged
 * words) — failures in those are logged but never block the response.
 */

import { nanoid } from 'nanoid'
import { useSupabase } from '../utils/supabase'
import { requireApprovedUser } from '../utils/approval'
import { computeStreak } from '../utils/updateStreak'
import { extractPhonemeDelta } from '../utils/updatePhonemeStats'
import { flagDifficultWordsSilently } from '../utils/flagDifficultWords'
import type { AssessmentResult } from '~/types/assessment'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)

  const body = await readBody(event)
  const { passageId, passageTitle, scores, azureResult } = body ?? {}

  if (typeof passageId !== 'string' || !passageId.trim()) {
    throw createError({ statusCode: 400, message: 'passageId is required.' })
  }
  if (typeof passageTitle !== 'string' || !passageTitle.trim()) {
    throw createError({ statusCode: 400, message: 'passageTitle is required.' })
  }
  if (!scores || typeof scores !== 'object') {
    throw createError({ statusCode: 400, message: 'scores object is required.' })
  }
  const { accuracy, fluency, completeness, prosody, overall } = scores as Record<string, unknown>
  if (typeof accuracy !== 'number' || typeof fluency !== 'number' ||
      typeof completeness !== 'number' || typeof overall !== 'number') {
    throw createError({ statusCode: 400, message: 'scores must include accuracy, fluency, completeness, and overall.' })
  }

  const db = useSupabase(event)

  const { data, error } = await db
    .from('attempts')
    .insert({
      user_id: authUser.id,
      slug: nanoid(12),
      passage_id: passageId.trim(),
      passage_title: passageTitle.trim().slice(0, 120),
      accuracy_score: Math.round(accuracy),
      fluency_score: Math.round(fluency),
      completeness_score: Math.round(completeness),
      prosody_score: typeof prosody === 'number' ? Math.round(prosody) : null,
      overall_score: Math.round(overall),
      azure_result: azureResult ?? null,
    })
    .select('id, slug, user_id, passage_id, passage_title, created_at, accuracy_score, fluency_score, completeness_score, prosody_score, overall_score')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Update streak (fire-and-forget — non-fatal if it fails)
  updateStreakSilently(db, authUser.id)

  // Update phoneme stats if azure result provided
  if (azureResult) {
    updatePhonemeStatsSilently(db, authUser.id, azureResult as AssessmentResult)
    flagDifficultWordsSilently(db, authUser.id, azureResult as AssessmentResult, passageId.trim())
  }


  return { attempt: data }
})

async function updateStreakSilently(db: ReturnType<typeof import('../utils/supabase').useSupabase>, userId: string) {
  try {
    const { data: streakRow } = await db
      .from('daily_streaks')
      .select('current_streak, longest_streak, last_practice_date')
      .eq('user_id', userId)
      .maybeSingle()

    const update = computeStreak(
      new Date(),
      streakRow?.last_practice_date ?? null,
      streakRow?.current_streak ?? 0,
      streakRow?.longest_streak ?? 0,
    )

    await db.from('daily_streaks').upsert({ user_id: userId, ...update })
  } catch (err) { console.error('[attempts] streak update failed:', err) }
}

async function updatePhonemeStatsSilently(
  db: ReturnType<typeof import('../utils/supabase').useSupabase>,
  userId: string,
  result: AssessmentResult,
) {
  try {
    const delta = extractPhonemeDelta(result)
    await db.rpc('merge_phoneme_stats', { p_user_id: userId, p_delta: delta })
  } catch (err) { console.error('[attempts] phoneme stats update failed:', err) }
}
