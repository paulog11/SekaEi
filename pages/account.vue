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
  <main class="container-page flex flex-col items-center gap-8">
    <!-- Mastery section -->
    <section v-if="historyLoading || masteryRows.length" class="w-full max-w-md">
      <h2 class="text-base font-semibold text-ink-medium mb-3">Passage Mastery</h2>
      <p v-if="historyLoading" class="text-sm text-ink-lighter m-0">Loading…</p>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="row in masteryRows"
          :key="row.passageId"
          class="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5"
        >
          <span class="flex-1 min-w-0 truncate text-sm font-medium text-ink mr-3">
            {{ row.passageTitle }}
          </span>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-ink-lighter">
              {{ row.attempts.length }} attempt{{ row.attempts.length !== 1 ? 's' : '' }}
            </span>
            <span class="flex gap-px" :aria-label="`${passageStars(row.attempts)} out of 3 stars`">
              <span v-for="n in 3" :key="n" :class="['star text-sm', { 'star-lit': passageStars(row.attempts) >= n }]">★</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Auth card -->
    <div class="card w-full max-w-md">
      <!-- Tabs -->
      <div class="flex border-b-2 border-border mb-7">
        <button
          v-for="t in (['signin', 'signup'] as const)"
          :key="t"
          :class="[
            'flex-1 py-2.5 text-sm font-semibold border-b-2 -mb-0.5 transition-colors cursor-pointer bg-transparent',
            activeTab === t
              ? 'text-primary border-primary'
              : 'text-ink-light border-transparent hover:text-ink-medium',
          ]"
          @click="switchTab(t)"
        >
          {{ t === 'signin' ? 'Sign in' : 'Create account' }}
        </button>
      </div>

      <!-- Notice -->
      <div v-if="submitted" class="bg-primary-50 border border-primary-200 text-primary-700 rounded-lg px-4 py-2.5 text-sm mb-5">
        Authentication isn't enabled in this preview.
      </div>

      <!-- Sign in form -->
      <form v-if="activeTab === 'signin'" class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signin-email">Email</label>
          <input id="signin-email" class="field-input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signin-password">Password</label>
          <input id="signin-password" class="field-input" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn-primary mt-1">Sign in</button>
      </form>

      <!-- Sign up form -->
      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signup-name">Name</label>
          <input id="signup-name" class="field-input" type="text" placeholder="Your name" autocomplete="name">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signup-email">Email</label>
          <input id="signup-email" class="field-input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signup-password">Password</label>
          <input id="signup-password" class="field-input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="field-label" for="signup-confirm">Confirm password</label>
          <input id="signup-confirm" class="field-input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <button type="submit" class="btn-primary mt-1">Create account</button>
      </form>
    </div>
  </main>
</template>
