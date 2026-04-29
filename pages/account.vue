<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { passageStars } from '~/composables/useProgress'

useHead({ title: 'Account — SekaEi' })

const activeTab = ref<'signin' | 'signup'>('signin')
const submitted = ref(false)

function handleSubmit() {
  submitted.value = true
}

function switchTab(tab: 'signin' | 'signup') {
  activeTab.value = tab
  submitted.value = false
}

const { getHistory } = useHistory()

const history = ref<import('~/composables/useHistory').AttemptRecord[]>([])
const historyLoading = ref(true)

onMounted(async () => {
  history.value = await getHistory()
  historyLoading.value = false
})

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
  <main class="page">
    <section v-if="historyLoading || masteryRows.length" class="mastery-section">
      <h2 class="mastery-title">Passage Mastery</h2>
      <p v-if="historyLoading" class="mastery-loading">Loading…</p>
      <div v-if="!historyLoading" class="mastery-list">
        <div v-for="row in masteryRows" :key="row.passageId" class="mastery-row">
          <span class="mastery-row__title">{{ row.passageTitle }}</span>
          <div class="mastery-row__right">
            <span class="mastery-row__count">{{ row.attempts.length }} attempt{{ row.attempts.length !== 1 ? 's' : '' }}</span>
            <span class="star-row" :aria-label="`${passageStars(row.attempts)} out of 3 stars`">
              <span v-for="n in 3" :key="n" :class="['star', { 'star--lit': passageStars(row.attempts) >= n }]">★</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="card">
      <div class="tabs">
        <button
          :class="['tab', { 'tab--active': activeTab === 'signin' }]"
          @click="switchTab('signin')"
        >
          Sign in
        </button>
        <button
          :class="['tab', { 'tab--active': activeTab === 'signup' }]"
          @click="switchTab('signup')"
        >
          Create account
        </button>
      </div>

      <div v-if="submitted" class="notice">
        Authentication isn't enabled in this preview.
      </div>

      <form v-if="activeTab === 'signin'" class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label" for="signin-email">Email</label>
          <input id="signin-email" class="input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="field">
          <label class="label" for="signin-password">Password</label>
          <input id="signin-password" class="input" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn--primary">Sign in</button>
      </form>

      <form v-else class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label" for="signup-name">Name</label>
          <input id="signup-name" class="input" type="text" placeholder="Your name" autocomplete="name">
        </div>
        <div class="field">
          <label class="label" for="signup-email">Email</label>
          <input id="signup-email" class="input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="field">
          <label class="label" for="signup-password">Password</label>
          <input id="signup-password" class="input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <div class="field">
          <label class="label" for="signup-confirm">Confirm password</label>
          <input id="signup-confirm" class="input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn--primary">Create account</button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.mastery-section {
  width: 100%;
  max-width: 420px;
}

.mastery-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.mastery-loading {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.mastery-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mastery-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
}

.mastery-row__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 0.75rem;
}

.mastery-row__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.mastery-row__count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.star-row {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 0.9rem;
  color: #d1d5db;
}

.star--lit {
  color: #f59e0b;
}

.card {
  width: 100%;
  max-width: 420px;
  margin-top: 0;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 2rem;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  flex: 1;
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab:hover { color: #374151; }
.tab--active { color: #2563eb; border-bottom-color: #2563eb; }

.notice {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  color: #1d4ed8;
  margin-bottom: 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: #2563eb; }

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}
.btn:hover { opacity: 0.85; }
.btn--primary { background: #2563eb; color: white; }
</style>
