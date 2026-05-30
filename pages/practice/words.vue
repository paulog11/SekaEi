<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FlaggedWord } from '~/types/flaggedWord'
import type { AssessmentResult } from '~/types/assessment'
import { useFlaggedWords } from '~/composables/useFlaggedWords'
import { useCoach } from '~/composables/useCoach'
import { useApi } from '~/composables/useApi'

definePageMeta({ access: 'free' })
useSekaSeoMeta({ title: 'Word Review — セカトークXP', noindex: true })

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
  await fetchWords('active')
}

async function handleUnflag(word: FlaggedWord) {
  await unflag(word.display_word)
}
</script>

<template>
  <main class="container-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-ink">Word Review</h1>
      <span v-if="words.length" class="text-xs font-medium text-ink-lighter bg-surface border border-border rounded-full px-3 py-1">
        {{ words.length }} word{{ words.length > 1 ? 's' : '' }}
      </span>
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
        <aside class="flex flex-col gap-1.5">
          <p class="text-xs uppercase tracking-wider font-semibold text-ink-lighter mb-1">Your words</p>
          <button
            v-for="(word, idx) in words"
            :key="word.id"
            :class="[
              'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors duration-150 border',
              idx === activeIndex
                ? 'bg-primary border-primary text-white shadow-sm'
                : 'bg-white border-border hover:border-primary/40 text-ink',
            ]"
            @click="selectWord(idx)"
          >
            <span class="font-medium text-sm truncate">{{ word.display_word }}</span>
            <span :class="[
              'text-xs font-bold shrink-0 ml-2',
              idx === activeIndex
                ? 'text-white/80'
                : word.lowest_score >= 80 ? 'text-green-600'
                : word.lowest_score >= 60 ? 'text-amber-600'
                : 'text-red-500',
            ]">
              {{ word.lowest_score }}
            </span>
          </button>
        </aside>

        <!-- Drill panel -->
        <div class="flex flex-col gap-4">
          <FlashcardDrill
            v-if="activeWord"
            :key="activeWord.id"
            :word="activeWord"
            @scored="onScored"
            @next="goNext"
          />

          <!-- Archive -->
          <div v-if="activeWord" class="flex justify-end">
            <button
              class="text-xs text-ink-lighter hover:text-ink transition-colors duration-150 underline underline-offset-2"
              @click="handleUnflag(activeWord)"
            >
              Archive word
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
