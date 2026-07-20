<script setup lang="ts">
/**
 * @fileoverview Word-stress quiz UI. Perception phase: tap the stressed
 * syllable in a split word for instant right/wrong feedback (no network).
 * Production phase: after a correct guess, record yourself saying the word
 * and grade where the stress landed via a duration heuristic against Azure's
 * pronunciation-assessment result.
 */
import { ref, computed } from 'vue'
import { useStressLabStore } from '~/stores/stressLabStore'
import { useApi } from '~/composables/useApi'
import { detectStressedSyllable, type StressVerdict } from '~/utils/stress'
import type { AssessmentResult } from '~/types/assessment'
import { useTextToSpeech } from '~/composables/useTextToSpeech'

const store = useStressLabStore()
const { apiFetch } = useApi()
const { play } = useTextToSpeech()

const challenge = computed(() => store.currentChallenge)
const progressValue = computed(() => store.currentIndex)
const progressMax = computed(() => store.challenges.length)

// Syllables with the stressed one uppercased, for the "say it like this" hints.
const emphasizedParts = computed(() =>
  challenge.value.syllables.map((s, i) => ({
    text: i === challenge.value.stressedIndex ? s.toUpperCase() : s,
    stressed: i === challenge.value.stressedIndex,
  })),
)

// Production-phase state
const recordedWav = ref<Blob | null>(null)
const result = ref<AssessmentResult | null>(null)
const verdict = ref<StressVerdict | null>(null)
const assessing = ref(false)
const error = ref<string | null>(null)

function resetProduction() {
  recordedWav.value = null
  result.value = null
  verdict.value = null
  assessing.value = false
  error.value = null
}

function onSelect(i: number) {
  if (store.hasGuessedCorrectly) return
  store.submitAnswer(i)
}

function optionClass(i: number): string {
  if (!store.hasGuessedCorrectly && store.selectedIndex !== i) {
    return 'option-idle'
  }
  if (i === challenge.value.stressedIndex) {
    return 'option-correct'
  }
  if (store.hasGuessedCorrectly) {
    return 'option-dim'
  }
  if (store.selectedIndex === i) {
    return 'option-wrong'
  }
  return 'option-idle'
}

async function onHearIt() {
  try {
    await play(challenge.value.word)
  } catch (err) {
    console.warn('[StressLabView] TTS playback failed:', err)
  }
}

function onRecorded(wav: Blob) {
  recordedWav.value = wav
  result.value = null
  verdict.value = null
  error.value = null
}

function onProdReset() {
  resetProduction()
}

async function assessStress() {
  if (!recordedWav.value) return
  assessing.value = true
  error.value = null
  try {
    const form = new FormData()
    form.append('audio', recordedWav.value, 'recording.wav')
    form.append('referenceText', challenge.value.word)
    const res = await apiFetch<AssessmentResult>('/api/assess', { method: 'POST', body: form })
    result.value = res
    verdict.value = detectStressedSyllable(res, challenge.value)
  } catch (err: unknown) {
    const e = err as { status?: number; data?: { message?: string } }
    const msg = e?.data?.message ?? ''
    if (msg.includes('No speech recognized') || msg.includes('NoMatch')) {
      error.value = 'No speech was detected. Try again.'
    } else if (e?.status === 429) {
      error.value = e?.data?.message ?? 'Too many requests. Please wait.'
    } else {
      error.value = msg || 'Assessment failed. Please try again.'
    }
  } finally {
    assessing.value = false
  }
}

function ordinal(i: number): string {
  switch (i) {
    case 0: return '1st'
    case 1: return '2nd'
    case 2: return '3rd'
    default: return `${i + 1}th`
  }
}

function onNext() {
  resetProduction()
  store.nextChallenge()
}

function onRestart() {
  resetProduction()
  store.restartPack()
}
</script>

