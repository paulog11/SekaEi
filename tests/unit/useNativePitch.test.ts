// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const apiFetchMock = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: apiFetchMock }),
}))

const fakeSeries = {
  samples: [{ t: 0, hz: 220 }],
  durationSec: 1,
  medianHz: 220,
}
const TEXT = 'Hello world'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  apiFetchMock.mockResolvedValue(fakeSeries)
})

async function getComposable() {
  const mod = await import('~/composables/useNativePitch')
  return mod.useNativePitch()
}

describe('useNativePitch', () => {
  it('calls /api/native-pitch with POST and returns PitchSeries', async () => {
    const { fetch } = await getComposable()
    const result = await fetch(TEXT)

    expect(apiFetchMock).toHaveBeenCalledWith('/api/native-pitch', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ text: TEXT }),
    }))
    expect(result).toBe(fakeSeries)
  })

  it('returns cached series on second call without re-fetching', async () => {
    const { fetch } = await getComposable()
    await fetch(TEXT)
    await fetch(TEXT)

    expect(apiFetchMock).toHaveBeenCalledOnce()
  })

  it('preload does not throw when fetch rejects', async () => {
    apiFetchMock.mockRejectedValue(new Error('Network error'))
    const { preload } = await getComposable()

    preload(TEXT)
    await new Promise(r => setTimeout(r, 10))
  })

  it('normalizes whitespace in cache key', async () => {
    const { fetch } = await getComposable()
    await fetch('  Hello   world  ')
    await fetch(TEXT)

    expect(apiFetchMock).toHaveBeenCalledOnce()
  })
})
