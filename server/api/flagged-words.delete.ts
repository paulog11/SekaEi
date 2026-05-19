import { useSupabase } from '../utils/supabase'
import { requireApprovedUser } from '../utils/approval'
import { normalizeWord } from '../utils/flagDifficultWords'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const db = useSupabase(event)

  const body = await readBody(event)
  const { word } = body ?? {}

  if (typeof word !== 'string' || !word.trim()) {
    throw createError({ statusCode: 400, message: 'word is required.' })
  }

  const normalized = normalizeWord(word.trim())

  const { error } = await db
    .from('flagged_words')
    .update({ retired_at: new Date().toISOString() })
    .eq('user_id', authUser.id)
    .eq('word', normalized)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
