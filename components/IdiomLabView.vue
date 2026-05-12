<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIdiomLabStore } from '~/stores/idiomLabStore'

const store = useIdiomLabStore()

const phraseRevealed = ref(false)

const challenge = computed(() => store.currentChallenge)
const progress = computed(() => `${store.currentIndex + 1} / ${store.challenges.length}`)

function onPlayAudio() {
  phraseRevealed.value = true
}

function onSelectOption(url: string) {
  if (store.hasGuessedCorrectly) return
  store.submitAnswer(url)
}

function onNext() {
  phraseRevealed.value = false
  store.nextChallenge()
}

function onRestart() {
  store.restartPack()
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

    <!-- Pack header + progress bar -->
    <div class="flex items-center justify-between gap-4">
      <span class="text-xs font-semibold text-ink-light uppercase tracking-wider">{{ store.currentPack.title }}</span>
      <span class="text-xs text-ink-lighter tabular-nums">{{ progress }}</span>
    </div>
    <div class="w-full h-1.5 bg-border rounded-full overflow-hidden -mt-4">
      <div
        class="h-full bg-primary rounded-full transition-all duration-300"
        :style="{ width: `${((store.currentIndex) / store.challenges.length) * 100}%` }"
      />
    </div>

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
            :class="['option-btn', optionClass(url)]"
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
.option-btn {
  @apply relative aspect-square rounded-xl overflow-hidden
         border-2 border-border transition-all duration-150
         cursor-pointer focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-primary focus-visible:ring-offset-2;
}
.option-idle:hover {
  @apply border-primary scale-[1.02] shadow-md;
}
.option-correct {
  @apply border-emerald-500 ring-2 ring-emerald-400;
}
.option-wrong {
  @apply border-red-400 ring-2 ring-red-300;
}
.option-dim {
  @apply opacity-40 cursor-default;
}
</style>
