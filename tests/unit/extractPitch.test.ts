import { describe, it, expect } from 'vitest'
import { extractPitchFromPcm16 } from '~/server/utils/extractPitch'

const SAMPLE_RATE = 16000

function sineToInt16Pcm(hz: number, durationSec: number): Buffer {
  const n = Math.floor(durationSec * SAMPLE_RATE)
  const buf = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) {
    const sample = Math.sin(2 * Math.PI * hz * (i / SAMPLE_RATE))
    // 0.5 amplitude so we stay well below clipping; * 32767 to Int16 range
    const int16 = Math.round(sample * 0.5 * 32767)
    buf.writeInt16LE(int16, i * 2)
  }
  return buf
}

function silenceInt16Pcm(durationSec: number): Buffer {
  return Buffer.alloc(Math.floor(durationSec * SAMPLE_RATE) * 2)
}

describe('extractPitchFromPcm16', () => {
  it('detects median Hz close to 220 from a 220 Hz sine wave', () => {
    const series = extractPitchFromPcm16(sineToInt16Pcm(220, 2))
    expect(series.medianHz).toBeGreaterThan(210)
    expect(series.medianHz).toBeLessThan(230)
    expect(series.samples.length).toBeGreaterThan(0)
    expect(series.durationSec).toBeCloseTo(2, 1)
  })

  it('returns empty samples and medianHz=0 for silence', () => {
    const series = extractPitchFromPcm16(silenceInt16Pcm(2))
    expect(series.samples).toHaveLength(0)
    expect(series.medianHz).toBe(0)
  })

  it('throws when given a non-16kHz sample rate', () => {
    expect(() => extractPitchFromPcm16(Buffer.alloc(2048 * 2), 44100)).toThrow(/16000/)
  })
})
