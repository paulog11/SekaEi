/**
 * @fileoverview Microphone capture composable. Owns the
 * `getUserMedia → AudioContext(16 kHz) → AudioWorklet` pipeline and exposes a
 * simple `idle → recording → stopped` state machine. Hard caps recording at 60 s
 * (auto-stop) and emits a `durationWarning` flag at 50 s for the UI.
 */

import { ref } from 'vue'
import { useWavEncoder } from './useWavEncoder'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export interface RecorderResult {
  audioWav: Blob
}

const MAX_DURATION_S = 60
const WARN_DURATION_S = 50

/**
 * Microphone recorder with mic-level metering and auto-stop.
 *
 * On `stop()`, concatenates buffered Float32 PCM chunks and hands them to
 * `useWavEncoder` — `result.value.audioWav` is a 16 kHz mono WAV `Blob` ready
 * for POST to `/api/assess`. On permission denial or worklet load failure,
 * sets `error.value` and leaves the state at `idle`.
 */
export function useRecorder() {
  const state = ref<RecorderState>('idle')
  const error = ref<string | null>(null)
  const result = ref<RecorderResult | null>(null)
  const micLevel = ref(0)
  const duration = ref(0)
  const durationWarning = ref(false)

  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let levelTimer: ReturnType<typeof setInterval> | null = null
  let durationTimer: ReturnType<typeof setInterval> | null = null
  let autoStopTimer: ReturnType<typeof setTimeout> | null = null
  let pcmChunks: Float32Array[] = []
  const { encodeWav } = useWavEncoder()

  function clearTimers() {
    if (levelTimer !== null) { clearInterval(levelTimer); levelTimer = null }
    if (durationTimer !== null) { clearInterval(durationTimer); durationTimer = null }
    if (autoStopTimer !== null) { clearTimeout(autoStopTimer); autoStopTimer = null }
  }

  async function start() {
    error.value = null
    result.value = null
    pcmChunks = []
    duration.value = 0
    durationWarning.value = false
    micLevel.value = 0

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    } catch {
      error.value = 'Microphone permission denied.'
      return
    }

    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    try {
      await audioContext.audioWorklet.addModule('/worklets/pcm-capture.js')
    } catch {
      error.value = 'Could not initialise audio processor.'
      stream.getTracks().forEach(t => t.stop())
      await audioContext.close()
      stream = null
      audioContext = null
      return
    }
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-capture-processor')

    workletNode.port.onmessage = (e: MessageEvent<{ type: string; data: Float32Array }>) => {
      if (e.data.type === 'pcm') pcmChunks.push(e.data.data)
    }

    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    source.connect(workletNode)

    const freqData = new Uint8Array(analyser.frequencyBinCount)
    levelTimer = setInterval(() => {
      if (!analyser) return
      analyser.getByteFrequencyData(freqData)
      const rms = Math.sqrt(freqData.reduce((sum, v) => sum + v * v, 0) / freqData.length)
      micLevel.value = Math.min(rms / 128, 1)
    }, 100)

    durationTimer = setInterval(() => {
      duration.value += 1
      if (duration.value >= WARN_DURATION_S) durationWarning.value = true
    }, 1000)

    autoStopTimer = setTimeout(() => {
      stop()
    }, MAX_DURATION_S * 1000)

    state.value = 'recording'
  }

  async function stop() {
    if (!stream || !audioContext) return
    const ctx = audioContext
    const str = stream
    audioContext = null
    stream = null

    clearTimers()
    micLevel.value = 0

    await ctx.close()
    analyser = null

    str.getTracks().forEach(t => t.stop())

    const totalLength = pcmChunks.reduce((sum, c) => sum + c.length, 0)
    const allPcm = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of pcmChunks) {
      allPcm.set(chunk, offset)
      offset += chunk.length
    }

    const audioWav = encodeWav(allPcm, ctx.sampleRate)
    result.value = { audioWav }
    state.value = 'stopped'
  }

  function reset() {
    clearTimers()
    state.value = 'idle'
    result.value = null
    error.value = null
    micLevel.value = 0
    duration.value = 0
    durationWarning.value = false
  }

  return { state, error, result, micLevel, duration, durationWarning, start, stop, reset }
}
