<script setup lang="ts">
import { useHistory } from '~/composables/useHistory'
import { useStreak } from '~/composables/useStreak'
import { usePhonemeStats } from '~/composables/usePhonemeStats'
import { useCustomPassages } from '~/composables/useCustomPassages'
import { passageStars } from '~/composables/useProgress'
import { useApi, getOrCreateDeviceId } from '~/composables/useApi'

useHead({ title: 'Account — SekaEi' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { apiFetch } = useApi()

// ── Auth form state ──────────────────────────────────────────────────────────
const activeTab = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const authError = ref<string | null>(null)
const authLoading = ref(false)
const signupPending = ref(false)

function switchTab(tab: 'signin' | 'signup') {
  activeTab.value = tab
  authError.value = null
  signupPending.value = false
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleSignIn() {
  authError.value = null
  authLoading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) {
      authError.value = error.message
    } else {
      // Claim any pre-auth anonymous device attempts — idempotent, safe to call each sign-in
      try {
        await apiFetch('/api/devices/claim', { method: 'POST', body: { deviceId: getOrCreateDeviceId() } })
      } catch { /* non-fatal */ }
    }
  } finally {
    authLoading.value = false
  }
}

async function handleSignUp() {
  authError.value = null
  if (password.value !== confirmPassword.value) {
    authError.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 12) {
    authError.value = 'Password must be at least 12 characters.'
    return
  }
  authLoading.value = true
  try {
    const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
    if (error) {
      authError.value = error.message
    } else {
      // Email confirmation is required — session is null until the user clicks the link.
      // Device claim will happen in /confirm once the session is established.
      signupPending.value = true
      authError.value = null
    }
  } finally {
    authLoading.value = false
  }
}

async function handleSignOut() {
  await supabase.auth.signOut()
}

// ── Authenticated user data ──────────────────────────────────────────────────
const { getHistory } = useHistory()
const { streak, fetchStreak, setGoal } = useStreak()
const { weakest, fetchStats } = usePhonemeStats()
const { items: customPassages, loading: passagesLoading, fetchPassages, addPassage, deletePassage } = useCustomPassages()

const history = ref<import('~/composables/useHistory').AttemptRecord[]>([])
const historyLoading = ref(false)

const newPassageTitle = ref('')
const newPassageText = ref('')
const addingPassage = ref(false)
const passageError = ref<string | null>(null)

const goalInput = ref(5)

watch(user, async (u) => {
  if (u) {
    historyLoading.value = true
    ;[history.value] = await Promise.all([
      getHistory(),
      fetchStreak(),
      fetchStats(),
      fetchPassages(),
    ])
    goalInput.value = streak.value.goalMinutes
    historyLoading.value = false
  }
}, { immediate: true })

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

async function saveGoal() {
  await setGoal(goalInput.value)
}

async function handleAddPassage() {
  if (!newPassageTitle.value.trim() || !newPassageText.value.trim()) return
  passageError.value = null
  addingPassage.value = true
  const result = await addPassage(newPassageTitle.value.trim(), newPassageText.value.trim())
  addingPassage.value = false
  if (result) {
    newPassageTitle.value = ''
    newPassageText.value = ''
  } else {
    passageError.value = 'Failed to save passage. Title may already be in use.'
  }
}
</script>

<template>
  <main class="container-page flex flex-col items-center gap-8">

    <!-- ── Signed-in view ── -->
    <template v-if="user">
      <div class="w-full max-w-2xl flex items-center justify-between">
        <div>
          <p class="text-sm text-ink-light m-0">Signed in as</p>
          <p class="font-semibold text-ink m-0">{{ user.email }}</p>
        </div>
        <button class="btn-secondary btn-sm" @click="handleSignOut">Sign out</button>
      </div>

      <!-- Streak -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">Practice Streak</h2>
        <div class="flex gap-6 flex-wrap">
          <div class="text-center">
            <p class="text-3xl font-bold text-primary m-0">{{ streak.current }}</p>
            <p class="text-xs text-ink-lighter m-0">Current streak</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-ink m-0">{{ streak.longest }}</p>
            <p class="text-xs text-ink-lighter m-0">Longest streak</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold m-0" :class="streak.todayMet ? 'text-green-600' : 'text-amber-600'">
              {{ streak.todayMet ? '✓ Goal met today' : '○ Not yet today' }}
            </p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <label class="text-sm text-ink-medium" for="goal-input">Daily goal (minutes):</label>
          <input
            id="goal-input"
            v-model.number="goalInput"
            type="number"
            min="1"
            max="120"
            class="field-input w-20"
          >
          <button class="btn-secondary btn-sm" @click="saveGoal">Save</button>
        </div>
      </section>

      <!-- Phoneme focus list -->
      <section v-if="weakest.length" class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-3">Phonemes to Focus On</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="stat in weakest"
            :key="stat.phoneme"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-mono bg-red-50 border border-red-200 text-red-700"
          >
            /{{ stat.phoneme }}/ <span class="text-xs text-red-400">{{ stat.avgScore }}%</span>
          </span>
        </div>
      </section>

      <!-- Passage mastery -->
      <section v-if="historyLoading || masteryRows.length" class="w-full max-w-2xl">
        <h2 class="text-base font-semibold text-ink-medium mb-3">Passage Mastery</h2>
        <p v-if="historyLoading" class="text-sm text-ink-lighter m-0">Loading…</p>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="row in masteryRows"
            :key="row.passageId"
            class="flex items-center justify-between gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5"
          >
            <span class="flex-1 min-w-0 truncate text-sm font-medium text-ink mr-3">{{ row.passageTitle }}</span>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs text-ink-lighter">{{ row.attempts.length }} attempt{{ row.attempts.length !== 1 ? 's' : '' }}</span>
              <span class="flex gap-px" :aria-label="`${passageStars(row.attempts)} out of 3 stars`">
                <span v-for="n in 3" :key="n" :class="['star text-sm', { 'star-lit': passageStars(row.attempts) >= n }]">★</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Custom passages -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">My Passages</h2>

        <!-- Add form -->
        <div class="flex flex-col gap-3 mb-5">
          <input
            v-model="newPassageTitle"
            class="field-input"
            type="text"
            placeholder="Passage title"
            maxlength="120"
          >
          <textarea
            v-model="newPassageText"
            class="field-input resize-y"
            rows="3"
            placeholder="Paste text here…"
            maxlength="2000"
          />
          <div v-if="passageError" class="text-sm text-red-600">{{ passageError }}</div>
          <button
            class="btn-primary btn-sm self-start"
            :disabled="addingPassage || !newPassageTitle.trim() || !newPassageText.trim()"
            @click="handleAddPassage"
          >
            {{ addingPassage ? 'Saving…' : 'Save passage' }}
          </button>
        </div>

        <!-- List -->
        <p v-if="passagesLoading" class="text-sm text-ink-lighter m-0">Loading…</p>
        <p v-else-if="!customPassages.length" class="text-sm text-ink-lighter m-0">No custom passages yet.</p>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="p in customPassages"
            :key="p.id"
            class="flex items-start justify-between gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink m-0 truncate">{{ p.title }}</p>
              <p class="text-xs text-ink-lighter m-0 line-clamp-2 mt-0.5">{{ p.text }}</p>
            </div>
            <button
              class="btn-secondary btn-sm shrink-0 text-red-600 border-red-200 hover:bg-red-50"
              @click="deletePassage(p.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </section>
    </template>

    <!-- ── Sign-in / Sign-up form ── -->
    <template v-else>
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

        <!-- Error notice -->
        <div v-if="authError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm mb-5">
          {{ authError }}
        </div>

        <!-- Sign in form -->
        <form v-if="activeTab === 'signin'" class="flex flex-col gap-4" @submit.prevent="handleSignIn">
          <div class="flex flex-col gap-1.5">
            <label class="field-label" for="signin-email">Email</label>
            <input id="signin-email" v-model="email" class="field-input" type="email" placeholder="you@example.com" autocomplete="email" required>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="field-label" for="signin-password">Password</label>
            <input id="signin-password" v-model="password" class="field-input" type="password" placeholder="••••••••" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn-primary mt-1" :disabled="authLoading">
            {{ authLoading ? 'Signing in…' : 'Sign in' }}
          </button>
          <NuxtLink to="/reset" class="text-sm text-ink-light hover:text-ink text-center">
            Forgot password?
          </NuxtLink>
        </form>

        <!-- Sign up form -->
        <template v-else>
          <div v-if="signupPending" class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-4 text-sm text-center">
            <p class="font-semibold mb-1">Check your inbox</p>
            <p>We've sent a confirmation link to <strong>{{ email }}</strong>. Click it to finish creating your account.</p>
          </div>
          <form v-else class="flex flex-col gap-4" @submit.prevent="handleSignUp">
            <div class="flex flex-col gap-1.5">
              <label class="field-label" for="signup-email">Email</label>
              <input id="signup-email" v-model="email" class="field-input" type="email" placeholder="you@example.com" autocomplete="email" required>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="field-label" for="signup-password">Password</label>
              <input id="signup-password" v-model="password" class="field-input" type="password" placeholder="••••••••" autocomplete="new-password" minlength="12" required>
              <p class="text-xs text-ink-lighter m-0">At least 12 characters with uppercase, lowercase, and a digit.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="field-label" for="signup-confirm">Confirm password</label>
              <input id="signup-confirm" v-model="confirmPassword" class="field-input" type="password" placeholder="••••••••" autocomplete="new-password" required>
            </div>
            <button type="submit" class="btn-primary mt-1" :disabled="authLoading">
              {{ authLoading ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        </template>
      </div>
    </template>

  </main>
</template>
