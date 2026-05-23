import { ref } from 'vue'
import { useApi } from './useApi'
import { useVoicePreference } from './useVoicePreference'

const MAX_CACHE = 50

// Module-level singletons: single audio context and shared reactive state across all callers
const cache = new Map<string, Blob>()
const isPlaying = ref(false)
const playingKey = ref<string | null>(null)
let audioEl: HTMLAudioElement | null = null
let currentObjectUrl: string | null = null

function evictIfNeeded() {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
}

function stopCurrent() {
  if (audioEl) {
    audioEl.pause()
    audioEl.src = ''
    audioEl = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
  isPlaying.value = false
  playingKey.value = null
}

export function useTextToSpeech() {
  const { apiFetch } = useApi()
  const { voice: preferredVoice } = useVoicePreference()

  async function play(text: string, opts?: { voice?: string }): Promise<void> {
    const voice = opts?.voice ?? preferredVoice.value
    const key = `${voice}:${text}`

    stopCurrent()

    isPlaying.value = true
    playingKey.value = key

    try {
      let blob = cache.get(key)
      if (!blob) {
        blob = await apiFetch<Blob>('/api/synthesize', {
          method: 'POST',
          body: { text, voice },
          responseType: 'blob' as const,
        })
        evictIfNeeded()
        cache.set(key, blob)
      } else {
        // Re-insert to mark as most-recently-used
        cache.delete(key)
        cache.set(key, blob)
      }

      const url = URL.createObjectURL(blob)
      currentObjectUrl = url
      audioEl = new Audio(url)

      audioEl.onended = () => {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
        if (playingKey.value === key) {
          isPlaying.value = false
          playingKey.value = null
        }
      }
      audioEl.onerror = () => {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
        isPlaying.value = false
        playingKey.value = null
      }

      await audioEl.play()
    } catch (err) {
      console.warn('[useTextToSpeech] playback failed:', err)
      isPlaying.value = false
      playingKey.value = null
    }
  }

  function stop() {
    stopCurrent()
  }

  return { play, stop, isPlaying, playingKey }
}
