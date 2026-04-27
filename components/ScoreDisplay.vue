<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'

defineProps<{ result: AssessmentResult }>()

function scoreColor(s: number) {
  if (s >= 80) return '#059669'
  if (s >= 60) return '#d97706'
  return '#dc2626'
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

    <div class="score-display__words">
      <WordChip v-for="word in result.Words" :key="`${word.Word}-${word.Offset}`" :word="word" />
    </div>

    <p class="score-display__hint">Hover over a word to see phoneme-level scores.</p>
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

.score-display__words {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  line-height: 2.2;
}

.score-display__hint {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #9ca3af;
}
</style>
