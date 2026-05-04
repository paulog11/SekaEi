import { useSupabase, useSupabaseUser } from '../utils/supabase'
import { computeStreak } from '../utils/updateStreak'
import { extractPhonemeUpserts } from '../utils/updatePhonemeStats'
import type { AssessmentResult } from '~/types/assessment'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)

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

  const db = useSupabase()

  const { data, error } = await db
    .from('attempts')
    .insert({
      user_id: authUser.id,
      passage_id: passageId.trim(),
      passage_title: passageTitle.trim().slice(0, 120),
      accuracy_score: Math.round(accuracy),
      fluency_score: Math.round(fluency),
      completeness_score: Math.round(completeness),
      prosody_score: typeof prosody === 'number' ? Math.round(prosody) : null,
      overall_score: Math.round(overall),
      azure_result: azureResult ?? null,
    })
    .select('id, user_id, passage_id, passage_title, created_at, accuracy_score, fluency_score, completeness_score, prosody_score, overall_score')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Update streak (fire-and-forget — non-fatal if it fails)
  updateStreakSilently(db, authUser.id)

  // Update phoneme stats if azure result provided
  if (azureResult) {
    updatePhonemeStatsSilently(db, authUser.id, azureResult as AssessmentResult)
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
  } catch { /* non-fatal */ }
}

async function updatePhonemeStatsSilently(
  db: ReturnType<typeof import('../utils/supabase').useSupabase>,
  userId: string,
  result: AssessmentResult,
) {
  try {
    const upserts = extractPhonemeUpserts(userId, result)

    // Fetch existing counts for the affected phonemes
    const phonemes = upserts.map(u => u.phoneme)
    const { data: existing } = await db
      .from('phoneme_stats')
      .select('phoneme, attempts_count, score_sum')
      .eq('user_id', userId)
      .in('phoneme', phonemes)

    const existingMap = new Map((existing ?? []).map(r => [r.phoneme, r]))

    const rows = upserts.map(u => {
      const prev = existingMap.get(u.phoneme)
      return {
        user_id: userId,
        phoneme: u.phoneme,
        attempts_count: (prev?.attempts_count ?? 0) + u.attempts_count,
        score_sum: (prev?.score_sum ?? 0) + u.score_sum,
        last_seen: u.last_seen,
      }
    })

    await db.from('phoneme_stats').upsert(rows, { onConflict: 'user_id,phoneme' })
  } catch { /* non-fatal */ }
}
