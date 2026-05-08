<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'
import { SAMPLE_PASSAGES } from '~/types/passages'
import { useHistory } from '~/composables/useHistory'
import { useCustomPassages } from '~/composables/useCustomPassages'
import { useStreak } from '~/composables/useStreak'
import { passageStars, customPassageId } from '~/composables/useProgress'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Practice — SekaEi' })

const selectedPassageId = ref(SAMPLE_PASSAGES[0].id)
const customText = ref('')

const { items: customPassages, fetchPassages } = useCustomPassages()
const { fetchStreak } = useStreak()

onMounted(() => {
  fetchPassages()
  fetchStreak()
})

const allPassages = computed(() => [
  ...SAMPLE_PASSAGES,
  ...customPassages.value.map(p => ({ id: `custom:${p.id}`, title: p.title, source: 'My passages', text: p.text, ipa: p.ipa ?? undefined })),
])

const referenceText = computed(() => {
  if (customText.value.trim()) return customText.value.trim()
  return allPassages.value.find(p => p.id === selectedPassageId.value)?.text ?? ''
})

const selectedPassage = computed(() =>
  customText.value.trim() ? null : allPassages.value.find(p => p.id === selectedPassageId.value) ?? null
)

const activePassageId = computed(() =>
  selectedPassage.value ? selectedPassage.value.id : customPassageId(customText.value)
)

const audioWav = ref<Blob | null>(null)
const assessmentResult = ref<AssessmentResult | null>(null)
const assessing = ref(false)
const assessError = ref<string | null>(null)

const { addAttempt, getHistory } = useHistory()

const allHistory = ref<import('~/composables/useHistory').AttemptRecord[]>([])

onMounted(async () => {
  allHistory.value = await getHistory()
})

function starsForPassage(passageId: string) {
  return passageStars(allHistory.value.filter(r => r.passageId === passageId))
}

function friendlyError(err: unknown): string {
  const e = err as { status?: number; data?: { message?: string } }
  if (e?.status === 401 || e?.status === 403)
    return 'Your session has expired. Please sign in again.'
  if (e?.status === 429)
    return e?.data?.message ?? 'Too many requests. Please wait before trying again.'
  const msg = e?.data?.message ?? ''
  if (msg.includes('No speech recognized') || msg.includes('NoMatch'))
    return 'No speech was detected. Make sure your microphone is working and try again.'
  if (msg.includes('Permission denied') || msg.includes('permission'))
    return 'Microphone access was denied. Check your browser permissions and try again.'
  if (msg.includes('Network') || msg.includes('fetch'))
    return 'Network error — check your connection and try again.'
  return msg || 'Assessment failed. Please try again.'
}

function onRecorded(wav: Blob) {
  audioWav.value = wav
  assessmentResult.value = null
  assessError.value = null
}

async function assess() {
  if (!audioWav.value || !referenceText.value) return

  assessing.value = true
  assessError.value = null

  try {
    const form = new FormData()
    form.append('audio', audioWav.value, 'recording.wav')
    form.append('referenceText', referenceText.value)

    const data = await $fetch<AssessmentResult>('/api/assess', {
      method: 'POST',
      body: form,
    })
    assessmentResult.value = data

    await addAttempt({
      passageId: activePassageId.value,
      passageTitle: selectedPassage.value?.title ?? customText.value.trim().slice(0, 40),
      timestamp: Date.now(),
      scores: {
        accuracy: data.PronunciationAssessment.AccuracyScore,
        fluency: data.PronunciationAssessment.FluencyScore,
        completeness: data.PronunciationAssessment.CompletenessScore,
        prosody: data.PronunciationAssessment.ProsodyScore,
        overall: data.PronunciationAssessment.PronScore,
      },
    }, data)

    allHistory.value = await getHistory()
    fetchStreak()
  } catch (err: unknown) {
    assessError.value = friendlyError(err)
  } finally {
    assessing.value = false
  }
}

