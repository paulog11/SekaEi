/**
 * @fileoverview POST /api/flagged-words — manually flag a word (e.g. from the
 * word drill). Auth: approved user. `source` is required and must be
 * `'auto'` or `'manual'`; `score` must be 0–100. Returns the upserted row.
 */

import { useSupabase } from '../utils/supabase'
import { requireApprovedUser } from '../utils/approval'
import { normalizeWord } from '../utils/flagDifficultWords'
import type { WeakPhonemeHit } from '~/types/flaggedWord'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const db = useSupabase(event)

  const body = await readBody(event)
  const { word, displayWord, source, score, ipa, passageId, weakPhonemes } = body ?? {}

  if (typeof word !== 'string' || !word.trim()) {
    throw createError({ statusCode: 400, message: 'word is required.' })
  }
  if (source !== 'auto' && source !== 'manual') {
    throw createError({ statusCode: 400, message: 'source must be "auto" or "manual".' })
  }
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw createError({ statusCode: 400, message: 'score must be a number between 0 and 100.' })
  }

  const normalized = normalizeWord(word.trim())
  if (!normalized) throw createError({ statusCode: 400, message: 'word contains no valid characters.' })

  const { error } = await db.rpc('upsert_flagged_word', {
    p_user_id:       authUser.id,
    p_word:          normalized,
    p_display_word:  typeof displayWord === 'string' ? displayWord : word.trim(),
    p_score:         Math.round(score),
    p_source:        source,
    p_passage_id:    typeof passageId === 'string' ? passageId : null,
    p_ipa:           typeof ipa === 'string' ? ipa : null,
    p_weak_phonemes: Array.isArray(weakPhonemes) ? (weakPhonemes as WeakPhonemeHit[]) : null,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const { data: row } = await db
    .from('flagged_words')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('word', normalized)
    .single()

  return { word: row }
})
