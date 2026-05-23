<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIdiomLabStore } from '~/stores/idiomLabStore'
import { useApi } from '~/composables/useApi'
import type { AssessmentResult } from '~/types/assessment'

const store = useIdiomLabStore()
const { apiFetch } = useApi()

const phraseRevealed = ref(false)

const challenge = computed(() => store.currentChallenge)
const progressValue = computed(() => store.currentIndex)
const progressMax = computed(() => store.challenges.length)

// Pronunciation bridge state
const pronAudioWav = ref<Blob | null>(null)
const pronResult = ref<AssessmentResult | null>(null)
const pronAssessing = ref(false)
const pronError = ref<string | null>(null)

function resetPronunciation() {
  pronAudioWav.value = null
  pronResult.value = null
  pronError.value = null
}

function onPlayAudio() {
  phraseRevealed.value = true
}

function onSelectOption(url: string) {
  if (store.hasGuessedCorrectly) return
  store.submitAnswer(url)
}

function onNext() {
  phraseRevealed.value = false
  resetPronunciation()
  store.nextChallenge()
}

function onRestart() {
  resetPronunciation()
  store.restartPack()
}

function onPronRecorded(wav: Blob) {
  pronAudioWav.value = wav
  pronResult.value = null
  pronError.value = null
}

function onPronReset() {
  resetPronunciation()
}

async function assessPronunciation() {
  if (!pronAudioWav.value) return
  pronAssessing.value = true
  pronError.value = null
  try {
    const form = new FormData()
    form.append('audio', pronAudioWav.value, 'recording.wav')
    form.append('referenceText', challenge.value.phrase)
    pronResult.value = await apiFetch<AssessmentResult>('/api/assess', { method: 'POST', body: form })
  } catch (err: unknown) {
    const e = err as { status?: number; data?: { message?: string } }
    const msg = e?.data?.message ?? ''
    if (msg.includes('No speech recognized') || msg.includes('NoMatch')) {
      pronError.value = 'No speech was detected. Try again.'
    } else if (e?.status === 429) {
      pronError.value = e?.data?.message ?? 'Too many requests. Please wait.'
    } else {
      pronError.value = msg || 'Assessment failed. Please try again.'
    }
  } finally {
    pronAssessing.value = false
  }
}

function optionClass(url: string): string {
  if (!store.hasGuessedCorrectly && store.selectedAnswer !== url) {
    return 'option-idle'
  }
  if (url === challenge.value.figurativeImageUrl) {
    return 'option-correct'
  }
  if (store.hasGuessedCorrectly) {
    return 'option-dim'
  }
  if (store.selectedAnswer === url) {
    return 'option-wrong'
  }
  return 'option-idle'
}
</script>

<template>
  <!-- Pack complete screen -->
  <div v-if="store.isPackComplete" class="flex flex-col items-center gap-6 py-12 text-center">
    <div class="text-5xl" aria-hidden="true">🎉</div>
    <div>
      <h2 class="text-2xl font-bold text-ink mb-2">Pack complete!</h2>
      <p class="text-ink-light text-sm">You finished all {{ store.challenges.length }} idioms in <strong>{{ store.currentPack.title }}</strong>.</p>
    </div>
    <button class="btn-primary btn-large" @click="onRestart">
      Restart pack
    </button>
  </div>

  <!-- Challenge UI -->
  <div v-else class="flex flex-col gap-6">

    <!-- Pack header + DaisyUI progress bar -->
    <div>
      <span class="text-xs font-semibold text-ink-light uppercase tracking-wider">{{ store.currentPack.title }}</span>
    </div>
    <progress
      class="progress progress-primary w-full -mt-2"
      :value="progressValue"
      :max="progressMax"
    />

    <!-- Split layout -->
    <div class="flex flex-col lg:flex-row gap-6 lg:gap-10 lg:items-start">

      <!-- Left: Literal prompt -->
      <div class="flex-1 flex flex-col gap-4">
        <div class="card-soft overflow-hidden p-0 rounded-xl">
          <img
            :src="challenge.literalImageUrl"
            :alt="`Literal meaning of: ${challenge.phrase}`"
            class="w-full aspect-video object-cover"
          />
        </div>
      </div>

      <!-- Right: Figurative options grid -->
      <div class="flex-1 flex flex-col gap-4">
        <p class="text-sm font-medium text-ink-medium text-center">
          Which image shows the <em>real</em> meaning?
        </p>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="url in store.shuffledOptions"
            :key="url"
            :class="['card-pop', 'option-choice', optionClass(url)]"
            :disabled="store.hasGuessedCorrectly"
            :aria-pressed="store.selectedAnswer === url || (store.hasGuessedCorrectly && url === challenge.figurativeImageUrl)"
            @click="onSelectOption(url)"
          >
            <img
              :src="url"
              alt="Answer option"
              class="w-full h-full object-cover"
            />

            <!-- Correct tick overlay -->
            <span
              v-if="store.hasGuessedCorrectly && url === challenge.figurativeImageUrl"
              class="absolute inset-0 flex items-center justify-center bg-emerald-500/20"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-10 h-10 text-emerald-600 drop-shadow"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>

            <!-- Wrong ✗ overlay -->
            <span
              v-if="!store.hasGuessedCorrectly && store.selectedAnswer === url"
              class="absolute inset-0 flex items-center justify-center bg-red-500/20"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="w-10 h-10 text-red-600 drop-shadow"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          </button>
        </div>

        <!-- Explanation + Next (revealed on correct guess) -->
        <Transition
          enter-active-class="transition-all duration-400 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="store.hasGuessedCorrectly" class="flex flex-col gap-3">
            <div class="card-soft">
              <p class="text-sm font-semibold text-emerald-700 mb-1">Correct!</p>
              <p class="text-sm text-ink-medium leading-relaxed">{{ challenge.explanation }}</p>
            </div>

            <!-- Pronunciation bridge: optional "say it aloud" -->
            <div class="card-soft flex flex-col gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-ink-light m-0">Now try saying it aloud</p>
                <p class="text-lg font-semibold text-ink mt-1 m-0">{{ challenge.phrase }}</p>
              </div>

              <Recorder
                @recorded="onPronRecorded"
                @reset="onPronReset"
              />

              <div v-if="pronAudioWav && !pronResult">
                <div v-if="pronAssessing" class="flex items-center justify-center gap-2 py-3" aria-busy="true">
                  <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.32s]" />
                  <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.16s]" />
                  <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
                  <span class="ml-2 text-sm text-ink-lighter">Analysing…</span>
                </div>
                <template v-else>
                  <button class="btn-primary w-full" @click="assessPronunciation">
                    Check My Pronunciation
                  </button>
                  <div v-if="pronError" class="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <p class="flex-1 text-sm text-red-800 m-0">{{ pronError }}</p>
                    <button class="btn-secondary btn-sm" @click="assessPronunciation">Try again</button>
                  </div>
                </template>
              </div>

              <ScoreDisplay v-if="pronResult" :result="pronResult" />
            </div>

            <button class="btn-primary self-end" @click="onNext">
              Next idiom →
            </button>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<style scoped>
.option-choice {
  @apply relative aspect-square overflow-hidden cursor-pointer
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-offset-2 focus-visible:ring-primary;
}
.option-idle:not(:disabled):hover {
  border-color: var(--color-primary);
}
.option-correct {
  @apply border-emerald-500 ring-2 ring-emerald-400;
}
.option-wrong {
  @apply border-red-400 ring-2 ring-red-300;
}
.option-dim {
  @apply opacity-40 cursor-default pointer-events-none;
  transform: none !important;
  box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.8) !important;
}
</style>
