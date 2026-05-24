import { useSupabase, useSupabaseUser } from '../utils/supabase'

// Simple per-user rate limit: max 10 redeem attempts per hour in memory
const attempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(userId: string) {
  const now = Date.now()
  const entry = attempts.get(userId)
  if (!entry || now > entry.resetAt) {
    attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  if (entry.count >= RATE_LIMIT) {
    throw createError({ statusCode: 429, message: 'Too many attempts. Try again later.' })
  }
  entry.count++
}

const ERROR_MESSAGES: Record<string, string> = {
  code_not_found: 'That code was not found. Check for typos.',
  code_expired:   'That code has expired.',
  code_exhausted: 'That code has already been fully redeemed.',
}

export default defineEventHandler(async (event) => {
  const user = await useSupabaseUser(event)
  checkRateLimit(user.id)

  const body = await readBody(event)
  const raw = typeof body?.code === 'string' ? body.code : ''
  const code = raw.trim().toUpperCase().slice(0, 32)

  if (!code) {
    throw createError({ statusCode: 400, message: 'code is required.' })
  }

  const db = useSupabase(event)
  const { data, error } = await db.rpc('redeem_invite_code', {
    p_code: code,
    p_user_id: user.id,
  })

  if (error) {
    const key = error.message?.match(/code_not_found|code_expired|code_exhausted/)?.[0]
    const message = key ? ERROR_MESSAGES[key] : 'Code redemption failed.'
    throw createError({ statusCode: 400, message })
  }

  // data === false means user was already attendee (idempotent)
  return { success: true, alreadyAttendee: data === false, tier: 'attendee' }
})
