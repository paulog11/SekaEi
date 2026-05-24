/**
 * @fileoverview PUT /api/stats/goal — set the user's daily practice goal
 * (minutes). Auth: approved user. Range 1–120; rounded before persist.
 * Upserts into `daily_streaks` so a user with no streak row yet still gets
 * a goal saved.
 */

import { useSupabase } from '../../utils/supabase'
import { requireApprovedUser } from '../../utils/approval'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const body = await readBody(event)
  const { minutes } = body ?? {}

  if (typeof minutes !== 'number' || minutes < 1 || minutes > 120) {
    throw createError({ statusCode: 400, message: 'minutes must be a number between 1 and 120.' })
  }

  const db = useSupabase(event)

  const { error } = await db
    .from('daily_streaks')
    .upsert({ user_id: authUser.id, daily_goal_minutes: Math.round(minutes) })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true, goalMinutes: Math.round(minutes) }
})
