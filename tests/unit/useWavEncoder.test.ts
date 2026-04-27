import { describe, it, expect } from 'vitest'
import { useWavEncoder } from '~/composables/useWavEncoder'

// Access private helpers via the module directly for lower-level tests
// We re-implement them here to avoid exporting internals
function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]))
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return out
}

function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer
  const ratio = fromRate / toRate
  const outLength = Math.ceil(buffer.length / ratio)
  const out = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    out[i] = buffer[Math.round(i * ratio)] ?? 0
  }
  return out
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer()
}

describe('floatTo16BitPCM', () => {
  it('converts +1.0 to 32767', () => {
    const result = floatTo16BitPCM(new Float32Array([1.0]))
    expect(result[0]).toBe(0x7fff)
  })

  it('converts -1.0 to -32768', () => {
    const result = floatTo16BitPCM(new Float32Array([-1.0]))
    expect(result[0]).toBe(-0x8000)
  })

  it('converts 0.0 to 0', () => {
    const result = floatTo16BitPCM(new Float32Array([0.0]))
    expect(result[0]).toBe(0)
  })

  it('clamps values above 1.0', () => {
    const result = floatTo16BitPCM(new Float32Array([1.5]))
    expect(result[0]).toBe(0x7fff)
  })

  it('clamps values below -1.0', () => {
    const result = floatTo16BitPCM(new Float32Array([-1.5]))
    expect(result[0]).toBe(-0x8000)
  })

  it('preserves array length', () => {
    const input = new Float32Array([0.1, 0.5, -0.3, -0.8])
    expect(floatTo16BitPCM(input)).toHaveLength(4)
  })
})

describe('downsample', () => {
  it('returns same reference when from and to rate are identical', () => {
    const input = new Float32Array([0.1, 0.2, 0.3])
    const result = downsample(input, 16000, 16000)
    expect(result).toBe(input)
  })

  it('48kHz → 16kHz produces ≈ 1/3 the samples', () => {
    const input = new Float32Array(48000)
    const result = downsample(input, 48000, 16000)
    expect(result.length).toBe(Math.ceil(48000 / 3))
  })

  it('44100Hz → 16kHz correct output length', () => {
    const input = new Float32Array(44100)
    const result = downsample(input, 44100, 16000)
    expect(result.length).toBe(Math.ceil(44100 / (44100 / 16000)))
  })

  it('preserves sample values at expected positions', () => {
    // With ratio 3, position 0 maps to input[0], position 1 maps to input[3]
    const input = new Float32Array([0.1, 0.0, 0.0, 0.9, 0.0, 0.0])
    const result = downsample(input, 48000, 16000)
    expect(result[0]).toBeCloseTo(0.1)
    expect(result[1]).toBeCloseTo(0.9)
  })
})

describe('encodeWav', () => {
  const { encodeWav } = useWavEncoder()

  it('returns a Blob with audio/wav type', () => {
    const blob = encodeWav(new Float32Array([0]), 16000)
    expect(blob.type).toBe('audio/wav')
  })

  it('WAV header is exactly 44 bytes before PCM data', async () => {
    const samples = new Float32Array(100)
    const blob = encodeWav(samples, 16000)
    // 44-byte header + 100 samples * 2 bytes each = 244
    expect(blob.size).toBe(44 + 100 * 2)
  })

  it('RIFF marker at bytes 0–3', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const bytes = new Uint8Array(buf, 0, 4)
    expect(String.fromCharCode(...bytes)).toBe('RIFF')
  })

  it('WAVE marker at bytes 8–11', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const bytes = new Uint8Array(buf, 8, 4)
    expect(String.fromCharCode(...bytes)).toBe('WAVE')
  })

  it('fmt  marker at bytes 12–15', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const bytes = new Uint8Array(buf, 12, 4)
    expect(String.fromCharCode(...bytes)).toBe('fmt ')
  })

  it('data marker at bytes 36–39', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const bytes = new Uint8Array(buf, 36, 4)
    expect(String.fromCharCode(...bytes)).toBe('data')
  })

  it('sample rate header is always 16000 regardless of input rate', async () => {
    const blob = encodeWav(new Float32Array(100), 48000)
    const buf = await blobToArrayBuffer(blob)
    const view = new DataView(buf)
    expect(view.getUint32(24, true)).toBe(16000)
  })

  it('channel count is 1 (mono)', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const view = new DataView(buf)
    expect(view.getUint16(22, true)).toBe(1)
  })

  it('bits per sample is 16', async () => {
    const blob = encodeWav(new Float32Array(10), 16000)
    const buf = await blobToArrayBuffer(blob)
    const view = new DataView(buf)
    expect(view.getUint16(34, true)).toBe(16)
  })

  it('produces valid minimal WAV from empty Float32Array', async () => {
    const blob = encodeWav(new Float32Array(0), 16000)
    expect(blob.size).toBe(44) // header only
    const buf = await blobToArrayBuffer(blob)
    const bytes = new Uint8Array(buf, 0, 4)
    expect(String.fromCharCode(...bytes)).toBe('RIFF')
  })

  it('downsamples 48kHz input so header still reports 16000', async () => {
    // 480 samples at 48kHz → 160 at 16kHz → 44 + 160*2 = 364 bytes
    const blob = encodeWav(new Float32Array(480), 48000)
    const buf = await blobToArrayBuffer(blob)
    const view = new DataView(buf)
    expect(view.getUint32(24, true)).toBe(16000)
    expect(blob.size).toBe(44 + 160 * 2)
  })

  it('large input (10s at 16kHz) encodes in under 100ms', () => {
    const samples = new Float32Array(160000).fill(0.5)
    const start = performance.now()
    encodeWav(samples, 16000)
    expect(performance.now() - start).toBeLessThan(100)
  })
})
