import { useSupabase } from '../../utils/supabase'
import { requireApprovedUser } from '../../utils/approval'
import { PASSAGE_CATEGORIES } from '~/types/passages'

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)
  const body = await readBody(event)
  const { title, text, ipa, category } = body ?? {}

  if (typeof title !== 'string' || !title.trim()) {
    throw createError({ statusCode: 400, message: 'title is required.' })
  }
  if (typeof text !== 'string' || !text.trim()) {
    throw createError({ statusCode: 400, message: 'text is required.' })
  }
  if (text.trim().length > 300) {
    throw createError({ statusCode: 400, message: 'text too long (max 300 characters).' })
  }
  const resolvedCategory = category ?? 'custom'
  if (!PASSAGE_CATEGORIES.includes(resolvedCategory)) {
    throw createError({ statusCode: 400, message: 'invalid category.' })
  }

  const db = useSupabase(event)

  const { data, error } = await db
    .from('custom_passages')
    .insert({
      user_id: authUser.id,
      title: title.trim().slice(0, 120),
      text: text.trim(),
      ipa: ipa ?? null,
      category: resolvedCategory,
    })
    .select('id, title, text, ipa, category, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'A passage with this title already exists.' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return { passage: data }
})
