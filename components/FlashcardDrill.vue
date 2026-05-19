<script setup lang="ts">
import { ref } from 'vue'
import type { FlaggedWord, FlagWordPayload } from '~/types/flaggedWord'
import type { AssessmentResult } from '~/types/assessment'
import { useApi } from '~/composables/useApi'

const props = defineProps<{ word: FlaggedWord }>()
const emit = defineEmits<{
  (e: 'scored', word: FlaggedWord, result: AssessmentResult): void
  (e: 'next'): void
}>()

const { apiFetch } = useApi()

const audioWav = ref<Blob | null>(null)
const result = ref<AssessmentResult | null>(null)
const assessing = ref(false)
const assessError = ref<string | null>(null)

function onRecorded(wav: Blob) {
  audioWav.value = wav
  result.value = null
  assessError.value = null
}

function onReset() {
  audioWav.value = null
  result.value = null
  assessError.value = null
}

async function assess() {
  if (!audioWav.value) return
  assessing.value = true
  assessError.value = null
  try {
    const form = new FormData()
    form.append('audio', audioWav.value, 'recording.wav')
    form.append('referenceText', props.word.display_word)
    const data = await apiFetch<AssessmentResult>('/api/assess', { method: 'POST', body: form })
    result.value = data
    emit('scored', props.word, data)
  } catch (e) {
    assessError.value = e instanceof Error ? e.message : 'Assessment failed. Please try again.'
  } finally {
    assessing.value = false
  }
}

const wordScore = computed(() => result.value?.Words[0]?.PronunciationAssessment.AccuracyScore ?? null)
const scoreColor = computed(() => {
  const s = wordScore.value
  if (s === null) return ''
  if (s >= 80) return 'text-green-700'
  if (s >= 60) return 'text-amber-700'
  return 'text-red-700'
})
</script>

<template>
  <div class="card-soft flex flex-col gap-5">
    <!-- Word display -->
    <div class="text-center">
      <p class="text-4xl font-bold text-ink tracking-wide">{{ word.display_word }}</p>
      <p v-if="word.ipa" class="text-lg text-ink-light font-serif mt-1">{{ word.ipa }}</p>
      <div class="flex justify-center gap-4 mt-2 text-xs text-ink-lighter">
        <span>Best: <strong>{{ word.best_score }}</strong></span>
        <span>Lowest: <strong>{{ word.lowest_score }}</strong></span>
        <span>Attempts: <strong>{{ word.attempts_count }}</strong></span>
      </div>
    </div>

    <!-- Weak phonemes from past attempts -->
    <div v-if="word.weak_phonemes && word.weak_phonemes.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900">
      <span class="font-semibold">Common substitutions: </span>
      <span v-for="(hit, i) in word.weak_phonemes" :key="i" class="font-mono">
        /{{ hit.ph }}/ → /{{ hit.heard }}/{{ i < word.weak_phonemes.length - 1 ? ', ' : '' }}
      </span>
    </div>

    <!-- Recorder -->
    <Recorder @recorded="onRecorded" @reset="onReset" />

    <!-- Assess -->
    <div v-if="audioWav && !result">
      <div v-if="assessing" class="text-center text-sm text-ink-lighter">Analysing…</div>
      <template v-else>
        <button class="btn-primary w-full" @click="assess">Check Pronunciation</button>
        <p v-if="assessError" class="mt-2 text-sm text-red-700 text-center">{{ assessError }}</p>
      </template>
    </div>

    <!-- Result -->
    <div v-if="result" class="flex flex-col items-center gap-3">
      <p :class="['text-5xl font-bold', scoreColor]">{{ Math.round(wordScore ?? 0) }}</p>
      <p class="text-sm text-ink-medium">
        <template v-if="(wordScore ?? 0) >= 85">Excellent! Keep it up.</template>
        <template v-else-if="(wordScore ?? 0) >= 60">Good progress — keep practicing.</template>
        <template v-else>Keep going — consistency is the key.</template>
      </p>
      <div class="flex gap-3 mt-1">
        <button class="btn-secondary btn-sm" @click="onReset">Try Again</button>
        <button class="btn-primary btn-sm" @click="emit('next')">Next Word →</button>
      </div>
    </div>
  </div>
</template>