function onRecordAgain() {
  audioWav.value = null
  assessmentResult.value = null
  assessError.value = null
}
</script>

<template>
  <main class="container-page">
    <header class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-ink">SekaEi</h1>
      <p class="text-ink-light mt-1">English pronunciation practice — record yourself and get instant feedback.</p>
    </header>

    <section class="mb-10">
      <h2 class="section-title">1. Choose a passage</h2>

      <div class="flex gap-3 -mx-5 px-5 pb-2 overflow-x-auto snap-x snap-mandatory sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-3 sm:gap-4">
        <label
          v-for="passage in allPassages"
          :key="passage.id"
          :class="[
            'snap-start shrink-0 w-72 sm:w-auto',
            'flex flex-col gap-1 cursor-pointer rounded-xl border-2 p-4',
            'transition-colors duration-150',
            selectedPassageId === passage.id && !customText.trim()
              ? 'border-primary bg-primary-50'
              : 'border-border hover:border-primary-300',
          ]"
        >
          <input
            v-model="selectedPassageId"
            type="radio"
            :value="passage.id"
            class="sr-only"
            @change="customText = ''"
          >
          <div class="flex items-center justify-between">
            <strong class="text-ink text-sm">{{ passage.title }}</strong>
            <span class="flex gap-px" :aria-label="`${starsForPassage(passage.id)} stars`">
              <span v-for="n in 3" :key="n" :class="['star text-sm', { 'star-lit': starsForPassage(passage.id) >= n }]">★</span>
            </span>
          </div>
          <span class="text-xs text-ink-lighter">{{ passage.source }}</span>
          <p class="mt-1 text-sm text-ink-medium leading-relaxed m-0">{{ passage.text }}</p>
        </label>
      </div>

      <div class="relative my-4 text-center text-xs text-ink-lighter">
        <span class="relative bg-white px-3">or paste your own text</span>
        <span class="absolute inset-x-0 top-1/2 h-px bg-border -z-10" />
      </div>

      <textarea
        v-model="customText"
        class="field-input resize-y"
        rows="4"
        placeholder="Type or paste any English text here…"
      />
    </section>

    <section class="mb-10">
      <h2 class="section-title">2. Record yourself reading</h2>

      <div class="bg-surface border-l-4 border-primary rounded-md px-4 py-3 mb-4">
        <p class="text-xs uppercase tracking-wider text-ink-lighter mb-1 m-0">Reading:</p>
        <p class="text-base text-ink leading-relaxed m-0">{{ referenceText }}</p>
      </div>

      <Recorder @recorded="onRecorded" @reset="onRecordAgain" />
    </section>

    <section v-if="audioWav && !assessmentResult" class="mb-10">
      <h2 class="section-title">3. Analyse pronunciation</h2>

      <div v-if="assessing" class="flex flex-col" aria-busy="true" aria-label="Analysing your recording…">
        <div class="skeleton h-20 mb-3 motion-reduce:animate-none" />
        <div class="skeleton h-12 motion-reduce:animate-none" />
        <p class="mt-3 text-center text-sm text-ink-lighter">Analysing your recording…</p>
      </div>

      <template v-else>
        <button class="btn-primary btn-large" @click="assess">
          Check My Pronunciation
        </button>

        <div v-if="assessError" class="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p class="flex-1 text-sm text-red-800 m-0">{{ assessError }}</p>
          <button class="btn-secondary btn-sm" @click="assess">Try again</button>
        </div>
      </template>
    </section>

    <section v-if="assessmentResult" class="mb-10">
      <ScoreDisplay
        :result="assessmentResult"
        :ipa="selectedPassage?.ipa"
      />

      <PassageHistory
        :passage-id="activePassageId"
        :passage-title="selectedPassage?.title ?? customText.trim().slice(0, 40)"
      />

      <button class="btn-secondary mt-4" @click="onRecordAgain">
        Try Again
      </button>
    </section>
  </main>
</template>
