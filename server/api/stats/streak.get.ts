import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase()

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
