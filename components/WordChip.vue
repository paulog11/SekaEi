<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { AzureWord } from '~/types/assessment'
import type { WeakPhonemeHit } from '~/types/flaggedWord'
import { useTextToSpeech } from '~/composables/useTextToSpeech'

const props = defineProps<{
  word: AzureWord
  ipa?: string
  isFlagged?: boolean
  isTutorialTarget?: boolean
}>()

const emit = defineEmits<{
  (e: 'replay', offsetSec: number, durationSec: number): void
  (e: 'flag', payload: { word: string; displayWord: string; score: number; weakPhonemes: WeakPhonemeHit[]; ipa?: string }): void
}>()

const score = computed(() => props.word.PronunciationAssessment.AccuracyScore)
const errorType = computed(() => props.word.PronunciationAssessment.ErrorType)
const isOmission = computed(() => errorType.value === 'Omission')

const ERROR_TYPE_META: Record<string, { cls: string; label: string; title: string }> = {
  Omission:        { cls: 'chip-omission',        label: 'Omission',    title: 'This word was not spoken.' },
  Insertion:       { cls: 'chip-insertion',        label: 'Insertion',   title: 'This word was spoken but not in the reference.' },
  Mispronunciation:{ cls: 'chip-bad',             label: '',            title: '' },
  Monotone:        { cls: 'chip-monotone',         label: 'Monotone',    title: 'Spoken without natural pitch variation.' },
  UnexpectedBreak: { cls: 'chip-unexpected-break', label: 'Break',       title: 'An unexpected pause was detected before this word.' },
  MissingBreak:    { cls: 'chip-missing-break',    label: 'No Pause',    title: 'A pause was expected before this word but not detected.' },
  None:            { cls: '', label: '', title: '' },
}

const colorClass = computed(() => {
  const meta = ERROR_TYPE_META[errorType.value]
  if (meta?.cls) return meta.cls
  if (score.value >= 80) return 'chip-good'
  if (score.value >= 60) return 'chip-ok'
  return 'chip-bad'
})

const errorLabel = computed(() => ERROR_TYPE_META[errorType.value]?.label ?? errorType.value)
const errorTitle = computed(() => ERROR_TYPE_META[errorType.value]?.title ?? '')

// Structured phoneme rows: target phoneme + score + optional "heard" from NBestPhonemes
interface PhonemeRow {
  target: string
  score: number
  heard: string | null
  heardScore: number | null
}
const phonemeRows = computed<PhonemeRow[]>(() =>
  props.word.Phonemes.map(p => {
    const nbest = p.PronunciationAssessment.NBestPhonemes
    const top = nbest?.[0]
    const heardDiffers = top && top.Phoneme !== p.Phoneme
    return {
      target: p.Phoneme,
      score: Math.round(p.PronunciationAssessment.AccuracyScore),
      heard: heardDiffers ? top.Phoneme : null,
      heardScore: heardDiffers ? Math.round(top.Score) : null,
    }
  })
)

const weakPhonemes = computed<WeakPhonemeHit[]>(() =>
  phonemeRows.value
    .filter(r => r.heard !== null)
    .map(r => ({ ph: r.target, heard: r.heard!, score: r.score }))
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

const { play: playTts, playingKey } = useTextToSpeech()
const isPlayingThis = computed(() => playingKey.value === `en-US-AriaNeural:${props.word.Word}`)

function handleHear() {
  playTts(props.word.Word)
}

function handleFlag() {
  emit('flag', {
    word: props.word.Word.toLowerCase().replace(/[^a-z']/g, ''),
    displayWord: props.word.Word,
    score: Math.round(score.value),
    weakPhonemes: weakPhonemes.value,
    ipa: props.ipa,
  })
  popoverOpen.value = false
}

function handleOutsideClick(e: MouseEvent) {
  if (chipRef.value && !chipRef.value.contains(e.target as Node)) {
    popoverOpen.value = false
  }
}

onMounted(() => { document.addEventListener('click', handleOutsideClick) })
onUnmounted(() => { document.removeEventListener('click', handleOutsideClick) })
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
    :data-tutorial="isTutorialTarget ? 'word-chip' : undefined"
    :role="isOmission ? undefined : 'button'"
    :tabindex="isOmission ? undefined : 0"
    :aria-expanded="isOmission ? undefined : popoverOpen"
    :title="errorTitle || undefined"
    @click="onChipClick"
    @keydown.enter="onChipClick"
    @keydown.space.prevent="onChipClick"
  >
    {{ word.Word }}
    <span class="text-[0.7rem] opacity-70">{{ Math.round(score) }}</span>
    <span v-if="errorLabel" class="text-[0.65rem] italic opacity-80">{{ errorLabel }}</span>
    <span v-if="ipa" class="block w-full text-[0.65rem] font-serif opacity-60 mt-px">{{ ipa }}</span>

    <!-- Popover -->
    <span
      v-if="phonemeRows.length"
      :class="[
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20',
        'flex flex-col gap-1 min-w-[140px] px-2.5 py-2 rounded-md',
        'bg-ink text-surface text-xs whitespace-nowrap pointer-events-none',
        'transition-opacity duration-150',
        popoverOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100',
      ]"
      aria-hidden="true"
    >
      <span v-for="row in phonemeRows" :key="row.target" class="font-mono block">
        {{ row.target }}: {{ row.score }}
        <template v-if="row.heard">
          <span class="opacity-60"> → heard /{{ row.heard }}/ ({{ row.heardScore }})</span>
        </template>
      </span>

      <div class="flex gap-2 mt-1.5 pt-1 border-t border-white/20">
        <button
          v-if="!isOmission"
          class="text-[0.65rem] text-primary-300 hover:text-white underline text-left pointer-events-auto bg-transparent border-none cursor-pointer p-0"
          @click.stop="handleReplay"
        >
          ▶ Replay
        </button>
        <button
          v-if="!isOmission"
          class="text-[0.65rem] text-primary-300 hover:text-white underline text-left pointer-events-auto bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
          :disabled="isPlayingThis"
          title="Hear native pronunciation"
          @click.stop="handleHear"
        >
          {{ isPlayingThis ? '🔊…' : '🔊 Hear' }}
        </button>
        <button
          class="text-[0.65rem] pointer-events-auto bg-transparent border-none cursor-pointer p-0 ml-auto"
          :class="isFlagged ? 'text-yellow-300' : 'text-white/60 hover:text-yellow-300'"
          :title="isFlagged ? 'Saved for drill' : 'Save for drill'"
          @click.stop="handleFlag"
        >
          {{ isFlagged ? '★ Saved' : '☆ Save' }}
        </button>
      </div>
    </span>
  </span>
</template>

<style scoped>
span:hover > .opacity-0 {
  opacity: 1 !important;
  pointer-events: auto !important;
}
</style>
