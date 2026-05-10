<script setup lang="ts">
import { useStreak } from '~/composables/useStreak'
import { useCustomPassages } from '~/composables/useCustomPassages'
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
const { streak, fetchStreak, setGoal } = useStreak()
const { items: customPassages, loading: passagesLoading, fetchPassages, addPassage, deletePassage } = useCustomPassages()

const newPassageTitle = ref('')
const newPassageText = ref('')
const addingPassage = ref(false)
const passageError = ref<string | null>(null)

const goalInput = ref(5)

watch(user, async (u) => {
  if (u) {
    await Promise.all([fetchStreak(), fetchPassages()])
    goalInput.value = streak.value.goalMinutes
  }
}, { immediate: true })

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
      <!-- Profile header -->
      <div class="w-full max-w-2xl flex items-center justify-between">
        <div>
          <p class="text-sm text-ink-light m-0">Signed in as</p>
          <p class="font-semibold text-ink m-0">{{ user.email }}</p>
        </div>
        <button class="btn-secondary btn-sm" @click="handleSignOut">Sign out</button>
      </div>

      <!-- Daily goal -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">Daily Goal</h2>
        <div class="flex items-center gap-3">
          <label class="text-sm text-ink-medium" for="goal-input">Practice minutes per day:</label>
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
        <p class="text-xs text-ink-lighter mt-2 m-0">
          Today's goal: <span :class="streak.todayMet ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'">
            {{ streak.todayMet ? 'Met ✓' : 'Not yet' }}
          </span>
        </p>
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