<template>
  <!-- Pack complete screen -->
  <div v-if="store.isPackComplete" class="flex flex-col items-center gap-6 py-12 text-center">
    <div class="text-5xl" aria-hidden="true">🎉</div>
    <div>
      <h2 class="text-2xl font-bold text-ink mb-2">Pack complete!</h2>
      <p class="text-ink-light text-sm">You finished all {{ store.challenges.length }} words in <strong>{{ store.currentPack.title }}</strong>.</p>
    </div>
    <button class="btn-primary btn-large" @click="onRestart">
      Restart pack
    </button>
  </div>

  <!-- Challenge UI -->
  <div v-else class="flex flex-col gap-6">

    <!-- Pack header + progress bar -->
    <div>
      <span class="text-xs font-semibold text-ink-light uppercase tracking-wider">{{ store.currentPack.title }}</span>
    </div>
    <progress
      class="progress progress-primary w-full -mt-2"
      :value="progressValue"
      :max="progressMax"
    />

    <!-- Perception phase -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-base font-medium text-ink m-0">
          Where is the stress in <strong class="text-primary">{{ challenge.word }}</strong>?
        </p>
        <button
          type="button"
          class="shrink-0 flex items-center gap-1 text-xs font-medium text-ink-medium hover:text-ink transition-colors duration-150"
          @click="onHearIt"
        >
          🔊 Hear it
        </button>
      </div>

      <!-- Syllable chips -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(syl, i) in challenge.syllables"
          :key="i"
          type="button"
          :class="['option-syllable', optionClass(i)]"
          :disabled="store.hasGuessedCorrectly"
          @click="onSelect(i)"
        >
          {{ syl }}
        </button>
      </div>

      <!-- Hint (revealed on correct guess) -->
      <Transition
        enter-active-class="transition-all duration-400 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="store.hasGuessedCorrectly" class="card-soft">
          <p class="text-sm font-semibold text-emerald-700 mb-1">Correct!</p>
          <p class="text-sm text-ink-medium leading-relaxed m-0">
            Stress the <strong class="text-primary">{{ challenge.syllables[challenge.stressedIndex] }}</strong> syllable: say it longer and louder.
          </p>
        </div>
      </Transition>
    </section>

    <!-- Production phase (shown after correct guess) -->
    <Transition
      enter-active-class="transition-all duration-400 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <section v-if="store.hasGuessedCorrectly" class="card-soft flex flex-col gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-light m-0">Now try saying it aloud</p>
          <p class="text-sm text-ink mt-1 m-0">
            <span v-for="(part, i) in emphasizedParts" :key="i">
              <span v-if="i > 0">·</span><strong v-if="part.stressed" class="text-primary">{{ part.text }}</strong><template v-else>{{ part.text }}</template>
            </span>
          </p>
        </div>

        <Recorder
          @recorded="onRecorded"
          @reset="onProdReset"
        />

        <div v-if="recordedWav && !result">
          <div v-if="assessing" class="flex items-center justify-center gap-2 py-3" aria-busy="true">
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.32s]" />
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.16s]" />
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
            <span class="ml-2 text-sm text-ink-lighter">Analysing…</span>
          </div>
          <template v-else>
            <button class="btn-primary w-full" @click="assessStress">
              Check my stress
            </button>
            <div v-if="error" class="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p class="flex-1 text-sm text-red-800 m-0">{{ error }}</p>
              <button class="btn-secondary btn-sm" @click="assessStress">Try again</button>
            </div>
          </template>
        </div>

        <!-- Verdict card -->
        <div v-if="verdict">
          <div v-if="verdict.uncertain" class="card-soft bg-gray-50 border border-border">
            <p class="text-sm text-ink-medium m-0">We couldn't clearly detect your stress this time — here's your pronunciation detail below.</p>
          </div>
          <div v-else-if="verdict.correct" class="card-soft bg-emerald-50 border border-emerald-200">
            <p class="text-sm text-emerald-800 m-0">
              Nice! You stressed
              <strong class="text-emerald-700"><span v-for="(part, i) in emphasizedParts" :key="i"><span v-if="i > 0">·</span>{{ part.text }}</span></strong>
              correctly. ✓
            </p>
          </div>
          <div v-else class="card-soft bg-amber-50 border border-amber-200">
            <p class="text-sm text-amber-800 m-0">
              You stressed the {{ ordinal(verdict.detectedIndex) }} syllable — aim for the {{ ordinal(challenge.stressedIndex) }}:
              <strong class="text-amber-700"><span v-for="(part, i) in emphasizedParts" :key="i"><span v-if="i > 0">·</span>{{ part.text }}</span></strong>
            </p>
          </div>
        </div>

        <ScoreDisplay v-if="result" :result="result" />

        <div class="flex justify-end">
          <button class="btn-primary" @click="onNext">
            Next word →
          </button>
        </div>
      </section>
    </Transition>

  </div>
</template>

<style scoped>
.option-syllable {
  @apply px-4 py-3 rounded-xl border border-border bg-white
         text-sm text-ink font-semibold
         transition-all duration-150 cursor-pointer
         hover:border-primary hover:bg-primary/5
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
}
.option-idle:not(:disabled):hover {
  border-color: var(--color-primary);
}
.option-correct {
  @apply border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400 cursor-default pointer-events-none;
}
.option-wrong {
  @apply border-red-400 bg-red-50 text-red-800 ring-2 ring-red-300;
}
.option-dim {
  @apply opacity-40 cursor-default pointer-events-none;
}
</style>
