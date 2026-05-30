<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ access: 'free' })
useSekaSeoMeta({ title: 'Idioms & Slang — セカトークXP', noindex: true })

const selectedPackIndex = ref<number | null>(null)
const goingForward = ref(true)
const transitionName = computed(() => goingForward.value ? 'slide-pack' : 'slide-pack-reverse')

function onPackSelected(packIndex: number) {
  goingForward.value = true
  selectedPackIndex.value = packIndex
}

function onBackToSelection() {
  goingForward.value = false
  selectedPackIndex.value = null
}
</script>

<template>
  <main class="container-page">
    <div class="mb-6 h-6">
      <button
        v-if="selectedPackIndex !== null"
        class="flex items-center gap-1.5 text-sm font-medium text-ink-light hover:text-ink transition-colors duration-150"
        @click="onBackToSelection"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Packs
      </button>
    </div>

    <div class="overflow-hidden">
      <Transition :name="transitionName" mode="out-in">
        <PackSelectionView
          v-if="selectedPackIndex === null"
          key="selection"
          @select="onPackSelected"
        />
        <div v-else :key="`quiz-${selectedPackIndex}`">
          <IdiomLabView />
        </div>
      </Transition>
    </div>
  </main>
</template>
