// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing the composable
// ---------------------------------------------------------------------------

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: mockApiFetch, getDeviceId: vi.fn() }),
}))

// Track the most recent Audio instance for event simulation
type MockAudio = {
  src: string
  onended: (() => void) | null
  onerror: (() => void) | null
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}
let latestAudio: MockAudio

const AudioMock = vi.fn().mockImplementation((): MockAudio => {
  latestAudio = {
    src: '',
    onended: null,
    onerror: null,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  }
  return latestAudio
})

vi.stubGlobal('Audio', AudioMock)
vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: vi.fn(),
})

const { useTextToSpeech } = await import('~/composables/useTextToSpeech')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_BLOB = new Blob(['fake-mp3'], { type: 'audio/mpeg' })

// Unique text counter so each test starts with a cache-cold key by default
let _counter = 0
function uniqueText() {
  return `Test audio text ${++_counter}`
}

beforeEach(() => {
  vi.clearAllMocks()
  AudioMock.mockImplementation(() => {
    latestAudio = {
      src: '',
      onended: null,
      onerror: null,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    }
    return latestAudio
  })
  mockApiFetch.mockResolvedValue(FAKE_BLOB)
  // Reset module audio state
  const { stop } = useTextToSpeech()
  stop()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTextToSpeech — play()', () => {
  it('calls apiFetch with the correct body', async () => {
    const { play } = useTextToSpeech()
    const text = uniqueText()
    await play(text)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/synthesize', expect.objectContaining({
      method: 'POST',
      body: { text, voice: 'en-US-AriaNeural' },
    }))
  })

  it('uses a custom voice when provided', async () => {
    const { play } = useTextToSpeech()
    const text = uniqueText()
    await play(text, { voice: 'en-US-GuyNeural' })
    expect(mockApiFetch).toHaveBeenCalledWith('/api/synthesize', expect.objectContaining({
      body: { text, voice: 'en-US-GuyNeural' },
    }))
  })

  it('creates an Audio element and calls play() on it', async () => {
    const { play } = useTextToSpeech()
    await play(uniqueText())
    expect(AudioMock).toHaveBeenCalledOnce()
    expect(latestAudio.play).toHaveBeenCalledOnce()
  })

  it('sets isPlaying to true during playback', async () => {
    const { play, isPlaying } = useTextToSpeech()
    // play() is async but audio.play() doesn't trigger onended synchronously
    const promise = play(uniqueText())
    // isPlaying should be set synchronously before the await on audio.play()
    // Actually the fetch is awaited first, so after awaiting play() isPlaying is true
    await promise
    expect(isPlaying.value).toBe(true)
  })

  it('sets playingKey to voice:text during playback', async () => {
    const { play, playingKey } = useTextToSpeech()
    const text = uniqueText()
    await play(text)
    expect(playingKey.value).toBe(`en-US-AriaNeural:${text}`)
  })
})

describe('useTextToSpeech — caching', () => {
  it('does not call apiFetch on a cache hit for the same text+voice', async () => {
    const { play } = useTextToSpeech()
    const text = `cache-test-${uniqueText()}`
    await play(text)
    await play(text) // same text, same voice
    expect(mockApiFetch).toHaveBeenCalledOnce()
  })

  it('calls apiFetch again for a different voice on the same text', async () => {
    const { play } = useTextToSpeech()
    const text = `voice-diff-${uniqueText()}`
    await play(text, { voice: 'en-US-AriaNeural' })
    await play(text, { voice: 'en-US-GuyNeural' })
    expect(mockApiFetch).toHaveBeenCalledTimes(2)
  })
})

describe('useTextToSpeech — stop()', () => {
  it('pauses current audio and resets state', async () => {
    const { play, stop, isPlaying, playingKey } = useTextToSpeech()
    await play(uniqueText())
    stop()
    expect(latestAudio.pause).toHaveBeenCalledOnce()
    expect(isPlaying.value).toBe(false)
    expect(playingKey.value).toBeNull()
  })
})

describe('useTextToSpeech — interruption', () => {
  it('pauses the previous audio when play() is called while already playing', async () => {
    const { play } = useTextToSpeech()
    await play(uniqueText())
    const firstAudio = latestAudio

    await play(uniqueText())

    expect(firstAudio.pause).toHaveBeenCalledOnce()
  })
})

describe('useTextToSpeech — onended callback', () => {
  it('resets isPlaying and playingKey when audio ends', async () => {
    const { play, isPlaying, playingKey } = useTextToSpeech()
    await play(uniqueText())
    expect(isPlaying.value).toBe(true)

    // Simulate audio ending
    latestAudio.onended?.()

    expect(isPlaying.value).toBe(false)
    expect(playingKey.value).toBeNull()
  })
})

describe('useTextToSpeech — error handling', () => {
  it('resets isPlaying and playingKey when apiFetch fails', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))
    const { play, isPlaying, playingKey } = useTextToSpeech()
    await play(uniqueText())
    expect(isPlaying.value).toBe(false)
    expect(playingKey.value).toBeNull()
  })

  it('does not throw to the caller when apiFetch fails', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))
    const { play } = useTextToSpeech()
    await expect(play(uniqueText())).resolves.toBeUndefined()
  })

  it('resets state when audio.play() rejects', async () => {
    AudioMock.mockImplementationOnce(() => {
      latestAudio = {
        src: '',
        onended: null,
        onerror: null,
        play: vi.fn().mockRejectedValueOnce(new Error('autoplay blocked')),
        pause: vi.fn(),
      }
      return latestAudio
    })
    const { play, isPlaying } = useTextToSpeech()
    await play(uniqueText())
    expect(isPlaying.value).toBe(false)
  })
})
