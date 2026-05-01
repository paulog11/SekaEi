<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  if (errorType.value === 'Omission') return 'chip-omission'
  if (errorType.value === 'Insertion') return 'chip-insertion'
  if (score.value >= 80) return 'chip-good'
  if (score.value >= 60) return 'chip-ok'
  return 'chip-bad'
})

const tooltipLines = computed(() =>
  props.word.Phonemes.map(p => `${p.Phoneme}: ${Math.round(p.PronunciationAssessment.AccuracyScore)}`)
)

const popoverOpen = ref(false)
const chipRef = ref<HTMLElement | null>(null)

function onChipClick() {
  if (isOmission.value) return
  popoverOpen.value = !popoverOpen.value
}

function handleReplay() {
  if (isOmission.value) return
  const offsetSec = props.word.Offset / 10_000_000
  const durationSec = props.word.Duration / 10_000_000
  emit('replay', offsetSec, durationSec)
  popoverOpen.value = false
}

function handleOutsideClick(e: MouseEvent) {
  if (chipRef.value && !chipRef.value.contains(e.target as Node)) {
    popoverOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <span
    ref="chipRef"
    :class="[
      'relative inline-flex items-baseline flex-wrap gap-1 m-0.5 px-2 py-1 rounded-md',
      'text-base font-medium leading-snug min-h-[44px]',
      colorClass,
      isOmission ? 'cursor-default' : 'cursor-pointer hover:shadow-chip',
    ]"
    :role="isOmission ? undefined : 'button'"
    :tabindex="isOmission ? undefined : 0"
    :aria-expanded="isOmission ? undefined : popoverOpen"
    @click="onChipClick"
    @keydown.enter="onChipClick"
    @keydown.space.prevent="onChipClick"
  >
    {{ word.Word }}
    <span class="text-[0.7rem] opacity-70">{{ Math.round(score) }}</span>
    <span v-if="errorType !== 'None'" class="text-[0.65rem] italic opacity-80">{{ errorType }}</span>
    <span v-if="ipa" class="block w-full text-[0.65rem] font-serif opacity-60 mt-px">{{ ipa }}</span>

    <!-- Popover: shown on hover (desktop) or tap (mobile) -->
    <span
      v-if="tooltipLines.length"
      :class="[
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20',
        'flex flex-col gap-1 min-w-[100px] px-2.5 py-2 rounded-md',
        'bg-ink text-surface text-xs whitespace-nowrap pointer-events-none',
        'transition-opacity duration-150',
        popoverOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100',
      ]"
      aria-hidden="true"
    >
      <span v-for="line in tooltipLines" :key="line" class="font-mono block">{{ line }}</span>
      <button
        v-if="!isOmission"
        class="mt-1 text-[0.65rem] text-primary-300 hover:text-white underline text-left pointer-events-auto bg-transparent border-none cursor-pointer p-0"
        @click.stop="handleReplay"
      >
        ▶ Replay
      </button>
    </span>
  </span>
</template>

<style scoped>
/* Show tooltip on hover for non-touch devices */
span:hover > .opacity-0 {
  opacity: 1 !important;
  pointer-events: auto !important;
}
</style>
