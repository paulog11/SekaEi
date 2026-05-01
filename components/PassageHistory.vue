<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { passageStars } from '~/composables/useProgress'
import type { AttemptRecord } from '~/composables/useHistory'

const props = defineProps<{
  passageId: string
  passageTitle: string
}>()

const { getByPassage } = useHistory()

const attempts = ref<AttemptRecord[]>([])

async function load() {
  attempts.value = await getByPassage(props.passageId)
}

watch(() => props.passageId, load, { immediate: true })

const recentScores = computed(() => attempts.value.slice(0, 10).map(a => a.scores.overall).reverse())
const stars = computed(() => passageStars(attempts.value))

const best = computed(() => recentScores.value.length ? Math.max(...recentScores.value) : 0)
const avg = computed(() =>
  recentScores.value.length
    ? Math.round(recentScores.value.reduce((s, v) => s + v, 0) / recentScores.value.length)
    : 0
)

const sparkPath = computed(() => {
  const scores = recentScores.value
  if (scores.length < 2) return ''
  const w = 80
  const h = 30
  const pad = 3
  const minY = Math.min(...scores)
  const maxY = Math.max(...scores)
  const range = maxY - minY || 1

  const points = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
    const y = h - pad - ((s - minY) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${points.join(' L ')}`
})
</script>

<template>
  <div v-if="recentScores.length >= 1" class="card-soft mt-5">
    <div class="flex justify-between items-baseline mb-2">
      <span class="text-xs font-semibold text-ink-medium">Your progress — {{ passageTitle }}</span>
      <span class="text-xs text-ink-lighter">{{ attempts.length }} attempt{{ attempts.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="flex items-center gap-0.5 mb-2" :aria-label="`${stars} out of 3 stars`">
      <span v-for="n in 3" :key="n" :class="['star text-base', { 'star-lit': stars >= n }]">★</span>
      <span class="ml-1 text-[0.7rem] text-ink-lighter">{{ ['–', '60+', '80+', '90+'][stars] }}</span>
    </div>

    <div v-if="recentScores.length >= 2" class="flex items-center gap-5">
      <svg class="w-20 h-[30px] shrink-0" viewBox="0 0 80 30" aria-hidden="true">
        <path
          :d="sparkPath"
          fill="none"
          stroke="#2563eb"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="flex gap-4">
        <div class="flex flex-col items-center">
          <span class="text-xl font-bold text-ink">{{ best }}</span>
          <span class="text-[0.7rem] text-ink-lighter">Best</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-xl font-bold text-ink">{{ avg }}</span>
          <span class="text-[0.7rem] text-ink-lighter">Avg</span>
        </div>
      </div>
    </div>
  </div>
</template>
