<script setup lang="ts">
import type { AssessmentResult, OverallPronunciationAssessment } from '~/types/assessment'

const props = defineProps<{
  result: AssessmentResult
  ipa?: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'replay', offsetSec: number, durationSec: number): void
}>()

const showDiff = ref(false)

function scoreColor(s: number) {
  if (s >= 80) return '#059669'
  if (s >= 60) return '#d97706'
  return '#dc2626'
}

function ipaForWord(word: string): string | undefined {
  if (!props.ipa) return undefined
  const key = word.toLowerCase().replace(/[^a-z']/g, '')
  return props.ipa[key]
}

const referenceWords = computed(() =>
  props.result.Words.filter(w => w.PronunciationAssessment.ErrorType !== 'Insertion')
)

const recognizedWords = computed(() =>
  props.result.Words.filter(w => w.PronunciationAssessment.ErrorType !== 'Omission')
)

function diffWordClass(errorType: string): string {
  if (errorType === 'Omission') return 'diff-word-omission'
  if (errorType === 'Insertion') return 'diff-word-insertion'
  if (errorType === 'Mispronunciation') return 'diff-word-mispronounced'
  return 'diff-word-ok'
}

const scoreKeys: Array<{ key: keyof OverallPronunciationAssessment; label: string }> = [
  { key: 'AccuracyScore',     label: 'Accuracy'     },
  { key: 'FluencyScore',      label: 'Fluency'      },
  { key: 'CompletenessScore', label: 'Completeness' },
  { key: 'PronScore',         label: 'Overall'      },
  { key: 'ProsodyScore',      label: 'Prosody'      },
]
</script>

<template>
  <section class="mt-8">
    <h2 class="text-xl font-semibold text-ink mb-4">Results</h2>

    <p v-if="result.recognizedText" class="text-sm text-ink-light mb-4">
      <strong>Recognized:</strong> "{{ result.recognizedText }}"
    </p>

    <!-- Score grid: 2-up on mobile, 5-up on sm+ -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <div
        v-for="{ key, label } in scoreKeys"
        :key="key"
        class="card-soft flex flex-col items-center py-3"
      >
        <template v-if="result.PronunciationAssessment[key] !== undefined">
          <span
            class="text-3xl font-bold leading-none"
            :style="{ color: scoreColor(result.PronunciationAssessment[key] as number) }"
          >
            {{ Math.round(result.PronunciationAssessment[key] as number) }}
          </span>
          <span class="text-xs text-ink-light mt-1">{{ label }}</span>
        </template>
      </div>
    </div>

    <!-- View toggle -->
    <div class="flex gap-0.5 mb-4">
      <button :class="['toggle-btn', { 'toggle-btn-active': !showDiff }]" @click="showDiff = false">Words</button>
      <button :class="['toggle-btn', { 'toggle-btn-active': showDiff }]" @click="showDiff = true">Diff</button>
    </div>

    <!-- Word chip grid -->
    <div v-if="!showDiff" class="flex flex-wrap items-start gap-0.5 leading-[2.2]">
      <WordChip
        v-for="word in result.Words"
        :key="`${word.Word}-${word.Offset}`"
        :word="word"
        :ipa="ipaForWord(word.Word)"
        @replay="(o, d) => emit('replay', o, d)"
      />
    </div>

    <!-- Diff view -->
    <div v-else class="flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
        <span class="text-[0.7rem] uppercase tracking-wider text-ink-lighter shrink-0 sm:min-w-[72px]">Reference</span>
        <p class="m-0 text-base leading-loose">
          <span
            v-for="word in referenceWords"
            :key="`ref-${word.Word}-${word.Offset}`"
            :class="['inline', diffWordClass(word.PronunciationAssessment.ErrorType)]"
          >{{ word.Word }} </span>
        </p>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
        <span class="text-[0.7rem] uppercase tracking-wider text-ink-lighter shrink-0 sm:min-w-[72px]">Recognized</span>
        <p class="m-0 text-base leading-loose">
          <span
            v-for="word in recognizedWords"
            :key="`rec-${word.Word}-${word.Offset}`"
            :class="['inline', diffWordClass(word.PronunciationAssessment.ErrorType)]"
          >{{ word.Word }} </span>
        </p>
      </div>
      <div class="flex gap-4 mt-1">
        <span class="text-xs diff-word-omission">Omitted</span>
        <span class="text-xs diff-word-insertion">Inserted</span>
        <span class="text-xs diff-word-mispronounced">Mispronounced</span>
      </div>
    </div>

    <p class="mt-3 text-xs text-ink-lighter">
      <template v-if="!showDiff">Tap a word to see phoneme scores.</template>
      <template v-else>Reference is what you should have said. Recognized is what Azure heard.</template>
    </p>
  </section>
</template>
