<script setup lang="ts">
import type { AssessmentResult, OverallPronunciationAssessment } from '~/types/assessment'
import type { FlagWordPayload } from '~/types/flaggedWord'

const props = defineProps<{
  result: AssessmentResult
  ipa?: Record<string, string>
  flaggedWords?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'replay', offsetSec: number, durationSec: number): void
  (e: 'flag', payload: FlagWordPayload): void
}>()

const showDiff = ref(false)
const tooltipLang = ref<'en' | 'ja'>('en')

// Words flagged newly in this result (for the "Practice difficult words" link)
const autoFlaggedCount = computed(() =>
  props.result.Words.filter(
    w => w.PronunciationAssessment.AccuracyScore < 60 &&
         (w.PronunciationAssessment.ErrorType === 'None' || w.PronunciationAssessment.ErrorType === 'Mispronunciation')
  ).length
)

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

function isWordFlagged(word: string): boolean {
  if (!props.flaggedWords) return false
  const normalized = word.toLowerCase().replace(/[^a-z']/g, '')
  return props.flaggedWords.has(normalized)
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

const scoreKeys: Array<{ key: keyof OverallPronunciationAssessment; label: string; en: string; ja: string }> = [
  {
    key: 'AccuracyScore',
    label: 'Accuracy',
    en: 'How closely your phonemes match a native speaker\'s pronunciation. Aggregated from phoneme-level scores for each word.',
    ja: '各音素がネイティブの発音にどれだけ近いかを示します。単語ごとの音素スコアから算出されます。',
  },
  {
    key: 'FluencyScore',
    label: 'Fluency',
    en: 'How naturally you use pauses between words. Unnatural silences or hesitations within the utterance lower this score.',
    ja: '単語間のポーズの自然さを示します。不自然な沈黙や詰まりがあるとスコアが下がります。',
  },
  {
    key: 'CompletenessScore',
    label: 'Completeness',
    en: 'Ratio of correctly pronounced words to the reference text. Omitted words lower this score.',
    ja: 'お手本テキストに対して正しく発音できた単語の割合です。省略があるとスコアが下がります。',
  },
  {
    key: 'PronScore',
    label: 'Overall',
    en: 'Weighted combination of Accuracy, Fluency, and Completeness — the single headline score for your pronunciation.',
    ja: 'Accuracy・Fluency・Completenessを加重平均した総合スコアです。',
  },
  {
    key: 'ProsodyScore',
    label: 'Prosody',
    en: 'How natural your speech sounds overall: rhythm, word stress, intonation, and speaking speed.',
    ja: 'リズム・ストレス・イントネーション・話す速さなど、話し方の自然さを総合的に評価します。',
  },
]
</script>

<template>
  <section class="mt-8">
    <h2 class="text-xl font-semibold text-ink mb-4">Results</h2>

    <p v-if="result.recognizedText" class="text-sm text-ink-light mb-4">
      <strong>Recognized:</strong> "{{ result.recognizedText }}"
    </p>

    <!-- Score grid: 2-up on mobile, 5-up on sm+ -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6" data-tutorial="score-grid">
      <div
        v-for="{ key, label, en, ja } in scoreKeys"
        :key="key"
        class="card-soft flex flex-col items-center py-3 relative group"
      >
        <template v-if="result.PronunciationAssessment[key] !== undefined">
          <span
            class="text-3xl font-bold leading-none"
            :style="{ color: scoreColor(result.PronunciationAssessment[key] as number) }"
          >
            {{ Math.round(result.PronunciationAssessment[key] as number) }}
          </span>
          <span class="text-xs text-ink-light mt-1 flex items-center gap-0.5">
            {{ label }}
            <span class="text-ink-lighter text-[0.65rem] cursor-help select-none" aria-hidden="true">ⓘ</span>
          </span>
          <!-- Tooltip -->
          <div
            class="absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 px-2.5 py-2 text-center text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
            role="tooltip"
          >
            <div class="flex justify-center gap-1 mb-1.5">
              <button
                :class="['px-1.5 py-0.5 rounded text-[0.6rem] font-semibold transition-colors', tooltipLang === 'en' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200']"
                @click.stop="tooltipLang = 'en'"
              >EN</button>
              <button
                :class="['px-1.5 py-0.5 rounded text-[0.6rem] font-semibold transition-colors', tooltipLang === 'ja' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200']"
                @click.stop="tooltipLang = 'ja'"
              >日本語</button>
            </div>
            {{ tooltipLang === 'en' ? en : ja }}
            <span class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" aria-hidden="true" />
          </div>
        </template>
      </div>
    </div>

    <!-- Difficult words nudge -->
    <div v-if="autoFlaggedCount > 0" class="mb-4 flex items-center gap-2 text-sm text-primary">
      <span>★ {{ autoFlaggedCount }} difficult word{{ autoFlaggedCount > 1 ? 's' : '' }} saved for drill.</span>
      <NuxtLink to="/practice/words" class="underline font-medium">Practice them →</NuxtLink>
    </div>

    <!-- View toggle -->
    <div class="flex gap-0.5 mb-4">
      <button :class="['toggle-btn', { 'toggle-btn-active': !showDiff }]" @click="showDiff = false">Words</button>
      <button :class="['toggle-btn', { 'toggle-btn-active': showDiff }]" @click="showDiff = true">Diff</button>
    </div>

    <!-- Word chip grid -->
    <div v-if="!showDiff" class="flex flex-wrap items-start gap-0.5 leading-[2.2]">
      <WordChip
        v-for="(word, idx) in result.Words"
        :key="`${word.Word}-${word.Offset}`"
        :word="word"
        :ipa="ipaForWord(word.Word)"
        :is-flagged="isWordFlagged(word.Word)"
        :is-tutorial-target="idx === 0"
        @replay="(o, d) => emit('replay', o, d)"
        @flag="(payload) => emit('flag', { ...payload, source: 'manual' })"
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
      <template v-if="!showDiff">Tap a word to see phoneme scores. Use ☆ Save to add it to your drill list.</template>
      <template v-else>Reference is what you should have said. Recognized is what Azure heard.</template>
    </p>
  </section>
</template>
