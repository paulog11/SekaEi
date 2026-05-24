import { useApi } from './useApi'

const MAX_CACHE = 20
const cache = new Map<string, Blob>()

function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim()
}

function evictIfNeeded() {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
}

export function useNativeAudio() {
  const { apiFetch } = useApi()

  async function fetch(text: string): Promise<Blob> {
    const key = normalizeText(text)
    const cached = cache.get(key)
    if (cached) {
      cache.delete(key)
      cache.set(key, cached)
      return cached
    }
    const blob = await apiFetch<Blob>('/api/native-audio', {
      method: 'POST',
      body: { text },
      responseType: 'blob' as const,
    })
    evictIfNeeded()
    cache.set(key, blob)
    return blob
  }

  function preload(text: string): void {
    fetch(text).catch(() => {})
  }

  return { fetch, preload }
}
