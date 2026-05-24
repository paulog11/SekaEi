// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// `useNativeAudio` uses a module-level cache Map. We reset modules before each
// test to get a fresh cache, then dynamically import the composable.

const apiFetchMock = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: apiFetchMock }),
}))

const fakeBlob = new Blob(['mp3'], { type: 'audio/mpeg' })
const TEXT = 'Hello world'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  apiFetchMock.mockResolvedValue(fakeBlob)
})

async function getComposable() {
  const mod = await import('~/composables/useNativeAudio')
  return mod.useNativeAudio()
}

describe('useNativeAudio', () => {
  it('calls /api/native-audio with POST and returns blob', async () => {
    const { fetch } = await getComposable()
    const result = await fetch(TEXT)

    expect(apiFetchMock).toHaveBeenCalledWith('/api/native-audio', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ text: TEXT }),
    }))
    expect(result).toBe(fakeBlob)
  })

  it('returns cached blob on second call without re-fetching', async () => {
    const { fetch } = await getComposable()
    await fetch(TEXT)
    await fetch(TEXT)

    expect(apiFetchMock).toHaveBeenCalledOnce()
  })

  it('preload does not throw when fetch rejects', async () => {
    apiFetchMock.mockRejectedValue(new Error('Network error'))
    const { preload } = await getComposable()

    preload(TEXT)
    // Allow the rejected promise to settle without throwing
    await new Promise(r => setTimeout(r, 10))
    // No assertion — just verifying no unhandled rejection
  })

  it('normalizes whitespace in cache key', async () => {
    const { fetch } = await getComposable()
    await fetch('  Hello   world  ')
    await fetch(TEXT) // same text after normalization

    expect(apiFetchMock).toHaveBeenCalledOnce()
  })
})
