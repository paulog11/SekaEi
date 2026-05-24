/**
 * @fileoverview GET /api/passages — list the user's custom passages.
 * Auth: signed-in user. Returns all passages (no pagination — capped by
 * the per-user write side, not by this read).
 */

import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const db = useSupabase(event)

  const { data, error } = await db
    .from('custom_passages')
    .select('id, title, text, ipa, category, created_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { passages: data ?? [] }
})
