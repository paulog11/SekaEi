<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import { usePitchContour } from '~/composables/usePitchContour'
import type { PitchSeries } from '~/types/pitch'
import type { AzureWord } from '~/types/assessment'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, zoomPlugin)

const props = defineProps<{
  studentAudio: Blob
  nativeAudio: Blob | null
  words?: AzureWord[]
}>()

const { extract } = usePitchContour()

const loading = ref(true)
const studentSeries = ref<PitchSeries | null>(null)
const nativeSeries = ref<PitchSeries | null>(null)
const extractionError = ref<string | null>(null)

async function runExtraction() {
  loading.value = true
  extractionError.value = null
  studentSeries.value = null
  nativeSeries.value = null

  try {
    const [student, native] = await Promise.all([
      extract(props.studentAudio),
      props.nativeAudio ? extract(props.nativeAudio) : Promise.resolve(null),
    ])
    studentSeries.value = student
    nativeSeries.value = native
  } catch (err) {
    console.warn('[PitchContourChart] extraction failed:', err)
    extractionError.value = 'Pitch extraction failed. Please try recording again.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.studentAudio, props.nativeAudio] as const,
  () => runExtraction(),
  { immediate: true },
)

const BUCKET_COUNT = 100
const AZURE_TICKS_PER_SEC = 10_000_000

// Words start at their first bucket; surrounding buckets are blank.
const wordTickLabels = computed<string[]>(() => {
  const labels = Array.from({ length: BUCKET_COUNT }, () => '')
  const dur = studentSeries.value?.durationSec ?? 0
  if (!props.words?.length || dur <= 0) return labels
  for (const word of props.words) {
    if (word.PronunciationAssessment.ErrorType === 'Omission') continue
    const startSec = word.Offset / AZURE_TICKS_PER_SEC
    const bucket = Math.min(Math.max(0, Math.floor((startSec / dur) * BUCKET_COUNT)), BUCKET_COUNT - 1)
    if (!labels[bucket]) labels[bucket] = word.Word
  }
  return labels
})

// Every bucket within a word's span maps to the word — used for tooltip headers.
const bucketToWord = computed<string[]>(() => {
  const map = Array.from({ length: BUCKET_COUNT }, () => '')
  const dur = studentSeries.value?.durationSec ?? 0
  if (!props.words?.length || dur <= 0) return map
  for (const word of props.words) {
    if (word.PronunciationAssessment.ErrorType === 'Omission') continue
    const startSec = word.Offset / AZURE_TICKS_PER_SEC
    const endSec = (word.Offset + word.Duration) / AZURE_TICKS_PER_SEC
    const startBucket = Math.max(0, Math.floor((startSec / dur) * BUCKET_COUNT))
    const endBucket = Math.min(BUCKET_COUNT - 1, Math.floor((endSec / dur) * BUCKET_COUNT))
    for (let i = startBucket; i <= endBucket; i++) map[i] = word.Word
  }
  return map
})

function toBuckets(series: PitchSeries, buckets: number): (number | null)[] {
  const result: (number | null)[] = new Array(buckets).fill(null)
  if (series.samples.length === 0 || series.medianHz === 0) return result

  const counts: number[] = new Array(buckets).fill(0)
  const sums: number[] = new Array(buckets).fill(0)

  for (const { t, hz } of series.samples) {
    const idx = Math.min(Math.floor((t / series.durationSec) * buckets), buckets - 1)
    const semitones = 12 * Math.log2(hz / series.medianHz)
    sums[idx] += semitones
    counts[idx]++
  }

  for (let i = 0; i < buckets; i++) {
    result[i] = counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : null
  }
  return result
}

const chartData = computed<ChartData<'line'>>(() => {
  const labels = Array.from({ length: BUCKET_COUNT }, (_, i) => `${i + 1}%`)

  const datasets = []

  if (nativeSeries.value) {
    datasets.push({
      label: 'Native',
      data: toBuckets(nativeSeries.value, BUCKET_COUNT),
      borderColor: '#6366f1',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: false,
      tension: 0.3,
    })
  }

  if (studentSeries.value) {
    datasets.push({
      label: 'You',
      data: toBuckets(studentSeries.value, BUCKET_COUNT),
      borderColor: '#ec4899',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: false,
      tension: 0.3,
    })
  }

  return { labels, datasets }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  animation: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { font: { size: 12 }, boxWidth: 16 },
    },
    zoom: {
      pan: { enabled: true, mode: 'x' },
      zoom: {
        wheel: { enabled: true, speed: 0.1 },
        pinch: { enabled: true },
        drag: { enabled: false },
        mode: 'x',
      },
      limits: {
        x: { min: 0, max: BUCKET_COUNT - 1, minRange: 5 },
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (items) => {
          const idx = items[0]?.dataIndex ?? 0
          const word = bucketToWord.value[idx]
          return word ? `"${word}" — ${idx + 1}%` : `${idx + 1}%`
        },
        label: (ctx) => {
          const val = ctx.parsed.y
          if (val === null) return `${ctx.dataset.label}: —`
          const sign = val >= 0 ? '+' : ''
          return `${ctx.dataset.label}: ${sign}${val} st`
        },
      },
    },
  },
  scales: {
    x: {
      title: { display: true, text: 'Word', font: { size: 11 } },
      ticks: {
        autoSkip: false,
        maxRotation: 90,
        minRotation: 90,
        font: { size: 10 },
        callback: (_val, index) => wordTickLabels.value[index] || '',
      },
      grid: { display: false },
    },
    y: {
      title: { display: true, text: 'Pitch (semitones from median)', font: { size: 11 } },
      ticks: { font: { size: 11 } },
    },
  },
}))

