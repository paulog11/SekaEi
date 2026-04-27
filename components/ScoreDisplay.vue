<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'

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

// Words to show on the "reference" line: everything except pure insertions
const referenceWords = computed(() =>
  props.result.Words.filter(w => w.PronunciationAssessment.ErrorType !== 'Insertion')
)

// Words to show on the "recognized" line: everything except omissions
const recognizedWords = computed(() =>
  props.result.Words.filter(w => w.PronunciationAssessment.ErrorType !== 'Omission')
)

function diffWordClass(errorType: string): string {
  if (errorType === 'Omission') return 'diff-word--omission'
  if (errorType === 'Insertion') return 'diff-word--insertion'
  if (errorType === 'Mispronunciation') return 'diff-word--mispronounced'
  return 'diff-word--ok'
}
</script>

<template>
  <section class="score-display">
    <h2 class="score-display__title">Results</h2>

    <p v-if="result.recognizedText" class="score-display__recognized">
      <strong>Recognized:</strong> "{{ result.recognizedText }}"
    </p>

    <div class="score-display__summary">
      <div
        v-for="(label, key) in {
          AccuracyScore: 'Accuracy',
          FluencyScore: 'Fluency',
          CompletenessScore: 'Completeness',
          PronScore: 'Overall',
          ProsodyScore: 'Prosody',
        }"
        :key="key"
        class="score-card"
      >
        <template v-if="result.PronunciationAssessment[key as keyof typeof result.PronunciationAssessment] !== undefined">
          <span
            class="score-card__value"
            :style="{ color: scoreColor(result.PronunciationAssessment[key as keyof typeof result.PronunciationAssessment] as number) }"
          >
            {{ Math.round(result.PronunciationAssessment[key as keyof typeof result.PronunciationAssessment] as number) }}
          </span>
          <span class="score-card__label">{{ label }}</span>
        </template>
      </div>
    </div>

    <!-- Toggle -->
    <div class="score-display__view-toggle">
      <button
        :class="['toggle-btn', { 'toggle-btn--active': !showDiff }]"
        @click="showDiff = false"
      >Words</button>
      <button
        :class="['toggle-btn', { 'toggle-btn--active': showDiff }]"
        @click="showDiff = true"
      >Diff</button>
    </div>

    <!-- Word chip grid -->
    <div v-if="!showDiff" class="score-display__words">
      <WordChip
        v-for="word in result.Words"
        :key="`${word.Word}-${word.Offset}`"
        :word="word"
        :ipa="ipaForWord(word.Word)"
        @replay="(o, d) => emit('replay', o, d)"
      />
    </div>

    <!-- Diff view -->
    <div v-else class="score-display__diff">
      <div class="diff-row">
        <span class="diff-row__label">Reference</span>
        <p class="diff-row__text">
          <span
            v-for="word in referenceWords"
            :key="`ref-${word.Word}-${word.Offset}`"
            :class="['diff-word', diffWordClass(word.PronunciationAssessment.ErrorType)]"
          >{{ word.Word }} </span>
        </p>
      </div>
      <div class="diff-row">
        <span class="diff-row__label">Recognized</span>
        <p class="diff-row__text">
          <span
            v-for="word in recognizedWords"
            :key="`rec-${word.Word}-${word.Offset}`"
            :class="['diff-word', diffWordClass(word.PronunciationAssessment.ErrorType)]"
          >{{ word.Word }} </span>
        </p>
      </div>
      <div class="diff-legend">
        <span class="diff-legend__item diff-legend__item--omission">Omitted</span>
        <span class="diff-legend__item diff-legend__item--insertion">Inserted</span>
        <span class="diff-legend__item diff-legend__item--mispronounced">Mispronounced</span>
      </div>
    </div>

    <p class="score-display__hint">
      <template v-if="!showDiff">Click a word to replay that moment. Hover for phoneme scores.</template>
      <template v-else>Reference is what you should have said. Recognized is what Azure heard.</template>
    </p>
  </section>
</template>

<style scoped>
.score-display {
  margin-top: 2rem;
}

.score-display__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.score-display__recognized {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.score-display__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  min-width: 90px;
}

.score-card__value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.score-card__label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.score-display__view-toggle {
  display: flex;
  gap: 2px;
  margin-bottom: 1rem;
}

.toggle-btn {
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s, color 0.1s;
}

.toggle-btn--active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.score-display__words {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 2px;
  line-height: 2.2;
}

.score-display__diff {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.diff-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.diff-row__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  white-space: nowrap;
  min-width: 72px;
}

.diff-row__text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.8;
}

.diff-word {
  display: inline;
}

.diff-word--ok { color: #1f2937; }
.diff-word--omission { color: #6b7280; text-decoration: line-through; }
.diff-word--insertion { color: #5b21b6; font-style: italic; }
.diff-word--mispronounced { color: #b91c1c; }

.diff-legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}

.diff-legend__item {
  font-size: 0.72rem;
}

.diff-legend__item--omission { color: #6b7280; text-decoration: line-through; }
.diff-legend__item--insertion { color: #5b21b6; font-style: italic; }
.diff-legend__item--mispronounced { color: #b91c1c; }

.score-display__hint {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #9ca3af;
}
</style>
