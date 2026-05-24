import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { synthesizeSpeech, DEFAULT_VOICE } from '../utils/azure'
import { requireApprovedUser } from '../utils/approval'

const inflight = new Map<string, number>()

function cacheDir(): string {
  return join(process.cwd(), 'data', 'tts-cache')
}

function hashKey(voice: string, text: string): string {
  return createHash('sha256').update(`${voice}::${text}`).digest('hex')
}

export default defineEventHandler(async (event) => {
  const user = await requireApprovedUser(event)

  const config = useRuntimeConfig()
  if (!config.azureSpeechKey || !config.azureSpeechRegion) {
    throw createError({ statusCode: 500, message: 'Azure Speech credentials are not configured on the server.' })
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

    if (!text) throw createError({ statusCode: 400, message: 'text must not be empty.' })
    if (text.length > 2000) throw createError({ statusCode: 400, message: 'text too long (max 2000 characters).' })

    const voice = DEFAULT_VOICE
    const hash = hashKey(voice, text)
    const dir = cacheDir()
    const cachePath = join(dir, `${hash}.mp3`)

    // Cache hit
    try {
      const cached = await fs.readFile(cachePath)
      setHeader(event, 'Content-Type', 'audio/mpeg')
      setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
      return cached
    } catch {
      // cache miss — fall through
    }

    // Cache miss: synthesize and store
    let audioBuffer: Buffer
    try {
      audioBuffer = await synthesizeSpeech(text, voice, config.azureSpeechKey, config.azureSpeechRegion)
    } catch (err) {
      console.error('[native-audio] Azure error:', err)
      throw createError({ statusCode: 422, message: err instanceof Error ? err.message : 'Speech synthesis failed.' })
    }

    // Write to cache (best-effort — don't fail the response if write fails)
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(cachePath, audioBuffer)
    } catch (err) {
      console.warn('[native-audio] Failed to write cache:', err)
    }

    setHeader(event, 'Content-Type', 'audio/mpeg')
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return audioBuffer
  } finally {
    const after = (inflight.get(user.id) ?? 1) - 1
    if (after <= 0) inflight.delete(user.id)
    else inflight.set(user.id, after)
  }
})
