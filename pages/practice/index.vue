<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'
import { SAMPLE_PASSAGES, PASSAGE_CATEGORIES, CATEGORY_LABELS } from '~/types/passages'
import type { PassageCategory } from '~/types/passages'
import { useHistory } from '~/composables/useHistory'
import { useCustomPassages } from '~/composables/useCustomPassages'
import { useStreak } from '~/composables/useStreak'
import { passageStars } from '~/composables/useProgress'
import { useApi } from '~/composables/useApi'
import { useTextToSpeech } from '~/composables/useTextToSpeech'
import { useFlaggedWords } from '~/composables/useFlaggedWords'
import { useTutorialStore } from '~/stores/tutorialStore'
import { containsBadWords } from '~/utils/contentFilter'

definePageMeta({ access: 'free' })
useHead({ title: 'Pronunciation — SekaEi' })

const tutorialStore = useTutorialStore()

watchEffect(() => {
  if (tutorialStore.loaded && !tutorialStore.completed && !tutorialStore.active) {
    tutorialStore.start()
  }
})

const selectedPassageId = ref(SAMPLE_PASSAGES[0].id)
const passagePickerOpen = ref(true)
const hasConfirmedPassage = ref(false)
type FilterValue = PassageCategory | 'all'
const selectedCategory = ref<FilterValue>('all')

const { items: customPassages, fetchPassages, addPassage } = useCustomPassages()
const { fetchStreak } = useStreak()

const { apiFetch } = useApi()
const { play: playTts, playingKey: ttsPlayingKey } = useTextToSpeech()
const isRecording = ref(false)
const isPlayingPassage = computed(() =>
  ttsPlayingKey.value === `en-US-AriaNeural:${referenceText.value}`
)

onMounted(() => {
  fetchPassages()
  fetchStreak()
})

const allPassages = computed(() => [
  ...SAMPLE_PASSAGES,
  ...customPassages.value.map(p => ({
    id: `custom:${p.id}`,
    title: p.title,
    source: 'My passages',
    text: p.text,
    category: p.category,
    ipa: p.ipa ?? undefined,
    youtubeId: undefined,
    youtubeStart: undefined,
  })),
])

const filteredPassages = computed(() =>
  selectedCategory.value === 'all'
    ? allPassages.value
    : allPassages.value.filter(p => p.category === selectedCategory.value)
)

const referenceText = computed(() =>
  allPassages.value.find(p => p.id === selectedPassageId.value)?.text ?? ''
)

const selectedPassage = computed(() =>
  allPassages.value.find(p => p.id === selectedPassageId.value) ?? null
)

const activePassageId = computed(() => selectedPassage.value?.id ?? '')

const youtubeEmbedUrl = computed(() => {
  const p = selectedPassage.value
  if (!p || p.category !== 'movies-tv' || !p.youtubeId) return null
  const params = new URLSearchParams({ rel: '0' })
  if (p.youtubeStart != null) params.set('start', String(p.youtubeStart))
  if (p.youtubeEnd != null) params.set('end', String(p.youtubeEnd))
  return `https://www.youtube.com/embed/${p.youtubeId}?${params}`
})

// Passage detail popup
const detailPassage = ref<typeof allPassages.value[0] | null>(null)

const detailPassageAttempts = computed(() =>
  detailPassage.value
    ? allHistory.value.filter(r => r.passageId === detailPassage.value!.id).slice(0, 15)
    : []
)

function openDetail(passage: typeof allPassages.value[0]) {
  detailPassage.value = passage
  tutorialStore.advanceIfOnStep(0)
}

function selectAndClose() {
  tutorialStore.advanceIfOnStep(1)
  if (detailPassage.value && detailPassage.value.id !== selectedPassageId.value) {
    audioWav.value = null
    assessmentResult.value = null
    assessError.value = null
  }
  if (detailPassage.value) selectedPassageId.value = detailPassage.value.id
  detailPassage.value = null
  hasConfirmedPassage.value = true
  passagePickerOpen.value = false
}

// If user closes modal without selecting (X or backdrop), go back to step 0 in the tour
watch(detailPassage, (val, prev) => {
  if (prev !== null && val === null && tutorialStore.currentStep === 1) {
    tutorialStore.goTo(0)
  }
})

function scoreChipClass(score: number): string {
  if (score >= 80) return 'chip-good'
  if (score >= 60) return 'chip-ok'
  return 'chip-bad'
}

function formatAttemptDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Add custom passage popup
const showAddPassage = ref(false)
const newPassageTitle = ref('')
const newPassageText = ref('')
const newPassageCategory = ref<PassageCategory>('custom')
const addingPassage = ref(false)

