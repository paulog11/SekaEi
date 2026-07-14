/**
 * @fileoverview GET /api/stats/xp — current XP total. Auth: signed-in user.
 * Reads via the RLS-scoped per-request client (the "select own row" policy on
 * `user_xp` applies). Level derivation stays client-side. Defaults to 0 when
 * the user has no `user_xp` row yet — never errors on missing data.
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const { data } = await db
    .from('user_xp')
    .select('total')
    .eq('user_id', authUser.id)
    .maybeSingle()

  return {
    total: data?.total ?? 0,
  }
})
