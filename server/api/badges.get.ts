/**
 * @fileoverview GET /api/badges — lazy check-and-award. Auth: signed-in user
 * (same pattern as the other stats endpoints — read-only, no approval gate).
 * Computes eligibility from current streak/attempts/mastery/phoneme-stats
 * data, upserts any newly-eligible badges via the service client (bypassing
 * RLS — `user_badges` has no client insert policy), and returns every earned
 * badge including ones just awarded. Each eligibility query degrades to a
 * safe default on failure rather than 500ing; only auth errors propagate.
 */

import { useSupabase, useSupabaseUser } from '../utils/supabase'
import { useSupabaseService } from '../utils/supabaseService'
import { computeEligibleBadges } from '../utils/badges'
import type { PhonemeDelta } from '../utils/updatePhonemeStats'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const earned = new Map<string, string>()
  try {
    const { data, error } = await db
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', authUser.id)
    if (error) console.error('[badges] earned query failed:', error)
    else for (const row of data ?? []) earned.set(row.badge_id, row.earned_at)
  } catch (err) { console.error('[badges] earned query failed:', err) }

  let longestStreak = 0
  try {
    const { data, error } = await db
      .from('daily_streaks')
      .select('longest_streak')
      .eq('user_id', authUser.id)
      .maybeSingle()
    if (error) console.error('[badges] streak query failed:', error)
    else longestStreak = data?.longest_streak ?? 0
  } catch (err) { console.error('[badges] streak query failed:', err) }

  let attemptsCount = 0
  try {
    const { count, error } = await db
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
    if (error) console.error('[badges] attempts count query failed:', error)
    else attemptsCount = count ?? 0
  } catch (err) { console.error('[badges] attempts count query failed:', err) }

  let hasMastery = false
  try {
    const { data, error } = await db
      .from('attempts')
      .select('id')
      .eq('user_id', authUser.id)
      .gte('overall_score', 90)
      .limit(1)
    if (error) console.error('[badges] mastery query failed:', error)
    else hasMastery = (data?.length ?? 0) > 0
  } catch (err) { console.error('[badges] mastery query failed:', err) }

  let phonemeStats: PhonemeDelta = {}
  try {
    const { data, error } = await db
      .from('phoneme_stats')
      .select('stats')
      .eq('user_id', authUser.id)
      .maybeSingle()
    if (error) console.error('[badges] phoneme stats query failed:', error)
    else phonemeStats = (data?.stats ?? {}) as PhonemeDelta
  } catch (err) { console.error('[badges] phoneme stats query failed:', err) }

  const eligible = computeEligibleBadges({ longestStreak, attemptsCount, hasMastery, phonemeStats })
  const missing = eligible.filter(id => !earned.has(id))

  if (missing.length > 0) {
    try {
      const serviceDb = useSupabaseService()
      const nowIso = new Date().toISOString()
      const { error } = await serviceDb
        .from('user_badges')
        .upsert(
          missing.map(id => ({ user_id: authUser.id, badge_id: id, earned_at: nowIso })),
          { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
        )
      if (error) console.error('[badges] award upsert failed:', error)
      else for (const id of missing) earned.set(id, nowIso)
    } catch (err) { console.error('[badges] award upsert failed:', err) }
  }

  const badges = [...earned.entries()].map(([id, earnedAt]) => ({ id, earnedAt }))

  return { badges }
})
