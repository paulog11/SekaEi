/**
 * @fileoverview POST /api/native-pitch — returns a cached native pitch
 * contour as JSON, keyed by `(voice, text)`. Replaces the legacy MP3 disk
 * cache: each (voice, text) input deterministically produces the same TTS
 * audio and therefore the same pitch curve, so we cache the curve directly
 * and never persist audio bytes anywhere on disk.
 *
 * Cache hit: read JSON from `data/native-pitch-cache/<hash>.json`, return.
 * Cache miss: call Azure TTS in raw 16 kHz PCM, run pitchy server-side,
 * write JSON to cache (best-effort), return the series.
 */

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { synthesizeSpeechPcm, DEFAULT_VOICE } from '../utils/azure'
import { requireApprovedUser } from '../utils/approval'
import { extractPitchFromPcm16 } from '../utils/extractPitch'
import type { PitchSeries } from '../../types/pitch'

const inflight = new Map<string, number>()

function cacheDir(): string {
  return join(process.cwd(), 'data', 'native-pitch-cache')
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
    const cachePath = join(dir, `${hash}.json`)

    // Cache hit
    try {
      const cached = await fs.readFile(cachePath, 'utf8')
      setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
      return JSON.parse(cached) as PitchSeries
    } catch {
      // cache miss — fall through
    }

    // Cache miss: synthesize PCM and extract pitch server-side
    let series: PitchSeries
    try {
      const { pcm, sampleRate } = await synthesizeSpeechPcm(text, voice, config.azureSpeechKey, config.azureSpeechRegion)
      series = extractPitchFromPcm16(pcm, sampleRate)
    } catch (err) {
      console.error('[native-pitch] Azure/extraction error:', err)
      throw createError({ statusCode: 422, message: err instanceof Error ? err.message : 'Speech synthesis failed.' })
    }

    // Write to cache (best-effort — don't fail the response if write fails)
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(cachePath, JSON.stringify(series))
    } catch (err) {
      console.warn('[native-pitch] Failed to write cache:', err)
    }

    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return series
  } finally {
    const after = (inflight.get(user.id) ?? 1) - 1
    if (after <= 0) inflight.delete(user.id)
    else inflight.set(user.id, after)
  }
})
