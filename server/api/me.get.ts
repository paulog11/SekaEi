import { useSupabase, useSupabaseUser } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const [profileRes, streakRes] = await Promise.all([
    db.from('profiles').select('display_name, created_at').eq('id', authUser.id).maybeSingle(),
    db.from('daily_streaks').select('current_streak, longest_streak, daily_goal_minutes, last_practice_date').eq('user_id', authUser.id).maybeSingle(),
  ])

  if (profileRes.error) throw createError({ statusCode: 500, message: profileRes.error.message })

  const streak = streakRes.data

  return {
    user: {
      id: authUser.id,
      email: authUser.email,
      displayName: profileRes.data?.display_name ?? null,
      createdAt: profileRes.data?.created_at ?? null,
    },
    streak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    goalMinutes: streak?.daily_goal_minutes ?? 5,
  }
})
