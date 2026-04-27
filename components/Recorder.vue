<script setup lang="ts">
import { useRecorder } from '~/composables/useRecorder'

const emit = defineEmits<{
  (e: 'recorded', audioWav: Blob, videoBlob: Blob): void
}>()

const { state, error, result, start, stop, reset } = useRecorder()

const videoRef = ref<HTMLVideoElement | null>(null)
const playbackRef = ref<HTMLVideoElement | null>(null)
const playbackUrl = ref<string | null>(null)
let currentStream: MediaStream | null = null

// Preview live camera while recording
async function handleStart() {
  playbackUrl.value = null
  await start()

  // We need the live stream for the preview — re-acquire it from the video element trick
  // Actually getUserMedia is called inside useRecorder; we preview via a separate constraint-matched stream
  if (videoRef.value) {
    try {
      const previewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      videoRef.value.srcObject = previewStream
      currentStream = previewStream
    } catch {
      // Preview optional; ignore if denied
    }
  }
}

async function handleStop() {
  // Stop preview stream
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop())
    currentStream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null

  await stop()
}

watch(result, (r) => {
  if (!r) return
  playbackUrl.value = URL.createObjectURL(r.videoBlob)
  emit('recorded', r.audioWav, r.videoBlob)
})

function handleReset() {
  if (playbackUrl.value) {
    URL.revokeObjectURL(playbackUrl.value)
    playbackUrl.value = null
  }
  reset()
}
</script>

<template>
  <div class="recorder">
    <!-- Live preview while recording -->
    <div class="recorder__video-wrap">
      <video
        v-show="state === 'recording'"
        ref="videoRef"
        class="recorder__video"
        autoplay
        muted
        playsinline
      />
      <video
        v-show="state === 'stopped' && playbackUrl"
        ref="playbackRef"
        class="recorder__video"
        :src="playbackUrl ?? undefined"
        controls
        playsinline
      />
      <div v-if="state === 'idle'" class="recorder__placeholder">
        <span>Camera preview will appear here</span>
      </div>
    </div>

    <div class="recorder__controls">
      <button v-if="state === 'idle'" class="btn btn--primary" @click="handleStart">
        Start Recording
      </button>
      <button v-if="state === 'recording'" class="btn btn--danger" @click="handleStop">
        Stop Recording
      </button>
      <button v-if="state === 'stopped'" class="btn btn--secondary" @click="handleReset">
        Record Again
      </button>
    </div>

    <p v-if="state === 'recording'" class="recorder__status recorder__status--live">
      Recording…
    </p>
    <p v-if="error" class="recorder__status recorder__status--error">{{ error }}</p>
  </div>
</template>

<style scoped>
.recorder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recorder__video-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #111827;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recorder__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recorder__placeholder {
  color: #6b7280;
  font-size: 0.9rem;
}

.recorder__controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn--primary   { background: #2563eb; color: white; }
.btn--danger    { background: #dc2626; color: white; }
.btn--secondary { background: #e5e7eb; color: #1f2937; }

.recorder__status {
  text-align: center;
  font-size: 0.875rem;
}
.recorder__status--live  { color: #dc2626; font-weight: 600; }
.recorder__status--error { color: #b91c1c; }
</style>
