import { ref } from 'vue'
import { useWavEncoder } from './useWavEncoder'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export interface RecorderResult {
  audioWav: Blob
}

const MAX_DURATION_S = 45
const WARN_DURATION_S = 35

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

    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    await audioContext.audioWorklet.addModule('/worklets/pcm-capture.js')
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

    clearTimers()
    micLevel.value = 0

    await audioContext.close()
    analyser = null

    stream.getTracks().forEach(t => t.stop())

    const totalLength = pcmChunks.reduce((sum, c) => sum + c.length, 0)
    const allPcm = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of pcmChunks) {
      allPcm.set(chunk, offset)
      offset += chunk.length
    }

    const audioWav = encodeWav(allPcm, audioContext.sampleRate)
    result.value = { audioWav }
    state.value = 'stopped'

    stream = null
    audioContext = null
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