const passageHasBadWords = computed(() =>
  containsBadWords(newPassageTitle.value) || containsBadWords(newPassageText.value)
)

async function submitNewPassage() {
  if (!newPassageTitle.value.trim() || !newPassageText.value.trim()) return
  addingPassage.value = true
  try {
    const added = await addPassage(newPassageTitle.value.trim(), newPassageText.value.trim(), newPassageCategory.value)
    if (added) selectedPassageId.value = `custom:${added.id}`
    newPassageTitle.value = ''
    newPassageText.value = ''
    newPassageCategory.value = 'custom'
    showAddPassage.value = false
  } finally {
    addingPassage.value = false
  }
}

// Assessment
const audioWav = ref<Blob | null>(null)
const assessmentResult = ref<AssessmentResult | null>(null)
const assessing = ref(false)
const assessError = ref<string | null>(null)

const { addAttempt, getHistory } = useHistory()
const allHistory = ref<import('~/composables/useHistory').AttemptRecord[]>([])

const { words: flaggedWordsList, fetchWords: fetchFlaggedWords, flag: flagWord } = useFlaggedWords()
const flaggedWordsSet = computed(() => new Set(flaggedWordsList.value.map(w => w.word)))

onMounted(async () => {
  allHistory.value = await getHistory()
  fetchFlaggedWords()
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

function onRecordingStarted() {
  isRecording.value = true
  tutorialStore.advanceIfOnStep(3)
}

function onRecorded(wav: Blob) {
  isRecording.value = false
  audioWav.value = wav
  assessmentResult.value = null
  assessError.value = null
  tutorialStore.advanceIfOnStep(4)
}

async function assess() {
  if (!audioWav.value || !referenceText.value) return
  assessing.value = true
  assessError.value = null
  try {
    const form = new FormData()
    form.append('audio', audioWav.value, 'recording.wav')
    form.append('referenceText', referenceText.value)
    const data = await apiFetch<AssessmentResult>('/api/assess', { method: 'POST', body: form })
    assessmentResult.value = data
    tutorialStore.advanceIfOnStep(5)
    await addAttempt({
      passageId: activePassageId.value,
      passageTitle: selectedPassage.value?.title ?? '',
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
  isRecording.value = false
  audioWav.value = null
  assessmentResult.value = null
  assessError.value = null
}
</script>

<template>
  <main class="container-page">
    <h1 class="sr-only">Pronunciation</h1>

    <!-- Passage picker — grid of rich cards -->
    <section class="mb-5">
      <!-- Collapsed: compact passage summary bar + optional YouTube embed -->
      <template v-if="hasConfirmedPassage && !passagePickerOpen">
        <div class="flex items-center justify-between gap-3 bg-white border border-border rounded-xl px-4 py-3 shadow-sm">
          <div class="flex items-center gap-3 min-w-0">
            <svg class="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div class="min-w-0">
              <p class="text-[11px] text-ink-lighter leading-none mb-0.5 m-0">Passage</p>
              <p class="text-sm font-semibold text-ink truncate m-0">{{ selectedPassage?.title }}</p>
            </div>
            <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface text-ink-medium">
              {{ selectedPassage ? CATEGORY_LABELS[selectedPassage.category] : '' }}
            </span>
          </div>
          <button
            type="button"
            class="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-700 transition-colors duration-150"
            @click="passagePickerOpen = true"
          >
            Change
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <!-- YouTube clip embed (movies-tv passages only) -->
        <div v-if="youtubeEmbedUrl" class="mt-3 rounded-xl overflow-hidden aspect-video shadow-sm">
          <iframe
            :src="youtubeEmbedUrl"
            class="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="Clip from passage"
          />
        </div>
      </template>

      <!-- Expanded: full passage picker -->
      <div v-else>
        <div class="flex items-start justify-between mb-3">
          <div>
            <h1 class="text-2xl font-bold text-ink">Pronunciation Practice</h1>
            <h2 class="text-sm font-semibold text-ink-medium">Choose a passage</h2>
          </div>
          <button
            v-if="hasConfirmedPassage"
            type="button"
            class="mt-2 flex items-center gap-1 text-xs font-medium text-ink-medium hover:text-ink transition-colors duration-150"
            @click="passagePickerOpen = false"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            Collapse
          </button>
        </div>

        <!-- Category filter chips -->
        <div class="flex gap-2 overflow-x-auto pb-1 mb-3">
          <button
            type="button"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors duration-150',
              selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-ink-medium border-border hover:border-primary-300',
            ]"
            @click="selectedCategory = 'all'"
          >
            All
          </button>
          <button
            v-for="cat in PASSAGE_CATEGORIES"
            :key="cat"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors duration-150',
              selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-ink-medium border-border hover:border-primary-300',
            ]"
            @click="selectedCategory = cat"
          >
            {{ CATEGORY_LABELS[cat] }}
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <!-- Passage cards -->
          <button
            v-for="(passage, idx) in filteredPassages"
            :key="passage.id"
            type="button"
            :data-tutorial="idx === 0 ? 'passage-card' : undefined"
            :class="[
              'card-pop bg-white p-4 flex flex-col gap-1.5 text-left',
              selectedPassageId === passage.id ? 'border-primary' : '',
            ]"
            @click="openDetail(passage)"
          >
            <span class="font-heading text-sm font-semibold text-ink leading-snug line-clamp-2">{{ passage.title }}</span>
            <span v-if="passage.source" class="text-[11px] text-ink-lighter leading-snug">{{ passage.source }}</span>
            <span class="inline-block self-start text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface text-ink-medium">
              {{ CATEGORY_LABELS[passage.category] }}
            </span>
            <div
              class="rating rating-sm pointer-events-none mt-1"
              :aria-label="`${starsForPassage(passage.id)} out of 3 stars`"
            >
              <span
                v-for="n in 3"
                :key="n"
                class="mask mask-star bg-amber-400"
                :aria-checked="starsForPassage(passage.id) >= n"
              />
            </div>
          </button>

          <!-- Add passage card -->
          <button
            v-if="selectedCategory === 'all' || selectedCategory === 'custom'"
            type="button"
            class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 min-h-[96px] text-ink-lighter hover:border-primary-300 hover:text-primary transition-colors duration-150"
            @click="showAddPassage = true"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-[11px] font-medium">Add passage</span>
          </button>
        </div>

        <!-- Empty state when a filter has no passages -->
        <p
          v-if="filteredPassages.length === 0 && selectedCategory !== 'all'"
          class="text-sm text-ink-lighter text-center py-6"
        >
          No passages in this category yet.
        </p>
      </div>
    </section>

    <!-- Selected passage reading panel -->
    <section class="mb-5">
      <div class="bg-surface border-l-4 border-primary rounded-md px-4 py-3" data-tutorial="reference-panel">
        <div class="flex items-center justify-between gap-2 mb-1">
          <p class="text-xs uppercase tracking-wider text-ink-lighter m-0">
            {{ selectedPassage?.title ?? 'No passage selected' }}
          </p>
          <button
            v-if="referenceText"
            type="button"
            class="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700 disabled:text-ink-lighter transition-colors duration-150"
            :disabled="isPlayingPassage || isRecording"
            :title="isRecording ? 'Stop recording first' : 'Hear native pronunciation'"
            @click="playTts(referenceText)"
          >
            🔊 {{ isPlayingPassage ? 'Playing…' : 'Listen' }}
          </button>
        </div>
        <p class="text-sm text-ink leading-relaxed m-0">{{ referenceText }}</p>
      </div>
    </section>

    <!-- Recorder -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Record yourself</h2>
      <Recorder @recorded="onRecorded" @reset="onRecordAgain" @recording="onRecordingStarted" />
    </section>

    <!-- Assess -->
    <section v-if="audioWav && !assessmentResult" class="mb-5">
      <div v-if="assessing" class="flex flex-col" aria-busy="true" aria-label="Analysing your recording…">
        <div class="skeleton h-16 mb-3 flex items-center justify-center motion-reduce:animate-none">
          <div class="flex items-center gap-2" role="status">
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.32s]" />
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.16s]" />
            <span class="block w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
        <p class="mt-2 text-center text-sm text-ink-lighter">Analysing your recording…</p>
      </div>
      <template v-else>
        <button class="btn-primary btn-large w-full" data-tutorial="check-pronunciation" @click="assess">
          Check My Pronunciation
        </button>
        <div v-if="assessError" class="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p class="flex-1 text-sm text-red-800 m-0">{{ assessError }}</p>
          <button class="btn-secondary btn-sm" @click="assess">Try again</button>
        </div>
      </template>
    </section>

    <!-- Results -->
    <section v-if="assessmentResult" class="mb-5">
      <ScoreDisplay
        :result="assessmentResult"
        :ipa="selectedPassage?.ipa"
        :flagged-words="flaggedWordsSet"
        @flag="(payload) => flagWord({ ...payload, passageId: activePassageId })"
      />
      <PassageHistory
        :passage-id="activePassageId"
        :passage-title="selectedPassage?.title ?? ''"
      />
      <button class="btn-secondary mt-4" data-tutorial="try-again" @click="onRecordAgain">
        Try Again
      </button>
    </section>

    <!-- Passage detail popup -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="detailPassage"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          @click.self="detailPassage = null"
        >
          <div class="bg-white rounded-2xl w-full max-w-md max-h-[80dvh] flex flex-col shadow-xl">
            <div class="flex items-start justify-between px-5 pt-5 pb-3 border-b border-border">
              <div>
                <h3 class="text-base font-semibold text-ink m-0">{{ detailPassage.title }}</h3>
                <p v-if="detailPassage.source" class="text-xs text-ink-lighter mt-0.5 m-0">{{ detailPassage.source }}</p>
                <span class="inline-block mt-1 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface text-ink-medium">
                  {{ CATEGORY_LABELS[detailPassage.category] }}
                </span>
              </div>
              <button
                class="text-ink-lighter hover:text-ink ml-3 shrink-0 mt-0.5"
                aria-label="Close"
                @click="detailPassage = null"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="overflow-y-auto px-5 py-4 flex-1">
              <p class="text-sm text-ink leading-relaxed m-0">{{ detailPassage.text }}</p>
            </div>

            <!-- Previous attempts -->
            <div v-if="detailPassageAttempts.length" class="border-t border-border px-5 pt-3 pb-2">
              <p class="text-xs font-semibold text-ink-medium mb-2">
                Previous attempts ({{ detailPassageAttempts.length }})
              </p>
              <div class="flex flex-col gap-1 max-h-44 overflow-y-auto">
                <NuxtLink
                  v-for="a in detailPassageAttempts"
                  :key="a.slug ?? a.timestamp"
                  :to="`/attempt/${a.slug}`"
                  class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface transition-colors no-underline"
                  @click="detailPassage = null"
                >
                  <span class="text-xs text-ink-lighter">{{ formatAttemptDate(a.timestamp) }}</span>
                  <div class="flex items-center gap-2">
                    <span :class="['chip text-xs px-2 py-0.5', scoreChipClass(a.scores.overall)]">
                      {{ a.scores.overall }}
                    </span>
                    <svg class="w-3.5 h-3.5 text-ink-lighter" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <div class="px-5 py-4 border-t border-border">
              <button class="btn-primary w-full" data-tutorial="practice-this-passage" @click="selectAndClose">
                Practice this passage
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add custom passage popup -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAddPassage"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          @click.self="showAddPassage = false"
        >
          <div class="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl">
            <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h3 class="text-base font-semibold text-ink m-0">Add your own passage</h3>
              <button
                class="text-ink-lighter hover:text-ink ml-3 shrink-0"
                aria-label="Close"
                @click="showAddPassage = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="px-5 py-4 flex flex-col gap-3">
              <div>
                <label class="field-label block mb-1">Category</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="cat in PASSAGE_CATEGORIES"
                    :key="cat"
                    type="button"
                    :class="[
                      'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors duration-150',
                      newPassageCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-ink-medium border-border hover:border-primary-300',
                    ]"
                    @click="newPassageCategory = cat"
                  >
                    {{ CATEGORY_LABELS[cat] }}
                  </button>
                </div>
              </div>
              <div>
                <label class="field-label block mb-1">Title</label>
                <input
                  v-model="newPassageTitle"
                  type="text"
                  class="field-input"
                  placeholder="e.g. My favourite quote"
                  maxlength="80"
                >
              </div>
              <div>
                <div class="flex items-baseline justify-between mb-1">
                  <label class="field-label">Text</label>
                  <span class="text-xs" :class="newPassageText.length > 300 ? 'text-red-500 font-semibold' : 'text-ink-lighter'">
                    {{ newPassageText.length }}/300
                  </span>
                </div>
                <textarea
                  v-model="newPassageText"
                  class="field-input resize-none"
                  rows="5"
                  placeholder="Type or paste any English text here…"
                  maxlength="300"
                />
              </div>
            </div>
            <div class="px-5 pb-5 flex flex-col gap-3">
              <div
                v-if="passageHasBadWords"
                class="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5"
                role="alert"
              >
                <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p class="text-sm text-red-700 m-0">Please refrain from using bad language.</p>
              </div>
              <button
                class="btn-primary w-full"
                :disabled="!newPassageTitle.trim() || !newPassageText.trim() || newPassageText.length > 300 || addingPassage || passageHasBadWords"
                @click="submitNewPassage"
              >
                {{ addingPassage ? 'Adding…' : 'Add passage' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>
