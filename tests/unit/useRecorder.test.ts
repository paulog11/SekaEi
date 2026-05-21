// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRecorder } from '~/composables/useRecorder'

// ---------------------------------------------------------------------------
// Browser API mocks
// ---------------------------------------------------------------------------

function makeMockTrack() {
  return { stop: vi.fn(), kind: 'audio' }
}

function makeMockStream(tracks = [makeMockTrack()]) {
  return {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  } as unknown as MediaStream
}

class MockAudioWorkletNode {
  port = { onmessage: null as ((e: MessageEvent) => void) | null }
  constructor() {}
  connect = vi.fn()
}

class MockAudioContext {
  sampleRate = 48000
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  }
  createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() })
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 512,
    frequencyBinCount: 256,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
  })
  close = vi.fn().mockResolvedValue(undefined)
}

// ---------------------------------------------------------------------------
// Setup globals before each test
// ---------------------------------------------------------------------------

let mockStream: ReturnType<typeof makeMockStream>
let mockAudioContext: MockAudioContext
let mockWorkletNode: MockAudioWorkletNode
const mockGetUserMedia = vi.fn()

beforeEach(() => {
  mockStream = makeMockStream()
  mockAudioContext = new MockAudioContext()
  mockWorkletNode = new MockAudioWorkletNode()

  mockGetUserMedia.mockResolvedValue(mockStream as unknown as MediaStream)

  vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))
  vi.stubGlobal('AudioWorkletNode', vi.fn(() => mockWorkletNode))

  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    mediaDevices: { getUserMedia: mockGetUserMedia },
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRecorder — initial state', () => {
  it('starts idle with null error and result', () => {
    const { state, error, result } = useRecorder()
    expect(state.value).toBe('idle')
    expect(error.value).toBeNull()
    expect(result.value).toBeNull()
  })
})

describe('useRecorder — reset()', () => {
  it('clears state, error, and result', async () => {
    const { state, error, result, reset } = useRecorder()
    ;(state as { value: string }).value = 'stopped'
    ;(error as { value: string }).value = 'some error'
    reset()
    expect(state.value).toBe('idle')
    expect(error.value).toBeNull()
    expect(result.value).toBeNull()
  })
})

describe('useRecorder — start() with permission denied', () => {
  it('sets error and keeps state idle', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
    const { state, error, start } = useRecorder()
    await start()
    expect(state.value).toBe('idle')
    expect(error.value).toBe('Microphone permission denied.')
  })
})

describe('useRecorder — start() → stop() lifecycle', () => {
  it('transitions idle → recording → stopped', async () => {
    const { state, stop, start } = useRecorder()
    await start()
    expect(state.value).toBe('recording')
    await stop()
    expect(state.value).toBe('stopped')
  })

  it('requests audio-only from getUserMedia', async () => {
    const { start, stop } = useRecorder()
    await start()
    await stop()
    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: false, audio: true })
  })

  it('result has audioWav after stop()', async () => {
    const { result, start, stop } = useRecorder()

    await start()

    const pcm = new Float32Array([0.1, 0.2, 0.3, 0.4])
    mockWorkletNode.port.onmessage?.({
      data: { type: 'pcm', data: pcm },
    } as unknown as MessageEvent)

    await stop()

    expect(result.value).not.toBeNull()
    expect(result.value!.audioWav).toBeInstanceOf(Blob)
    expect(result.value!.audioWav.type).toBe('audio/wav')
  })

  it('concatenates multiple PCM chunks before encoding', async () => {
    const { result, start, stop } = useRecorder()
    await start()

    const chunk1 = new Float32Array([0.1, 0.2])
    const chunk2 = new Float32Array([0.3, 0.4])
    mockWorkletNode.port.onmessage?.({ data: { type: 'pcm', data: chunk1 } } as unknown as MessageEvent)
    mockWorkletNode.port.onmessage?.({ data: { type: 'pcm', data: chunk2 } } as unknown as MessageEvent)

    await stop()

    // AudioContext mock sampleRate = 48000, downsampled to 16000 (ratio 3):
    // ceil(4 / 3) = 2 output samples → 44-byte header + 2 * 2 bytes = 48
    expect(result.value!.audioWav.size).toBe(44 + 2 * 2)
  })

  it('stops all media tracks on stop()', async () => {
    const track = makeMockTrack()
    mockStream = makeMockStream([track])
    mockGetUserMedia.mockResolvedValue(mockStream as unknown as MediaStream)

    const { start, stop } = useRecorder()
    await start()
    await stop()

    expect(track.stop).toHaveBeenCalled()
  })
})
