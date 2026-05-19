<script setup lang="ts">
import { useRecorder } from '~/composables/useRecorder'

const emit = defineEmits<{
  (e: 'recorded', audioWav: Blob): void
  (e: 'reset'): void
  (e: 'recording'): void
}>()

const { state, error, result, micLevel, duration, durationWarning, start, stop, reset } = useRecorder()

const formattedDuration = computed(() => {
  const m = Math.floor(duration.value / 60).toString().padStart(2, '0')
  const s = (duration.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

watch(result, (r) => {
  if (!r) return
  emit('recorded', r.audioWav)
})

watch(state, (s) => {
  if (s === 'recording') emit('recording')
})

function handleReset() {
  reset()
  emit('reset')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Mic level row -->
    <div v-if="state === 'recording'" class="flex items-center gap-3">
      <span :class="['text-sm font-semibold tabular-nums whitespace-nowrap', durationWarning ? 'text-amber-700' : 'text-ink-medium']">
        {{ formattedDuration }} / 00:45
      </span>
      <div class="flex-1 h-2 bg-border rounded overflow-hidden" aria-label="Microphone level">
        <div
          class="h-full bg-mic rounded transition-[width] duration-100 ease-out"
          :style="{ width: `${micLevel * 100}%` }"
        />
      </div>
      <span class="text-xs text-ink-light whitespace-nowrap">Mic</span>
    </div>

    <!-- Duration warning -->
    <p
      v-if="durationWarning && state === 'recording'"
      class="m-0 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
    >
      Less than 10 seconds remaining — recording will stop automatically.
    </p>

    <!-- Controls -->
    <div class="flex flex-col items-center gap-2">
      <button v-if="state === 'idle'"      class="btn-primary"   data-tutorial="start-recording" @click="start">Start Recording</button>
      <p v-if="state === 'idle'" class="m-0 text-xs text-ink-lighter">45 second limit</p>
      <button v-if="state === 'recording'" class="btn-danger"    data-tutorial="stop-recording"  @click="stop">Stop Recording</button>
      <button v-if="state === 'stopped'"   class="btn-secondary" @click="handleReset">Record Again</button>
    </div>

    <p v-if="error" class="text-center text-sm text-red-700 m-0">{{ error }}</p>
  </div>
</template>
