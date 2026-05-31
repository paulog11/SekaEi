/**
 * @fileoverview DELETE /api/me — permanently delete the current user's account.
 * Auth: any authenticated user (including pending/rejected — deletion is a right
 * that applies regardless of approval status). Cascades remove all per-user rows
 * automatically via FK ON DELETE CASCADE.
 */

import { useSupabaseUser } from '../utils/supabase'
import { useSupabaseService } from '../utils/supabaseService'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const svc = useSupabaseService()

  const { error } = await svc.auth.admin.deleteUser(authUser.id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
