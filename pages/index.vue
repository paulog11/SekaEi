<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { useStreak } from '~/composables/useStreak'
import { usePhonemeStats } from '~/composables/usePhonemeStats'
import { passageStars } from '~/composables/useProgress'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Progress — SekaEi' })

const user = useSupabaseUser()
const { getHistory } = useHistory()
const { streak, fetchStreak } = useStreak()
const { weakest, fetchStats } = usePhonemeStats()

const history = ref<import('~/composables/useHistory').AttemptRecord[]>([])
const historyLoading = ref(false)

watch(user, async (u) => {
  if (u) {
    historyLoading.value = true
    ;[history.value] = await Promise.all([
      getHistory(),
      fetchStreak(),
      fetchStats(),
    ])
    historyLoading.value = false
  }
}, { immediate: true })

const masteryRows = computed(() => {
  const seen = new Map<string, { passageId: string; passageTitle: string; attempts: import('~/composables/useHistory').AttemptRecord[] }>()
  for (const record of history.value) {
    if (!seen.has(record.passageId)) {
      seen.set(record.passageId, { passageId: record.passageId, passageTitle: record.passageTitle, attempts: [] })
    }
    seen.get(record.passageId)!.attempts.push(record)
  }
  return [...seen.values()].sort((a, b) => passageStars(b.attempts) - passageStars(a.attempts))
})
</script>

<template>
  <main class="container-page flex flex-col gap-8">
    <h1 class="sr-only">Progress</h1>

    <!-- Streak -->
    <section class="card">
      <h2 class="text-base font-semibold text-ink mb-4">Practice Streak</h2>
      <div class="flex gap-6 flex-wrap">
        <div class="text-center">
          <p class="text-3xl font-bold text-primary m-0">{{ streak.current }}</p>
          <p class="text-xs text-ink-lighter m-0">Current streak</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-bold text-ink m-0">{{ streak.longest }}</p>
          <p class="text-xs text-ink-lighter m-0">Longest streak</p>
        </div>
        <div class="text-center self-center">
          <p class="text-sm font-semibold m-0" :class="streak.todayMet ? 'text-green-600' : 'text-amber-600'">
            {{ streak.todayMet ? '✓ Goal met today' : '○ Not yet today' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Phoneme focus list -->
    <section v-if="weakest.length" class="card">
      <h2 class="text-base font-semibold text-ink mb-3">Phonemes to Focus On</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="stat in weakest"
          :key="stat.phoneme"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-mono bg-red-50 border border-red-200 text-red-700"
        >
          /{{ stat.phoneme }}/ <span class="text-xs text-red-400">{{ stat.avgScore }}%</span>
        </span>
      </div>
    </section>

    <!-- Passage mastery -->
    <section v-if="historyLoading || masteryRows.length">
      <h2 class="text-base font-semibold text-ink-medium mb-3">Passage Mastery</h2>
      <p v-if="historyLoading" class="text-sm text-ink-lighter m-0">Loading…</p>
      <div v-else class="flex flex-col gap-2">
        <NuxtLink
          v-for="row in masteryRows"
          :key="row.passageId"
          :to="`/attempt/${row.passageId}`"
          class="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5 no-underline"
        >
          <span class="flex-1 min-w-0 truncate text-sm font-medium text-ink mr-3">{{ row.passageTitle }}</span>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-ink-lighter">{{ row.attempts.length }} attempt{{ row.attempts.length !== 1 ? 's' : '' }}</span>
            <span class="flex gap-px" :aria-label="`${passageStars(row.attempts)} out of 3 stars`">
              <span v-for="n in 3" :key="n" :class="['star text-sm', { 'star-lit': passageStars(row.attempts) >= n }]">★</span>
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Empty state -->
    <section v-if="!historyLoading && !masteryRows.length && !weakest.length" class="text-center py-16 text-ink-lighter">
      <p class="text-base m-0">No practice sessions yet.</p>
      <NuxtLink to="/practice" class="btn-primary mt-4 inline-flex">Start practising</NuxtLink>
    </section>
  </main>
</template>