const hasSufficientData = computed(
  () => (studentSeries.value?.samples.length ?? 0) >= 5,
)

const chartRef = ref<InstanceType<typeof Line> | null>(null)
function resetZoom() {
  // vue-chartjs exposes the underlying Chart.js instance via the `chart` property
  const instance = (chartRef.value as unknown as { chart?: { resetZoom: () => void } } | null)?.chart
  instance?.resetZoom()
}
</script>

<template>
  <div class="bg-white border border-border rounded-xl px-4 py-4 shadow-sm">
    <h3 class="text-sm font-semibold text-ink mb-1">Pitch Contour</h3>
    <p class="text-xs text-ink-lighter mb-3">
      How your pitch rises and falls compared to a native speaker, relative to each voice's median.
      Try to match the native line's rises and falls on each word next time — rises often mark emphasis or questions, falls mark statement endings.
    </p>

    <!-- Loading skeleton -->
    <div v-if="loading" class="animate-pulse h-52 bg-gray-100 rounded-lg" />

    <!-- Error state -->
    <p v-else-if="extractionError" class="text-sm text-red-700">{{ extractionError }}</p>

    <!-- Not enough pitch detected in student audio -->
    <p v-else-if="!hasSufficientData" class="text-sm text-amber-700">
      Couldn't detect a clear pitch in your recording. Try recording in a quieter environment.
    </p>

    <!-- Chart -->
    <template v-else>
      <div class="flex items-center justify-between gap-2 mb-1">
        <p class="text-[11px] text-ink-lighter m-0">
          Scroll or pinch to zoom into a section. Click and drag to pan across the utterance.
        </p>
        <button
          type="button"
          class="text-[11px] font-medium text-primary hover:text-primary-700 transition-colors duration-150"
          @click="resetZoom"
        >
          Reset zoom
        </button>
      </div>
      <Line ref="chartRef" :data="chartData" :options="chartOptions" />
      <p v-if="!nativeAudio" class="mt-2 text-xs text-amber-700">
        Native pitch unavailable for this passage.
      </p>
    </template>
  </div>
</template>
