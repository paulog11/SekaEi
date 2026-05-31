/**
 * @fileoverview GET /api/devices — list devices claimed by the current user.
 * Returns device_claims rows (device_id + claimed_at). This reflects the
 * anonymous-to-auth device migration table; it is NOT a list of live auth sessions.
 * Auth: any authenticated user.
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const { data, error } = await db
    .from('device_claims')
    .select('device_id, claimed_at')
    .eq('user_id', authUser.id)
    .order('claimed_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    devices: (data ?? []).map(row => ({
      deviceId: row.device_id,
      claimedAt: row.claimed_at,
    })),
  }
})
