import { PitchDetector } from 'pitchy'
import type { PitchSeries, PitchSample } from '~/types/pitch'

const FRAME_SIZE = 2048
const HOP_SIZE = 512
const TARGET_RATE = 16000
const MIN_HZ = 70
const MAX_HZ = 500
const MIN_CLARITY = 0.85

let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext()
  }
  return sharedCtx
}

function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer
  const ratio = fromRate / toRate
  const outLength = Math.floor(buffer.length / ratio)
  const out = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), buffer.length)
    let sum = 0
    for (let j = start; j < end; j++) sum += buffer[j]
    out[i] = sum / (end - start)
  }
  return out
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function usePitchContour() {
  async function extract(blob: Blob): Promise<PitchSeries> {
    const ctx = getAudioContext()
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

    const raw = audioBuffer.getChannelData(0)
    const samples = audioBuffer.sampleRate === TARGET_RATE
      ? raw
      : downsample(raw, audioBuffer.sampleRate, TARGET_RATE)

    const durationSec = samples.length / TARGET_RATE
    const detector = PitchDetector.forFloat32Array(FRAME_SIZE)
    const frame = new Float32Array(FRAME_SIZE)
    const pitchSamples: PitchSample[] = []

    for (let offset = 0; offset + FRAME_SIZE <= samples.length; offset += HOP_SIZE) {
      frame.set(samples.subarray(offset, offset + FRAME_SIZE))
      const [pitch, clarity] = detector.findPitch(frame, TARGET_RATE)
      if (clarity >= MIN_CLARITY && pitch >= MIN_HZ && pitch <= MAX_HZ) {
        pitchSamples.push({ t: offset / TARGET_RATE, hz: pitch })
      }
    }

    const medianHz = median(pitchSamples.map(s => s.hz))

    return { samples: pitchSamples, durationSec, medianHz }
  }

  return { extract }
}
