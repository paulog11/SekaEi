import { useWavEncoder } from './useWavEncoder'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export interface RecorderResult {
  videoBlob: Blob
  audioWav: Blob
}

export function useRecorder() {
  const state = ref<RecorderState>('idle')
  const error = ref<string | null>(null)
  const result = ref<RecorderResult | null>(null)

  let stream: MediaStream | null = null
  let mediaRecorder: MediaRecorder | null = null
  let audioContext: AudioContext | null = null
  let pcmChunks: Float32Array[] = []
  let videoChunks: Blob[] = []
  const { encodeWav } = useWavEncoder()

  async function start() {
    error.value = null
    result.value = null
    pcmChunks = []
    videoChunks = []

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch (e) {
      error.value = 'Camera/microphone permission denied.'
      return
    }

    // Video recording (webm) for local playback
    mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunks.push(e.data)
    }
    mediaRecorder.start(100)

    // PCM capture via AudioWorklet for Azure
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    await audioContext.audioWorklet.addModule('/worklets/pcm-capture.js')
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-capture-processor')

    workletNode.port.onmessage = (e: MessageEvent<{ type: string; data: Float32Array }>) => {
      if (e.data.type === 'pcm') {
        pcmChunks.push(e.data.data)
      }
    }

    source.connect(workletNode)
    // Don't connect workletNode to destination — we only want to capture, not play back

    state.value = 'recording'
  }

  async function stop() {
    if (!stream || !mediaRecorder || !audioContext) return

    // Stop video recorder
    await new Promise<void>((resolve) => {
      if (!mediaRecorder) return resolve()
      mediaRecorder.onstop = () => resolve()
      mediaRecorder.stop()
    })

    // Stop audio context
    await audioContext.close()

    // Stop all media tracks
    stream.getTracks().forEach(t => t.stop())

    const videoBlob = new Blob(videoChunks, { type: mediaRecorder.mimeType })
    const totalLength = pcmChunks.reduce((sum, c) => sum + c.length, 0)
    const allPcm = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of pcmChunks) {
      allPcm.set(chunk, offset)
      offset += chunk.length
    }

    const audioWav = encodeWav(allPcm, audioContext.sampleRate)
    result.value = { videoBlob, audioWav }
    state.value = 'stopped'

    stream = null
    mediaRecorder = null
    audioContext = null
  }

  function reset() {
    state.value = 'idle'
    result.value = null
    error.value = null
  }

  return { state, error, result, start, stop, reset }
}

function getSupportedMimeType(): string {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? ''
}
