/**
 * @fileoverview GET /api/stats/streak — current/longest streak + daily goal
 * + `todayMet` flag. Auth: signed-in user. Defaults (0/0/5/false) returned
 * when the user has no `daily_streaks` row yet — never errors on missing data.
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const { data } = await db
    .from('daily_streaks')
    .select('current_streak, longest_streak, daily_goal_minutes, last_practice_date')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)

  return {
    current: data?.current_streak ?? 0,
    longest: data?.longest_streak ?? 0,
    goalMinutes: data?.daily_goal_minutes ?? 5,
    todayMet: data?.last_practice_date === today,
  }
})
