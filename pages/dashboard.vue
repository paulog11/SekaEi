<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { useStreak } from '~/composables/useStreak'
import { usePhonemeStats } from '~/composables/usePhonemeStats'
import { passageStars } from '~/composables/useProgress'
import { SAMPLE_PASSAGES } from '~/types/passages'

definePageMeta({ access: 'free' })
useSekaSeoMeta({ title: 'Dashboard — セカトークXP', noindex: true })

const user = useSupabaseUser()
const { getHistory, error: historyError } = useHistory()
const { streak, fetchStreak, error: streakError } = useStreak()
const { weakest, fetchStats, error: statsError } = usePhonemeStats()
const weakPhonemes = computed(() => weakest.value.filter(s => s.avgScore < 70))

const history = ref<import('~/composables/useHistory').AttemptRecord[]>([])
const loading = ref(false)

const loadError = computed(() => historyError.value || streakError.value || statsError.value || null)

async function load(force = false) {
  loading.value = true
  ;[history.value] = await Promise.all([
    getHistory({ force }),
    fetchStreak({ force }),
    fetchStats({ force }),
  ])
  loading.value = false
}

watch(user, (u) => { if (u) load() }, { immediate: true })

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
const masteredPercent = computed(() =>
  Math.round((passagesMastered.value / SAMPLE_PASSAGES.length) * 100)
)

const thumbnailColors = [
  'bg-violet-100',
  'bg-emerald-100',
  'bg-orange-100',
  'bg-blue-100',
  'bg-pink-100',
  'bg-yellow-100',
]

const nextPassage = computed(() => {
  const masteredIds = new Set(
    masteryRows.value.filter(r => passageStars(r.attempts) === 3).map(r => r.passageId)
  )
  return SAMPLE_PASSAGES.find(p => !masteredIds.has(p.id)) ?? SAMPLE_PASSAGES[0]
})

const nextPassageIndex = computed(() => SAMPLE_PASSAGES.indexOf(nextPassage.value))

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

</script>

<template>
  <main class="container-page flex flex-col gap-6">
    <h1 class="text-lg font-bold text-ink m-0">Dashboard</h1>

    <ErrorBoundary :error="loadError" @retry="load(true)">
    <!-- Stat tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- Loading skeletons -->
      <template v-if="loading">
        <div v-for="n in 4" :key="n" class="skeleton h-24" />
      </template>
      <template v-else>
        <!-- Streak -->
        <div class="card-pop bg-white flex flex-col gap-1 p-4">
          <p class="font-heading text-5xl font-bold text-primary m-0 leading-none">
            {{ streak.current }}<span class="text-4xl">🔥</span>
          </p>
          <p class="text-xs text-ink-lighter m-0 mt-1">Day streak</p>
          <p class="text-[11px] m-0" :class="streak.todayMet ? 'text-green-600' : 'text-amber-600'">
            {{ streak.todayMet ? '✓ done today' : '○ not yet' }}
          </p>
        </div>

        <!-- Total sessions -->
        <div class="card-pop bg-white flex flex-col gap-1 p-4">
          <p class="font-heading text-5xl font-bold text-ink m-0 leading-none">{{ totalAttempts }}</p>
          <p class="text-xs text-ink-lighter m-0 mt-1">Total sessions</p>
        </div>

        <!-- Avg. score — radial progress (primary / lavender) -->
        <div class="card-pop bg-white flex flex-col items-center justify-center gap-2 p-4">
          <div
            class="radial-progress font-heading font-bold text-sm"
            :style="`--value:${avgOverall}; --size:5rem; --thickness:6px; color: var(--color-primary); background-color: #f3e8ff;`"
            role="progressbar"
            :aria-valuenow="avgOverall"
            aria-valuemin="0"
            aria-valuemax="100"
          >{{ avgOverall || '—' }}</div>
          <p class="text-xs text-ink-lighter m-0">Avg. score</p>
        </div>

        <!-- Mastered — radial progress (secondary / mint) -->
        <div class="card-pop bg-white flex flex-col items-center justify-center gap-2 p-4">
          <div
            class="radial-progress font-heading font-bold text-sm"
            :style="`--value:${masteredPercent}; --size:5rem; --thickness:6px; color: var(--color-secondary); background-color: #d1fae5;`"
            role="progressbar"
            :aria-valuenow="masteredPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          >{{ passagesMastered }}/{{ SAMPLE_PASSAGES.length }}</div>
          <p class="text-xs text-ink-lighter m-0">Mastered</p>
        </div>
      </template>
    </div>

    <!-- Up next — all passages with pastel thumbnails -->
    <section>
      <p class="text-xs uppercase tracking-wider font-semibold text-ink-lighter mb-3">Up next</p>
      <NuxtLink
        to="/practice"
        class="card-pop bg-white flex items-center gap-4 p-4 no-underline"
      >
        <div class="w-14 h-14 rounded-xl shrink-0" :class="thumbnailColors[nextPassageIndex % thumbnailColors.length]" />
        <div class="flex-1 min-w-0">
          <p class="font-heading text-sm font-semibold text-ink m-0 truncate">{{ nextPassage.title }}</p>
          <p class="text-xs text-ink-light m-0 mt-0.5">{{ nextPassage.source }}</p>
        </div>
        <span class="btn-primary btn-sm shrink-0">Practice</span>
      </NuxtLink>
    </section>

    <!-- Weak phonemes -->
    <section v-if="weakPhonemes.length" class="card">
      <h2 class="text-sm font-semibold text-ink mb-3">Phonemes to work on</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="stat in weakPhonemes"
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
          :to="attempt.slug ? `/attempt/${attempt.slug}` : '/practice'"
          class="flex items-center gap-3 bg-white rounded-lg px-3.5 py-2.5 no-underline shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
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
    <section v-if="masteryRows.length">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Passage mastery</h2>
      <div class="flex flex-col gap-2">
        <NuxtLink
          v-for="row in masteryRows"
          :key="row.passageId"
          :to="row.attempts[0]?.slug ? `/attempt/${row.attempts[0].slug}` : '/practice'"
          class="flex items-center justify-between gap-3 bg-white rounded-lg px-3.5 py-2.5 no-underline shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
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
    </ErrorBoundary>
  </main>
</template>
