<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { useStreak } from '~/composables/useStreak'
import { usePhonemeStats } from '~/composables/usePhonemeStats'
import { passageStars } from '~/composables/useProgress'
import { SAMPLE_PASSAGES } from '~/types/passages'

definePageMeta({ middleware: ['stage', 'auth'] })
useHead({ title: 'Dashboard — SekaEi' })

const user = useSupabaseUser()
const { getHistory } = useHistory()
const { streak, fetchStreak } = useStreak()
const { weakest, fetchStats } = usePhonemeStats()

const history = ref<import('~/composables/useHistory').AttemptRecord[]>([])
const loading = ref(false)

watch(user, async (u) => {
  if (u) {
    loading.value = true
    ;[history.value] = await Promise.all([
      getHistory(),
      fetchStreak(),
      fetchStats(),
    ])
    loading.value = false
  }
}, { immediate: true })

const totalAttempts = computed(() => history.value.length)

const avgOverall = computed(() => {
  if (!history.value.length) return 0
  const sum = history.value.reduce((acc, r) => acc + r.scores.overall, 0)
  return Math.round(sum / history.value.length)
})

const recentAttempts = computed(() => [...history.value].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5))

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

const passagesStarted = computed(() => masteryRows.value.length)
const passagesMastered = computed(() => masteryRows.value.filter(r => passageStars(r.attempts) === 3).length)

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const suggestedPassage = computed(() => {
  if (!history.value.length) return SAMPLE_PASSAGES[0]
  const practicedIds = new Set(history.value.map(r => r.passageId))
  return SAMPLE_PASSAGES.find(p => !practicedIds.has(p.id)) ?? null
})
</script>

<template>
  <main class="container-page flex flex-col gap-6">
    <h1 class="text-lg font-bold text-ink m-0">Dashboard</h1>

    <!-- Stat tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card-soft flex flex-col gap-0.5">
        <p class="text-2xl font-bold text-primary m-0">{{ streak.current }}</p>
        <p class="text-xs text-ink-lighter m-0">Day streak</p>
        <p class="text-[11px] m-0" :class="streak.todayMet ? 'text-green-600' : 'text-amber-600'">
          {{ streak.todayMet ? '✓ done today' : '○ not yet' }}
        </p>
      </div>
      <div class="card-soft flex flex-col gap-0.5">
        <p class="text-2xl font-bold text-ink m-0">{{ totalAttempts }}</p>
        <p class="text-xs text-ink-lighter m-0">Total sessions</p>
      </div>
      <div class="card-soft flex flex-col gap-0.5">
        <p class="text-2xl font-bold m-0" :class="avgOverall ? scoreColor(avgOverall) : 'text-ink-lighter'">
          {{ avgOverall || '—' }}
        </p>
        <p class="text-xs text-ink-lighter m-0">Avg. score</p>
      </div>
      <div class="card-soft flex flex-col gap-0.5">
        <p class="text-2xl font-bold text-ink m-0">
          {{ passagesMastered }}<span class="text-base text-ink-lighter font-normal">/{{ passagesStarted }}</span>
        </p>
        <p class="text-xs text-ink-lighter m-0">Mastered</p>
      </div>
    </div>

    <!-- Suggested next passage -->
    <section v-if="suggestedPassage" class="card flex items-center gap-4">
      <div class="flex-1 min-w-0">
        <p class="text-xs uppercase tracking-wider text-ink-lighter m-0 mb-1">Up next</p>
        <p class="text-sm font-semibold text-ink m-0 truncate">{{ suggestedPassage.title }}</p>
        <p class="text-xs text-ink-light m-0 mt-0.5 line-clamp-2">{{ suggestedPassage.text }}</p>
      </div>
      <NuxtLink to="/practice" class="btn-primary btn-sm shrink-0">Practice</NuxtLink>
    </section>

    <!-- Weak phonemes -->
    <section v-if="weakest.length" class="card">
      <h2 class="text-sm font-semibold text-ink mb-3">Phonemes to work on</h2>
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

    <!-- Recent sessions -->
    <section v-if="recentAttempts.length">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Recent sessions</h2>
      <div class="flex flex-col gap-2">
        <NuxtLink
          v-for="attempt in recentAttempts"
          :key="attempt.timestamp"
          :to="attempt.id ? `/attempt/${attempt.id}` : '/practice'"
          class="flex items-center gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5 no-underline"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink m-0 truncate">{{ attempt.passageTitle }}</p>
            <p class="text-xs text-ink-lighter m-0">{{ formatDate(attempt.timestamp) }}</p>
          </div>
          <span class="text-sm font-bold shrink-0" :class="scoreColor(attempt.scores.overall)">
            {{ attempt.scores.overall }}
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Passage mastery -->
    <section v-if="loading || masteryRows.length">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Passage mastery</h2>
      <p v-if="loading" class="text-sm text-ink-lighter m-0">Loading…</p>
      <div v-else class="flex flex-col gap-2">
        <NuxtLink
          v-for="row in masteryRows"
          :key="row.passageId"
          :to="row.attempts[0]?.id ? `/attempt/${row.attempts[0].id}` : '/practice'"
          class="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5 no-underline"
        >
          <span class="flex-1 min-w-0 truncate text-sm font-medium text-ink">{{ row.passageTitle }}</span>
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
    <section v-if="!loading && !history.length" class="text-center py-16 text-ink-lighter">
      <p class="text-base m-0">No practice sessions yet.</p>
      <NuxtLink to="/practice" class="btn-primary mt-4 inline-flex">Start practising</NuxtLink>
    </section>
  </main>
</template>
