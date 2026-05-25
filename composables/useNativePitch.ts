/**
 * @fileoverview Client cache for native (TTS) pitch contours. Calls
 * `/api/native-pitch`, which returns a PitchSeries JSON keyed by
 * `(voice, text)`. No audio Blobs are involved — the server extracts
 * pitch from raw PCM so the client only ever sees the small JSON curve.
 */

import type { PitchSeries } from '~/types/pitch'
import { useApi } from './useApi'

const MAX_CACHE = 20
const cache = new Map<string, PitchSeries>()

function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim()
}

function evictIfNeeded() {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
}

export function useNativePitch() {
  const { apiFetch } = useApi()

  async function fetch(text: string): Promise<PitchSeries> {
    const key = normalizeText(text)
    const cached = cache.get(key)
    if (cached) {
      cache.delete(key)
      cache.set(key, cached)
      return cached
    }
    const series = await apiFetch<PitchSeries>('/api/native-pitch', {
      method: 'POST',
      body: { text },
    })
    evictIfNeeded()
    cache.set(key, series)
    return series
  }

  function preload(text: string): void {
    fetch(text).catch(() => {})
  }

  return { fetch, preload }
}
