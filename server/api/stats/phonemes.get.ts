/**
 * @fileoverview GET /api/stats/phonemes — aggregated phoneme accuracy.
 * Auth: signed-in user. Filters to phonemes with ≥3 attempts (so tiny samples
 * don't dominate), sorts by avg score, returns the 10 weakest and 10 strongest.
 * Server-side aggregation means the client never sees the raw blob.
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'
import type { PhonemeDelta } from '../../utils/updatePhonemeStats'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const { data, error } = await db
    .from('phoneme_stats')
    .select('stats')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })

  const stats = (data?.stats ?? {}) as PhonemeDelta

  const rows = Object.entries(stats)
    .filter(([, v]) => v.c >= 3) // minimum 3 attempts for meaningful stats
    .map(([phoneme, v]) => ({
      phoneme,
      avgScore: Math.round(v.s / v.c),
      attemptsCount: v.c,
    }))

  rows.sort((a, b) => a.avgScore - b.avgScore)

  const weakest = rows.slice(0, 10)
  const strongest = rows.slice(-10).reverse()

  return { weakest, strongest }
})
