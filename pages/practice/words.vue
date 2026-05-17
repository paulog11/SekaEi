<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FlaggedWord } from '~/types/flaggedWord'
import type { AssessmentResult } from '~/types/assessment'
import { useFlaggedWords } from '~/composables/useFlaggedWords'
import { useCoach } from '~/composables/useCoach'
import { useApi } from '~/composables/useApi'

definePageMeta({ middleware: ['stage', 'auth'] })
useHead({ title: 'Word Review' })

const { words, loading, error, fetchWords, flag, unflag } = useFlaggedWords()
const { result: coachResult, loading: coachLoading, error: coachError, requestCoach } = useCoach()
const { apiFetch } = useApi()

onMounted(() => fetchWords('active'))

const activeIndex = ref(0)
const activeWord = computed<FlaggedWord | null>(() => words.value[activeIndex.value] ?? null)

function goNext() {
  if (activeIndex.value < words.value.length - 1) {
    activeIndex.value++
  } else {
    activeIndex.value = 0
  }
}

function selectWord(idx: number) {
  activeIndex.value = idx
}

async function onScored(word: FlaggedWord, result: AssessmentResult) {
  const newScore = result.Words[0]?.PronunciationAssessment.AccuracyScore ?? word.last_score
  await flag({
    word: word.word,
    displayWord: word.display_word,
    source: word.source,
    score: Math.round(newScore),
    ipa: word.ipa ?? undefined,
    passageId: word.source_passage_id ?? undefined,
  })
  // Refresh to pick up retirement
  await fetchWords('active')
}

async function handleUnflag(word: FlaggedWord) {
  await unflag(word.display_word)
}
</script>

<template>
  <main class="container-page">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-ink">Word Review</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-3">
      <div class="skeleton h-24" />
      <div class="skeleton h-16" />
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-red-700">{{ error }}</p>

    <!-- Empty state -->
    <div v-else-if="words.length === 0" class="flex flex-col items-center text-center py-16 gap-4">
      <p class="text-8xl leading-none" aria-hidden="true">📖</p>
      <div>
        <p class="font-heading text-2xl font-bold text-ink mb-1">You haven't learned any words yet!</p>
        <p class="text-sm text-ink-light">Words scoring below 60 will appear here automatically after you practice a passage.</p>
      </div>
      <NuxtLink to="/practice" class="btn btn-primary">Start Exploring</NuxtLink>
    </div>

    <template v-else>
      <!-- Word list + drill layout -->
      <div class="grid md:grid-cols-[220px_1fr] gap-6">
        <!-- Sidebar word list -->
        <aside class="flex flex-col gap-1">
          <p class="text-xs uppercase tracking-wider text-ink-lighter mb-1">{{ words.length }} word{{ words.length > 1 ? 's' : '' }}</p>
          <button
            v-for="(word, idx) in words"
            :key="word.id"
            :class="[
              'flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
              idx === activeIndex
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-border text-ink',
            ]"
            @click="selectWord(idx)"
          >
            <span class="font-medium text-sm">{{ word.display_word }}</span>
            <span :class="['text-xs', idx === activeIndex ? 'text-white/70' : 'text-ink-lighter']">
              {{ word.lowest_score }}
            </span>
          </button>
        </aside>

        <!-- Drill panel -->
        <div class="flex flex-col gap-5">
          <FlashcardDrill
            v-if="activeWord"
            :key="activeWord.id"
            :word="activeWord"
            @scored="onScored"
            @next="goNext"
          />

          <!-- Unflag -->
          <div v-if="activeWord" class="flex justify-end">
            <button
              class="text-xs text-ink-lighter underline hover:text-ink"
              @click="handleUnflag(activeWord)"
            >
              Remove from list
            </button>
          </div>
        </div>
      </div>

      <!-- Coach section -->
      <div class="mt-8">
        <CoachCard
          :result="coachResult"
          :loading="coachLoading"
          :error="coachError"
          @request="requestCoach"
        />
      </div>
    </template>
  </main>
</template>
