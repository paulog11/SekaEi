<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { passageStars } from '~/composables/useProgress'

const props = defineProps<{
  passageId: string
  passageTitle: string
}>()

const { getByPassage } = useHistory()

const attempts = computed(() => getByPassage(props.passageId))
const recentScores = computed(() => attempts.value.slice(0, 10).map(a => a.scores.overall).reverse())
const stars = computed(() => passageStars(attempts.value))

const best = computed(() => recentScores.value.length ? Math.max(...recentScores.value) : 0)
const avg = computed(() =>
  recentScores.value.length
    ? Math.round(recentScores.value.reduce((s, v) => s + v, 0) / recentScores.value.length)
    : 0
)

// SVG sparkline: 80×30 viewport, points normalized to 0–100
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
  <div v-if="recentScores.length >= 1" class="passage-history">
    <div class="passage-history__header">
      <span class="passage-history__title">Your progress — {{ passageTitle }}</span>
      <span class="passage-history__count">{{ attempts.length }} attempt{{ attempts.length !== 1 ? 's' : '' }}</span>
    </div>
    <div class="passage-history__stars" :aria-label="`${stars} out of 3 stars`">
      <span v-for="n in 3" :key="n" :class="['star', { 'star--lit': stars >= n }]">★</span>
      <span class="stars__label">{{ ['–', '60+', '80+', '90+'][stars] }}</span>
    </div>
    <div v-if="recentScores.length >= 2" class="passage-history__body">
      <svg class="sparkline" viewBox="0 0 80 30" aria-hidden="true">
        <path :d="sparkPath" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="passage-history__stats">
        <div class="stat">
          <span class="stat__value">{{ best }}</span>
          <span class="stat__label">Best</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ avg }}</span>
          <span class="stat__label">Avg</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.passage-history {
  margin-top: 1.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.passage-history__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.passage-history__title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.passage-history__count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.passage-history__stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.star {
  font-size: 1rem;
  color: #d1d5db;
  transition: color 0.15s;
}

.star--lit {
  color: #f59e0b;
}

.stars__label {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-left: 4px;
}

.passage-history__body {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.sparkline {
  width: 80px;
  height: 30px;
  flex-shrink: 0;
}

.passage-history__stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat__label {
  font-size: 0.7rem;
  color: #9ca3af;
}
</style>
