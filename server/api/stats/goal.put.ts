import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const body = await readBody(event)
  const { minutes } = body ?? {}

  if (typeof minutes !== 'number' || minutes < 1 || minutes > 120) {
    throw createError({ statusCode: 400, message: 'minutes must be a number between 1 and 120.' })
  }

  const db = useSupabase()

  const { error } = await db
    .from('daily_streaks')
    .upsert({ user_id: authUser.id, daily_goal_minutes: Math.round(minutes) })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true, goalMinutes: Math.round(minutes) }
})
