/**
 * @fileoverview Server-side pitch extraction. Mirrors the client-side
 * {@link composables/usePitchContour.ts} implementation so live and review
 * charts use identical extraction parameters. Operates on raw 16 kHz Int16
 * mono PCM (as returned by {@link synthesizeSpeechPcm}), so no MP3 decoder
 * is required on the server.
 */

import { PitchDetector } from 'pitchy'
import type { PitchSample, PitchSeries } from '../../types/pitch'

const FRAME_SIZE = 2048
const HOP_SIZE = 512
const TARGET_RATE = 16000
const MIN_HZ = 70
const MAX_HZ = 500
const MIN_CLARITY = 0.85

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function int16PcmToFloat32(pcm: Buffer): Float32Array {
  const sampleCount = Math.floor(pcm.length / 2)
  const out = new Float32Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    out[i] = pcm.readInt16LE(i * 2) / 32768
  }
  return out
}

/**
 * Extracts a PitchSeries from raw 16 kHz 16-bit mono PCM bytes.
 * Currently only supports the native (target) sample rate — Azure TTS is
 * requested in this format, so no downsampling path is needed here.
 */
export function extractPitchFromPcm16(pcm: Buffer, sampleRate: number = TARGET_RATE): PitchSeries {
  if (sampleRate !== TARGET_RATE) {
    throw new Error(`extractPitchFromPcm16 expects ${TARGET_RATE} Hz PCM, got ${sampleRate} Hz`)
  }

  const samples = int16PcmToFloat32(pcm)
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
