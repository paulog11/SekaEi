<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'
import { SAMPLE_PASSAGES } from '~/types/passages'
import { useHistory } from '~/composables/useHistory'
import { useCustomPassages } from '~/composables/useCustomPassages'
import { useStreak } from '~/composables/useStreak'
import { passageStars } from '~/composables/useProgress'
import { useApi } from '~/composables/useApi'
import { useFlaggedWords } from '~/composables/useFlaggedWords'

definePageMeta({ middleware: ['stage', 'auth'] })
useHead({ title: 'Pronunciation — SekaEi' })

const selectedPassageId = ref(SAMPLE_PASSAGES[0].id)

const { items: customPassages, fetchPassages, addPassage } = useCustomPassages()
const { fetchStreak } = useStreak()

const { apiFetch } = useApi()

onMounted(() => {
  fetchPassages()
  fetchStreak()
})

const allPassages = computed(() => [
  ...SAMPLE_PASSAGES,
  ...customPassages.value.map(p => ({ id: `custom:${p.id}`, title: p.title, source: 'My passages', text: p.text, ipa: p.ipa ?? undefined })),
])

const referenceText = computed(() =>
  allPassages.value.find(p => p.id === selectedPassageId.value)?.text ?? ''
)

const selectedPassage = computed(() =>
  allPassages.value.find(p => p.id === selectedPassageId.value) ?? null
)

const activePassageId = computed(() => selectedPassage.value?.id ?? '')

// Passage detail popup
const detailPassage = ref<typeof allPassages.value[0] | null>(null)

function openDetail(passage: typeof allPassages.value[0]) {
  detailPassage.value = passage
}

function selectAndClose() {
  if (detailPassage.value) selectedPassageId.value = detailPassage.value.id
  detailPassage.value = null
}

// Add custom passage popup
const showAddPassage = ref(false)
const newPassageTitle = ref('')
const newPassageText = ref('')
const addingPassage = ref(false)

async function submitNewPassage() {
  if (!newPassageTitle.value.trim() || !newPassageText.value.trim()) return
  addingPassage.value = true
  try {
    const added = await addPassage(newPassageTitle.value.trim(), newPassageText.value.trim())
    if (added) selectedPassageId.value = `custom:${added.id}`
    newPassageTitle.value = ''
    newPassageText.value = ''
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
    const data = await apiFetch<AssessmentResult>('/api/assess', { method: 'POST', body: form })
    assessmentResult.value = data
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
  audioWav.value = null
  assessmentResult.value = null
  assessError.value = null
}
</script>

<template>
  <main class="container-page">
    <h1 class="sr-only">Pronunciation</h1>

    <!-- Passage picker — horizontal scroll row of compact chips -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Choose a passage</h2>

      <div class="flex gap-2 px-1 pb-1 overflow-x-auto snap-x snap-mandatory scrollbar-none">
        <!-- Passage chips -->
        <button
          v-for="passage in allPassages"
          :key="passage.id"
          type="button"
          :class="[
            'snap-start shrink-0 flex flex-col gap-0.5 text-left',
            'rounded-xl border-2 px-3 py-2.5 transition-colors duration-150 min-w-[120px] max-w-[160px]',
            selectedPassageId === passage.id
              ? 'border-primary bg-primary-50'
              : 'border-border bg-white hover:border-primary-300',
          ]"
          @click="openDetail(passage)"
        >
          <span class="text-xs font-semibold text-ink leading-snug line-clamp-2">{{ passage.title }}</span>
          <span class="flex gap-px mt-1" :aria-label="`${starsForPassage(passage.id)} stars`">
            <span v-for="n in 3" :key="n" :class="['text-[10px]', starsForPassage(passage.id) >= n ? 'text-star-lit' : 'text-star-unlit']">★</span>
          </span>
        </button>

        <!-- Add passage chip -->
        <button
          type="button"
          class="snap-start shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border px-4 py-2.5 min-w-[80px] text-ink-lighter hover:border-primary-300 hover:text-primary transition-colors duration-150"
          @click="showAddPassage = true"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-[10px] font-medium">Add</span>
        </button>
      </div>
    </section>

    <!-- Selected passage reading panel -->
    <section class="mb-5">
      <div class="bg-surface border-l-4 border-primary rounded-md px-4 py-3">
        <p class="text-xs uppercase tracking-wider text-ink-lighter mb-1 m-0">
          {{ selectedPassage?.title ?? 'No passage selected' }}
        </p>
        <p class="text-sm text-ink leading-relaxed m-0 line-clamp-3">{{ referenceText }}</p>
        <button
          v-if="referenceText"
          type="button"
          class="mt-1.5 text-xs text-primary font-medium"
          @click="detailPassage = selectedPassage"
        >
          Read full text
        </button>
      </div>
    </section>

    <!-- Recorder -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-ink-medium mb-3">Record yourself</h2>
      <Recorder @recorded="onRecorded" @reset="onRecordAgain" />
    </section>

    <!-- Assess -->
    <section v-if="audioWav && !assessmentResult" class="mb-5">
      <div v-if="assessing" class="flex flex-col" aria-busy="true" aria-label="Analysing your recording…">
        <div class="skeleton h-16 mb-3 motion-reduce:animate-none" />
        <p class="mt-2 text-center text-sm text-ink-lighter">Analysing your recording…</p>
      </div>
      <template v-else>
        <button class="btn-primary btn-large w-full" @click="assess">
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
      <button class="btn-secondary mt-4" @click="onRecordAgain">
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
            <div class="px-5 py-4 border-t border-border">
              <button class="btn-primary w-full" @click="selectAndClose">
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
                <label class="field-label block mb-1">Text</label>
                <textarea
                  v-model="newPassageText"
                  class="field-input resize-none"
                  rows="5"
                  placeholder="Type or paste any English text here…"
                />
              </div>
            </div>
            <div class="px-5 pb-5">
              <button
                class="btn-primary w-full"
                :disabled="!newPassageTitle.trim() || !newPassageText.trim() || addingPassage"
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
