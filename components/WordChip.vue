<script setup lang="ts">
import type { AzureWord } from '~/types/assessment'

const props = defineProps<{
  word: AzureWord
  ipa?: string
}>()

const emit = defineEmits<{
  (e: 'replay', offsetSec: number, durationSec: number): void
}>()

const score = computed(() => props.word.PronunciationAssessment.AccuracyScore)
const errorType = computed(() => props.word.PronunciationAssessment.ErrorType)
const isOmission = computed(() => errorType.value === 'Omission')

const colorClass = computed(() => {
  if (errorType.value === 'Omission') return 'chip--omission'
  if (errorType.value === 'Insertion') return 'chip--insertion'
  if (score.value >= 80) return 'chip--good'
  if (score.value >= 60) return 'chip--ok'
  return 'chip--bad'
})

const tooltipLines = computed(() =>
  props.word.Phonemes.map(p => `${p.Phoneme}: ${Math.round(p.PronunciationAssessment.AccuracyScore)}`)
)

function handleReplay() {
  if (isOmission.value) return
  const offsetSec = props.word.Offset / 10_000_000
  const durationSec = props.word.Duration / 10_000_000
  emit('replay', offsetSec, durationSec)
}
</script>

<template>
  <span
    :class="['chip', colorClass, { 'chip--replayable': !isOmission }]"
    :title="tooltipLines.join('\n')"
    :role="isOmission ? undefined : 'button'"
    :tabindex="isOmission ? undefined : 0"
    @click="handleReplay"
    @keydown.enter="handleReplay"
    @keydown.space.prevent="handleReplay"
  >
    {{ word.Word }}
    <span class="chip__score">{{ Math.round(score) }}</span>
    <span v-if="errorType !== 'None'" class="chip__error">{{ errorType }}</span>
    <span v-if="ipa" class="chip__ipa">{{ ipa }}</span>
    <span v-if="tooltipLines.length" class="chip__tooltip" aria-hidden="true">
      <span v-for="line in tooltipLines" :key="line" class="chip__phoneme">{{ line }}</span>
    </span>
  </span>
</template>

<style scoped>
.chip {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: default;
  margin: 3px;
  transition: box-shadow 0.1s;
}

.chip--replayable {
  cursor: pointer;
}

.chip--replayable:hover {
  box-shadow: 0 0 0 2px #2563eb55;
}

.chip--good    { background: #d1fae5; color: #065f46; }
.chip--ok      { background: #fef3c7; color: #92400e; }
.chip--bad     { background: #fee2e2; color: #991b1b; }
.chip--omission { background: #e5e7eb; color: #6b7280; text-decoration: line-through; }
.chip--insertion { background: #ede9fe; color: #5b21b6; }

.chip__score {
  font-size: 0.7rem;
  opacity: 0.7;
}

.chip__error {
  font-size: 0.65rem;
  font-style: italic;
  opacity: 0.8;
}

.chip__ipa {
  display: block;
  width: 100%;
  font-size: 0.65rem;
  font-family: serif;
  opacity: 0.6;
  margin-top: 1px;
}

.chip__tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #f9fafb;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 10;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
  text-align: left;
  pointer-events: none;
}

.chip:hover .chip__tooltip {
  display: flex;
}

.chip__phoneme {
  display: block;
  font-family: monospace;
}
</style>
