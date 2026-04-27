<script setup lang="ts">
import type { AssessmentResult } from '~/types/assessment'
import { SAMPLE_PASSAGES } from '~/types/passages'

useHead({ title: 'SekaEi — English Pronunciation Practice' })

const selectedPassageId = ref(SAMPLE_PASSAGES[0].id)
const customText = ref('')

const referenceText = computed(() => {
  if (customText.value.trim()) return customText.value.trim()
  return SAMPLE_PASSAGES.find(p => p.id === selectedPassageId.value)?.text ?? ''
})

const audioWav = ref<Blob | null>(null)
const assessmentResult = ref<AssessmentResult | null>(null)
const assessing = ref(false)
const assessError = ref<string | null>(null)

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
  } catch (err: unknown) {
    assessError.value = (err as { data?: { message?: string } })?.data?.message ?? 'Assessment failed. Please try again.'
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
  <main class="page">
    <header class="page__header">
      <h1 class="page__title">SekaEi</h1>
      <p class="page__subtitle">English pronunciation practice — record yourself and get instant feedback.</p>
    </header>

    <section class="page__section">
      <h2 class="section-title">1. Choose a passage</h2>

      <div class="passage-selector">
        <label
          v-for="passage in SAMPLE_PASSAGES"
          :key="passage.id"
          :class="['passage-card', { 'passage-card--active': selectedPassageId === passage.id && !customText.trim() }]"
        >
          <input
            v-model="selectedPassageId"
            type="radio"
            :value="passage.id"
            class="sr-only"
            @change="customText = ''"
          >
          <strong>{{ passage.title }}</strong>
          <span class="passage-card__source">{{ passage.source }}</span>
          <p class="passage-card__text">{{ passage.text }}</p>
        </label>
      </div>

      <div class="divider">or paste your own text</div>

      <textarea
        v-model="customText"
        class="custom-text"
        rows="4"
        placeholder="Type or paste any English text here…"
      />
    </section>

    <section class="page__section">
      <h2 class="section-title">2. Record yourself reading</h2>
      <div class="reference-box">
        <p class="reference-box__label">Reading:</p>
        <p class="reference-box__text">{{ referenceText }}</p>
      </div>
      <Recorder @recorded="onRecorded" @reset="onRecordAgain" />
    </section>

    <section v-if="audioWav && !assessmentResult" class="page__section">
      <h2 class="section-title">3. Analyse pronunciation</h2>
      <button
        class="btn btn--primary btn--large"
        :disabled="assessing"
        @click="assess"
      >
        {{ assessing ? 'Analysing…' : 'Check My Pronunciation' }}
      </button>
      <p v-if="assessError" class="error-msg">{{ assessError }}</p>
    </section>

    <section v-if="assessmentResult" class="page__section">
      <ScoreDisplay :result="assessmentResult" />
      <button class="btn btn--secondary" style="margin-top:1rem" @click="onRecordAgain">
        Try Again
      </button>
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  font-family: system-ui, sans-serif;
}

.page__header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.page__title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #111827;
}

.page__subtitle {
  color: #6b7280;
  margin-top: 0.25rem;
}

.page__section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.passage-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.passage-card {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.9rem 1.1rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.passage-card:hover { border-color: #93c5fd; }
.passage-card--active { border-color: #2563eb; background: #eff6ff; }

.passage-card__source {
  font-size: 0.75rem;
  color: #9ca3af;
}

.passage-card__text {
  font-size: 0.875rem;
  color: #374151;
  margin-top: 4px;
  line-height: 1.5;
}

.divider {
  text-align: center;
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 1rem 0;
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e5e7eb;
}
.divider::before { left: 0; }
.divider::after  { right: 0; }

.custom-text {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.custom-text:focus { border-color: #2563eb; }

.reference-box {
  background: #f9fafb;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.reference-box__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 4px;
}

.reference-box__text {
  font-size: 0.95rem;
  color: #1f2937;
  line-height: 1.6;
}

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:hover:not(:disabled) { opacity: 0.85; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary   { background: #2563eb; color: white; }
.btn--secondary { background: #e5e7eb; color: #1f2937; }
.btn--large     { padding: 0.8rem 2rem; font-size: 1rem; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

.error-msg {
  margin-top: 0.75rem;
  color: #b91c1c;
  font-size: 0.875rem;
}
</style>
