/**
 * @fileoverview WAV-encoder for the recorder pipeline. Downsamples to 16 kHz
 * mono 16-bit PCM (Azure Speech's expected format) and writes a 44-byte
 * RIFF/WAVE header. The header is stripped server-side before pushing to the
 * Azure SDK (which is told the format explicitly).
 */

const TARGET_SAMPLE_RATE = 16000

/**
 * Encodes accumulated Float32 PCM samples (from the AudioWorklet) into a
 * 16 kHz mono 16-bit PCM WAV Blob suitable for Azure Speech.
 */
export function useWavEncoder() {
  function encodeWav(samples: Float32Array, sampleRate: number): Blob {
    const pcm = sampleRate === TARGET_SAMPLE_RATE
      ? samples
      : downsample(samples, sampleRate, TARGET_SAMPLE_RATE)

    const int16 = floatTo16BitPCM(pcm)
    const buffer = new ArrayBuffer(44 + int16.byteLength)
    const view = new DataView(buffer)

    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + int16.byteLength, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)           // PCM chunk size
    view.setUint16(20, 1, true)            // PCM format
    view.setUint16(22, 1, true)            // mono
    view.setUint32(24, TARGET_SAMPLE_RATE, true)
    view.setUint32(28, TARGET_SAMPLE_RATE * 2, true) // byte rate
    view.setUint16(32, 2, true)            // block align
    view.setUint16(34, 16, true)           // bits per sample
    writeString(view, 36, 'data')
    view.setUint32(40, int16.byteLength, true)

    new Uint8Array(buffer, 44).set(new Uint8Array(int16.buffer))
    return new Blob([buffer], { type: 'audio/wav' })
  }

  return { encodeWav }
}

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

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
