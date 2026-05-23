import { synthesizeSpeech, ALLOWED_VOICES, DEFAULT_VOICE } from '../utils/azure'
import { requireApprovedUser } from '../utils/approval'

const inflight = new Map<string, number>()

export default defineEventHandler(async (event) => {
  const user = await requireApprovedUser(event)

  const config = useRuntimeConfig()
  if (!config.azureSpeechKey || !config.azureSpeechRegion) {
    throw createError({
      statusCode: 500,
      message: 'Azure Speech credentials are not configured on the server.',
    })
  }

  const current = inflight.get(user.id) ?? 0
  if (current >= 5) {
    throw createError({ statusCode: 429, message: 'Too many simultaneous requests. Please wait.' })
  }
  inflight.set(user.id, current + 1)

  try {
    const body = await readBody(event)

    const rawText = typeof body?.text === 'string' ? body.text : ''
    const text = rawText
      .normalize('NFC')
      .replace(/[\x00-\x1F\x7F‎‏‪-‮⁦-⁩]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) {
      throw createError({ statusCode: 400, message: 'text must not be empty.' })
    }
    if (text.length > 2000) {
      throw createError({ statusCode: 400, message: 'text too long (max 2000 characters).' })
    }

    const rawVoice = typeof body?.voice === 'string' ? body.voice : ''
    const voice = (ALLOWED_VOICES as readonly string[]).includes(rawVoice) ? rawVoice : DEFAULT_VOICE

    try {
      const audioBuffer = await synthesizeSpeech(text, voice, config.azureSpeechKey, config.azureSpeechRegion)
      setHeader(event, 'Content-Type', 'audio/mpeg')
      setHeader(event, 'Cache-Control', 'private, max-age=86400')
      return audioBuffer
    } catch (err) {
      console.error('[synthesize] Azure error:', err)
      throw createError({
        statusCode: 422,
        message: err instanceof Error ? err.message : 'Speech synthesis failed.',
      })
    }
  } finally {
    const after = (inflight.get(user.id) ?? 1) - 1
    if (after <= 0) inflight.delete(user.id)
    else inflight.set(user.id, after)
  }
})
