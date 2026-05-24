<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'
import { useApi } from '~/composables/useApi'

definePageMeta({ access: 'free' })

const route = useRoute()
const id = route.params.id as string

const { apiFetch } = useApi()

interface AttemptDetail {
  id: string
  passageId: string
  passageTitle: string
  timestamp: number
  scores: { accuracy: number; fluency: number; completeness: number; prosody?: number; overall: number }
  azureResult: AssessmentResult | null
}

const attempt = ref<AttemptDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

useHead(() => ({
  title: attempt.value ? `Attempt — ${attempt.value.passageTitle} — セカトークXP` : 'Attempt — セカトークXP',
}))

onMounted(async () => {
  try {
    const data = await apiFetch<{ attempt: AttemptDetail }>(`/api/attempts/${id}`)
    attempt.value = data.attempt
  } catch {
    error.value = 'Attempt not found.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="container-page">
    <button
      class="inline-flex items-center gap-1 text-sm text-ink-light hover:text-ink mb-6"
      @click="$router.back()"
    >
      ← Back
    </button>

    <div v-if="loading" class="flex flex-col gap-3">
      <div class="skeleton h-20 motion-reduce:animate-none" />
      <div class="skeleton h-40 motion-reduce:animate-none" />
    </div>

    <div v-else-if="error" class="text-center text-red-600 py-12">
      {{ error }}
    </div>

    <template v-else-if="attempt">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-ink">{{ attempt.passageTitle }}</h1>
        <p class="text-sm text-ink-lighter m-0">
          {{ new Date(attempt.timestamp).toLocaleString() }}
        </p>
      </header>

      <ScoreDisplay
        v-if="attempt.azureResult"
        :result="attempt.azureResult"
      />

      <div v-else class="card text-center text-ink-light py-8">
        <p class="m-0">Detailed breakdown not available for this attempt.</p>
        <p class="text-sm m-0 mt-1">Overall score: {{ attempt.scores.overall }}</p>
      </div>
    </template>
  </main>
</template>
