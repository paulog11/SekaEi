// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── AudioContext mock ──────────────────────────────────────────────────────────
// `usePitchContour` has a module-level singleton (sharedCtx). We intercept the
// AudioContext constructor to keep a mutable reference. Between tests we mark
// state='closed' so the composable creates a fresh instance on the next call.

type MockCtx = {
  state: string
  setDecode(impl: (ab: ArrayBuffer) => Promise<AudioBuffer>): void
  decodeAudioData(ab: ArrayBuffer): Promise<AudioBuffer>
}

let activeCtx: MockCtx | null = null

vi.stubGlobal('AudioContext', vi.fn(() => {
  let _decode: (ab: ArrayBuffer) => Promise<AudioBuffer> =
    () => Promise.reject(new Error('decodeAudioData not configured'))
  activeCtx = {
    state: 'running',
    setDecode(impl) { _decode = impl },
    decodeAudioData(ab) { return _decode(ab) },
  }
  return activeCtx
}))

// Import AFTER stub so the composable picks it up on first AudioContext creation
import { usePitchContour } from '~/composables/usePitchContour'

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeSineBuffer(hz: number, durationSec: number, sampleRate = 16000): AudioBuffer {
  const n = Math.floor(durationSec * sampleRate)
  const samples = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    samples[i] = Math.sin(2 * Math.PI * hz * (i / sampleRate))
  }
  return {
    sampleRate,
    length: n,
    duration: n / sampleRate,
    numberOfChannels: 1,
    getChannelData: () => samples,
  } as unknown as AudioBuffer
}

function makeBlob(): Blob {
  return new Blob([new Uint8Array(4)])
}

beforeEach(() => {
  // Force the composable to create a new AudioContext instance each test
  if (activeCtx) activeCtx.state = 'closed'
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('usePitchContour', () => {
  it('detects correct median Hz from a 220 Hz sine wave', async () => {
    const { extract } = usePitchContour()
    // Set up decode AFTER extract is called (ctx is created lazily on first extract)
    // so we need to set it just before the call
    const buf = makeSineBuffer(220, 2)
    // The context is created on first call — set up via the stub
    vi.mocked(AudioContext as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      let _decode: (ab: ArrayBuffer) => Promise<AudioBuffer> = () => Promise.resolve(buf)
      activeCtx = {
        state: 'running',
        setDecode(impl) { _decode = impl },
        decodeAudioData(ab) { return _decode(ab) },
      }
      return activeCtx
    })

    const series = await extract(makeBlob())

    expect(series.medianHz).toBeGreaterThan(210)
    expect(series.medianHz).toBeLessThan(230)
    expect(series.samples.length).toBeGreaterThan(0)
  })

  it('returns empty samples for pure silence', async () => {
    const silence = makeSineBuffer(0, 2) // all zeros — no sine wave
    vi.mocked(AudioContext as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      activeCtx = {
        state: 'running',
        setDecode() {},
        decodeAudioData: () => Promise.resolve(silence),
      }
      return activeCtx
    })

    const { extract } = usePitchContour()
    const series = await extract(makeBlob())

    expect(series.samples).toHaveLength(0)
    expect(series.medianHz).toBe(0)
  })

  it('rejects when decodeAudioData throws', async () => {
    vi.mocked(AudioContext as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      activeCtx = {
        state: 'running',
        setDecode() {},
        decodeAudioData: () => Promise.reject(new Error('decode failed')),
      }
      return activeCtx
    })

    const { extract } = usePitchContour()
    await expect(extract(makeBlob())).rejects.toThrow('decode failed')
  })

  it('downsamples 44.1 kHz audio and still detects correct median Hz', async () => {
    const buf = makeSineBuffer(220, 1, 44100)
    vi.mocked(AudioContext as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      activeCtx = {
        state: 'running',
        setDecode() {},
        decodeAudioData: () => Promise.resolve(buf),
      }
      return activeCtx
    })

    const { extract } = usePitchContour()
    const series = await extract(makeBlob())

    expect(series.medianHz).toBeGreaterThan(200)
    expect(series.medianHz).toBeLessThan(240)
  })
})
