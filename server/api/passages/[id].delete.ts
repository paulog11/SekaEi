/**
 * @fileoverview DELETE /api/passages/:id — delete the user's custom passage.
 * Auth: approved user. Hard delete (no soft-delete column). The `.eq('user_id', authUser.id)`
 * is the authorisation check — RLS also enforces, but this is the belt-and-braces.
 */

import { useSupabase } from '../../utils/supabase'
import { requireApprovedUser } from '../../utils/approval'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id is required.' })
  }

  const db = useSupabase(event)

  const { error } = await db
    .from('custom_passages')
    .delete()
    .eq('id', id)
    .eq('user_id', authUser.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
