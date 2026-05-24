/**
 * @fileoverview POST /api/me/tutorial — mark the in-app tour as completed.
 * Auth: approved user. Stamps `profiles.tutorial_completed_at = now()`.
 * Idempotent — repeat calls update the timestamp but cause no other change.
 */

import { useSupabase } from '../../utils/supabase'
import { requireApprovedUser } from '../../utils/approval'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const db = useSupabase(event)

  const { error } = await db
    .from('profiles')
    .update({ tutorial_completed_at: new Date().toISOString() })
    .eq('id', authUser.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { completedAt: new Date().toISOString() }
})
