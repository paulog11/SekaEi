<script setup lang="ts">
import { useRecorder } from '~/composables/useRecorder'

const emit = defineEmits<{
  (e: 'recorded', audioWav: Blob, videoBlob: Blob): void
}>()

const { state, error, result, micLevel, duration, durationWarning, start, stop, reset } = useRecorder()

const videoRef = ref<HTMLVideoElement | null>(null)
const playbackRef = ref<HTMLVideoElement | null>(null)
const playbackUrl = ref<string | null>(null)
let currentStream: MediaStream | null = null

const formattedDuration = computed(() => {
  const m = Math.floor(duration.value / 60).toString().padStart(2, '0')
  const s = (duration.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// Preview live camera while recording
async function handleStart() {
  playbackUrl.value = null
  await start()

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

    <!-- Recording status bar: timer + mic level -->
    <div v-if="state === 'recording'" class="recorder__rec-info">
      <span :class="['recorder__timer', { 'recorder__timer--warn': durationWarning }]">
        {{ formattedDuration }} / 01:00
      </span>
      <div class="mic-meter" aria-label="Microphone level">
        <div class="mic-meter__fill" :style="{ width: `${micLevel * 100}%` }" />
      </div>
      <span class="mic-meter__label">Mic</span>
    </div>

    <p v-if="durationWarning && state === 'recording'" class="recorder__warn">
      Less than 10 seconds remaining — recording will stop automatically.
    </p>

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

.recorder__rec-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recorder__timer {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.recorder__timer--warn {
  color: #b45309;
}

.mic-meter {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.mic-meter__fill {
  height: 100%;
  background: #10b981;
  border-radius: 4px;
  transition: width 0.1s ease-out;
}

.mic-meter__label {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.recorder__warn {
  font-size: 0.8rem;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: 0;
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
.recorder__status--error { color: #b91c1c; }
</style>
