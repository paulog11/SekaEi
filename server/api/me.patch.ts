import { useSupabase } from '../utils/supabase'
import { requireApprovedUser } from '../utils/approval'

const DISPLAY_NAME_MAX = 30
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_.\- ]+$/u
const UNIVERSITY_MAX = 100

// Common English profanity — extend as needed
const BAD_WORDS = new Set([
  'ass', 'asshole', 'bastard', 'bitch', 'bollocks', 'bullshit', 'cock',
  'crap', 'cuck', 'cunt', 'damn', 'dick', 'dyke', 'fag', 'faggot', 'fuck',
  'fucker', 'fucking', 'goddamn', 'homo', 'jackass', 'jerk', 'kike',
  'motherfucker', 'nigga', 'nigger', 'piss', 'prick', 'pussy', 'retard',
  'shit', 'shithead', 'slut', 'spic', 'twat', 'wanker', 'whore',
])

function containsBadWord(name: string): boolean {
  const lower = name.toLowerCase().replace(/[^a-z]/g, '')
  return [...BAD_WORDS].some(w => lower.includes(w))
}

export default defineEventHandler(async (event) => {
  const authUser = await requireApprovedUser(event)

  const body = await readBody(event)
  const updates: Record<string, string> = {}

  if ('displayName' in body) {
    const raw = body.displayName
    if (typeof raw !== 'string') {
      throw createError({ statusCode: 400, message: 'displayName must be a string.' })
    }
    const name = raw.trim()
    if (name.length === 0) throw createError({ statusCode: 400, message: 'Display name cannot be empty.' })
    if (name.length > DISPLAY_NAME_MAX) throw createError({ statusCode: 400, message: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.` })
    if (!DISPLAY_NAME_PATTERN.test(name)) throw createError({ statusCode: 400, message: 'Display name may only contain letters, numbers, spaces, hyphens, underscores, and periods.' })
    if (containsBadWord(name)) throw createError({ statusCode: 400, message: 'Display name contains disallowed words.' })
    updates.display_name = name
  }

  if ('university' in body) {
    const raw = body.university
    if (typeof raw !== 'string') throw createError({ statusCode: 400, message: 'university must be a string.' })
    const uni = raw.trim()
    if (uni.length > UNIVERSITY_MAX) throw createError({ statusCode: 400, message: `University must be ${UNIVERSITY_MAX} characters or fewer.` })
    updates.university = uni
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update.' })
  }

  const db = useSupabase(event)
  const { error } = await db.from('profiles').update(updates).eq('id', authUser.id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    ...(updates.display_name !== undefined ? { displayName: updates.display_name } : {}),
    ...(updates.university !== undefined ? { university: updates.university } : {}),
  }
})
