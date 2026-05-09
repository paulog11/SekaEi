import { runPronunciationAssessment } from '../utils/azure'
import { useSupabaseUser, useSupabase } from '../utils/supabase'

const DAILY_LIMIT = 60
const inflight = new Map<string, number>()

export default defineEventHandler(async (event) => {
  const user = await useSupabaseUser(event)

  const config = useRuntimeConfig()
  if (!config.azureSpeechKey || !config.azureSpeechRegion) {
    throw createError({
      statusCode: 500,
      message: 'Azure Speech credentials are not configured on the server.',
    })
  }

  // Per-user concurrency cap (max 3 simultaneous calls per user)
  const current = inflight.get(user.id) ?? 0
  if (current >= 3) {
    throw createError({ statusCode: 429, message: 'Too many simultaneous requests. Please wait.' })
  }
  inflight.set(user.id, current + 1)

  try {
    // Per-user daily quota via atomic increment
    const db = useSupabase()
    const today = new Date().toISOString().slice(0, 10)
    const { data: usage, error: usageErr } = await db.rpc('increment_assess_usage', {
      p_user_id: user.id,
      p_day: today,
    })

    if (usageErr) {
      console.error('[assess] usage increment error:', usageErr)
    } else if (typeof usage === 'number' && usage > DAILY_LIMIT) {
      throw createError({ statusCode: 429, message: `Daily limit of ${DAILY_LIMIT} assessments reached. Try again tomorrow.` })
    }

    const parts = await readMultipartFormData(event)
    if (!parts) {
      throw createError({ statusCode: 400, message: 'Multipart form data required.' })
    }

    const audioPart = parts.find(p => p.name === 'audio')
    const textPart = parts.find(p => p.name === 'referenceText')

    if (!audioPart?.data) {
      throw createError({ statusCode: 400, message: 'Missing audio field.' })
    }
    if (audioPart.data.length > 4 * 1024 * 1024) {
      throw createError({ statusCode: 413, message: 'Audio file too large (max 4 MB).' })
    }
    if (audioPart.data.length < 1024) {
      throw createError({ statusCode: 400, message: 'Audio too short.' })
    }
    if (audioPart.type && !audioPart.type.startsWith('audio/')) {
      throw createError({ statusCode: 415, message: 'Unsupported audio type.' })
    }
    const head = audioPart.data.subarray(0, 12)
    if (
      head.length < 12 ||
      head.toString('ascii', 0, 4) !== 'RIFF' ||
      head.toString('ascii', 8, 12) !== 'WAVE'
    ) {
      throw createError({ statusCode: 400, message: 'Invalid WAV.' })
    }
    if (!textPart?.data) {
      throw createError({ statusCode: 400, message: 'Missing referenceText field.' })
    }

    const referenceText = textPart.data.toString('utf-8')
      .normalize('NFC')
      .replace(/[\x00-\x1F\x7F‎‏‪-‮⁦-⁩]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!referenceText) {
      throw createError({ statusCode: 400, message: 'referenceText must not be empty.' })
    }
    if (referenceText.length > 2000) {
      throw createError({ statusCode: 400, message: 'referenceText too long (max 2000 characters).' })
    }

    try {
      const result = await runPronunciationAssessment(
        audioPart.data,
        referenceText,
        config.azureSpeechKey,
        config.azureSpeechRegion,
      )
      return result
    } catch (err) {
      console.error('[assess] Azure error:', err)
      throw createError({
        statusCode: 422,
        message: err instanceof Error ? err.message : 'Assessment failed.',
      })
    }
  } finally {
    const after = (inflight.get(user.id) ?? 1) - 1
    if (after <= 0) inflight.delete(user.id)
    else inflight.set(user.id, after)
  }
})
