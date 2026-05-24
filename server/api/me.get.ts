import { useSupabase, useSupabaseUser } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const [profileRes, streakRes] = await Promise.all([
    db.from('profiles').select('display_name, university, created_at, approval_status, tutorial_completed_at, tier').eq('id', authUser.id).maybeSingle(),
    db.from('daily_streaks').select('current_streak, longest_streak, daily_goal_minutes, last_practice_date').eq('user_id', authUser.id).maybeSingle(),
  ])

  if (profileRes.error) throw createError({ statusCode: 500, message: profileRes.error.message })

  const streak = streakRes.data

  return {
    user: {
      id: authUser.id,
      email: authUser.email,
      displayName: profileRes.data?.display_name ?? null,
      university: profileRes.data?.university ?? null,
      createdAt: profileRes.data?.created_at ?? null,
      approvalStatus: profileRes.data?.approval_status ?? 'pending',
      tutorialCompletedAt: profileRes.data?.tutorial_completed_at ?? null,
      tier: (profileRes.data?.tier ?? 'public') as 'public' | 'attendee',
    },
    streak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    goalMinutes: streak?.daily_goal_minutes ?? 5,
  }
})
