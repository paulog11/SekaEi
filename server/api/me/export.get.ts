/**
 * @fileoverview GET /api/me/export — APPI right of disclosure. Returns a JSON
 * bundle of all user data: profile, attempts (including azure_result), custom
 * passages, streak, phoneme stats, and flagged words. Auth: any authenticated user.
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)
  const uid = authUser.id

  const [profileRes, attemptsRes, passagesRes, streakRes, phonemeRes, flaggedRes] =
    await Promise.all([
      db.from('profiles').select('*').eq('id', uid).maybeSingle(),
      db.from('attempts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      db.from('custom_passages').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      db.from('daily_streaks').select('*').eq('user_id', uid).maybeSingle(),
      db.from('phoneme_stats').select('*').eq('user_id', uid),
      db.from('flagged_words').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])

  if (profileRes.error) throw createError({ statusCode: 500, message: profileRes.error.message })
  if (attemptsRes.error) throw createError({ statusCode: 500, message: attemptsRes.error.message })
  if (passagesRes.error) throw createError({ statusCode: 500, message: passagesRes.error.message })
  if (phonemeRes.error) throw createError({ statusCode: 500, message: phonemeRes.error.message })
  if (flaggedRes.error) throw createError({ statusCode: 500, message: flaggedRes.error.message })

  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="sekatoku-data.json"')

  return {
    exportedAt: new Date().toISOString(),
    profile: profileRes.data,
    attempts: attemptsRes.data ?? [],
    customPassages: passagesRes.data ?? [],
    streak: streakRes.data ?? null,
    phonemeStats: phonemeRes.data ?? [],
    flaggedWords: flaggedRes.data ?? [],
  }
})
