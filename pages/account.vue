<script setup lang="ts">
import { useStreak } from '~/composables/useStreak'
import { useCustomPassages } from '~/composables/useCustomPassages'
import { useApi, getOrCreateDeviceId } from '~/composables/useApi'
import { useTutorialStore } from '~/stores/tutorialStore'
import { useVoicePreference } from '~/composables/useVoicePreference'
import { useTextToSpeech } from '~/composables/useTextToSpeech'
import { ALLOWED_VOICES, VOICE_LABELS } from '~/types/voices'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({})
useHead({ title: 'Account — セカトークXP' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { apiFetch } = useApi()
const tutorialStore = useTutorialStore()
const authStore = useAuthStore()

// ── Auth form state ──────────────────────────────────────────────────────────
const activeTab = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const inviteCodeAtSignup = ref('')
const authError = ref<string | null>(null)
const authLoading = ref(false)
const signupPending = ref(false)
const resendLoading = ref(false)
const resendCooldown = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

// ── Invite code redemption (post-signup) ─────────────────────────────────────
const inviteCode = ref('')
const redeemLoading = ref(false)
const redeemError = ref<string | null>(null)
const redeemSuccess = ref(false)

async function handleRedeemCode() {
  redeemError.value = null
  redeemSuccess.value = false
  const code = inviteCode.value.trim()
  if (!code) return
  redeemLoading.value = true
  try {
    await apiFetch('/api/redeem-code', { method: 'POST', body: { code } })
    await authStore.refreshApproval()
    redeemSuccess.value = true
    inviteCode.value = ''
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    redeemError.value = msg ?? 'Failed to redeem code.'
  } finally {
    redeemLoading.value = false
  }
}

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

async function handleResend() {
  resendLoading.value = true
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value,
      options: { emailRedirectTo: `${window.location.origin}/confirm` },
    })
    if (!error) {
      resendCooldown.value = 60
      resendTimer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0 && resendTimer) {
          clearInterval(resendTimer)
          resendTimer = null
        }
      }, 1000)
    }
  } finally {
    resendLoading.value = false
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
    const code = inviteCodeAtSignup.value.trim().toUpperCase() || undefined
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: code ? { data: { pending_invite_code: code } } : undefined,
    })
    if (error) {
      authError.value = error.message
    } else {
      authError.value = null
      try {
        await apiFetch('/api/devices/claim', { method: 'POST', body: { deviceId: getOrCreateDeviceId() } })
      } catch { /* non-fatal */ }
      await navigateTo('/pending')
    }
  } finally {
    authLoading.value = false
  }
}

async function handleSignOut() {
  await supabase.auth.signOut()
}

// ── Display name ─────────────────────────────────────────────────────────────
const displayName = ref('')
const displayNameInput = ref('')
const displayNameSaving = ref(false)
const displayNameError = ref<string | null>(null)
const displayNameSuccess = ref(false)

// ── University ────────────────────────────────────────────────────────────────
const university = ref('')
const universityInput = ref('')
const universitySaving = ref(false)
const universityError = ref<string | null>(null)
const universitySuccess = ref(false)

async function fetchDisplayName() {
  const { apiFetch: fetch } = useApi()
  try {
    const data = await fetch<{ user: { displayName: string | null; university: string | null } }>('/api/me')
    displayName.value = data.user.displayName ?? ''
    displayNameInput.value = data.user.displayName ?? ''
    university.value = data.user.university ?? ''
    universityInput.value = data.user.university ?? ''
  } catch { /* non-fatal */ }
}

async function saveDisplayName() {
  displayNameError.value = null
  displayNameSuccess.value = false
  const trimmed = displayNameInput.value.trim()
  if (!trimmed) { displayNameError.value = 'Display name cannot be empty.'; return }
  if (trimmed.length > 30) { displayNameError.value = 'Must be 30 characters or fewer.'; return }
  displayNameSaving.value = true
  try {
    const data = await apiFetch<{ displayName: string }>('/api/me', { method: 'PATCH', body: { displayName: trimmed } })
    displayName.value = data.displayName
    displayNameInput.value = data.displayName
    displayNameSuccess.value = true
    setTimeout(() => { displayNameSuccess.value = false }, 3000)
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    displayNameError.value = msg ?? 'Failed to save display name.'
  } finally {
    displayNameSaving.value = false
  }
}

async function saveUniversity() {
  universityError.value = null
  universitySuccess.value = false
  const trimmed = universityInput.value.trim()
  if (trimmed.length > 100) { universityError.value = 'Must be 100 characters or fewer.'; return }
  universitySaving.value = true
  try {
    const data = await apiFetch<{ university: string }>('/api/me', { method: 'PATCH', body: { university: trimmed } })
    university.value = data.university
    universityInput.value = data.university
    universitySuccess.value = true
    setTimeout(() => { universitySuccess.value = false }, 3000)
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    universityError.value = msg ?? 'Failed to save university.'
  } finally {
    universitySaving.value = false
  }
}

// ── Voice preference ─────────────────────────────────────────────────────────
const { voice: selectedVoice, setVoice } = useVoicePreference()
const { play: previewPlay, playingKey: previewPlayingKey } = useTextToSpeech()

function previewVoice(v: string) {
  previewPlay('Hello! I will be your English reading voice.', { voice: v })
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
    await Promise.all([fetchStreak(), fetchPassages(), fetchDisplayName()])
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
      <div class="w-full max-w-2xl flex items-center gap-5">
        <div class="avatar placeholder">
          <div class="w-20 rounded-full bg-gradient-to-br from-violet-200 to-emerald-200">
            <span class="font-heading font-bold text-2xl text-violet-700">
              {{ (displayName || user.email || '?')[0].toUpperCase() }}
            </span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-heading text-xl font-bold text-ink m-0">{{ displayName || 'Learner' }}</p>
          <p class="text-sm text-ink-light m-0 truncate">{{ user.email }}</p>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          <button class="btn-secondary btn-sm" @click="handleSignOut">Sign out</button>
          <NuxtLink to="/practice" class="text-xs text-ink-lighter hover:text-primary underline" @click="tutorialStore.replay()">
            Replay tutorial
          </NuxtLink>
        </div>
      </div>

      <!-- Display name -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">Display Name</h2>
        <div class="flex items-center gap-3">
          <input
            v-model="displayNameInput"
            class="field-input flex-1"
            type="text"
            placeholder="Choose a display name"
            maxlength="30"
            :disabled="displayNameSaving"
            @keydown.enter="saveDisplayName"
          >
          <button
            class="btn-secondary btn-sm shrink-0"
            :disabled="displayNameSaving || !displayNameInput.trim() || displayNameInput.trim() === displayName"
            @click="saveDisplayName"
          >
            {{ displayNameSaving ? 'Saving…' : 'Save' }}
          </button>
        </div>
        <p class="text-xs text-ink-lighter mt-1.5 m-0">{{ displayNameInput.trim().length }}/30 characters. Letters, numbers, spaces, hyphens, underscores, and periods only.</p>
        <p v-if="displayNameError" class="text-sm text-red-600 mt-2 m-0">{{ displayNameError }}</p>
        <p v-if="displayNameSuccess" class="text-sm text-green-600 mt-2 m-0">Display name saved.</p>
      </section>

      <!-- University -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">University</h2>
        <div class="flex items-center gap-3">
          <input
            v-model="universityInput"
            class="field-input flex-1"
            type="text"
            placeholder="Your university or school"
            maxlength="100"
            :disabled="universitySaving"
            @keydown.enter="saveUniversity"
          >
          <button
            class="btn-secondary btn-sm shrink-0"
            :disabled="universitySaving || universityInput.trim() === university"
            @click="saveUniversity"
          >
            {{ universitySaving ? 'Saving…' : 'Save' }}
          </button>
        </div>
        <p class="text-xs text-ink-lighter mt-1.5 m-0">{{ universityInput.trim().length }}/100 characters. Leave blank to clear.</p>
        <p v-if="universityError" class="text-sm text-red-600 mt-2 m-0">{{ universityError }}</p>
        <p v-if="universitySuccess" class="text-sm text-green-600 mt-2 m-0">University saved.</p>
      </section>

      <!-- Program invite code (shown only to non-attendees) -->
      <section v-if="authStore.tier !== 'attendee'" class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-1">Program Code</h2>
        <p class="text-xs text-ink-lighter mb-4 m-0">If you attended our English program, enter your invite code to unlock full features — higher daily limits, AI coaching, and custom passages.</p>
        <div v-if="redeemSuccess" class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-3">
          Welcome to the program! Full features are now unlocked.
        </div>
        <div class="flex items-center gap-3">
          <input
            v-model="inviteCode"
            class="field-input flex-1 uppercase"
            type="text"
            placeholder="XXXX-XXXX"
            maxlength="32"
            autocomplete="off"
            :disabled="redeemLoading"
            @keydown.enter="handleRedeemCode"
          >
          <button
            class="btn-primary btn-sm shrink-0"
            :disabled="redeemLoading || !inviteCode.trim()"
            @click="handleRedeemCode"
          >
            {{ redeemLoading ? 'Redeeming…' : 'Redeem' }}
          </button>
        </div>
        <p v-if="redeemError" class="text-sm text-red-600 mt-2 m-0">{{ redeemError }}</p>
      </section>

      <!-- Daily goal -->
      <section class="w-full max-w-2xl card-pop bg-white p-6">
        <h2 class="text-base font-semibold text-ink mb-4">🎯 Daily Goal</h2>
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

      <!-- Voice preference -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-1">Reading Voice</h2>
        <p class="text-xs text-ink-lighter mb-4 m-0">Choose the voice used when a passage is read aloud.</p>
        <div class="flex flex-col gap-2">
          <label
            v-for="v in ALLOWED_VOICES"
            :key="v"
            class="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors"
            :class="selectedVoice === v ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface'"
          >
            <div class="flex items-center gap-3">
              <input
                type="radio"
                :value="v"
                :checked="selectedVoice === v"
                class="accent-primary"
                @change="setVoice(v)"
              >
              <span class="text-sm font-medium text-ink">{{ VOICE_LABELS[v].name }}</span>
              <span class="text-xs text-ink-lighter">{{ VOICE_LABELS[v].gender }}</span>
            </div>
            <button
              type="button"
              class="btn-secondary btn-sm shrink-0"
              :disabled="previewPlayingKey === `${v}:Hello! I will be your English reading voice.`"
              @click.prevent="previewVoice(v)"
            >
              {{ previewPlayingKey === `${v}:Hello! I will be your English reading voice.` ? 'Playing…' : 'Preview' }}
            </button>
          </label>
        </div>
      </section>

      <!-- Custom passages -->
      <section class="w-full max-w-2xl card">
        <h2 class="text-base font-semibold text-ink mb-4">My Passages</h2>

        <!-- Add form (attendees only) -->
        <div v-if="authStore.tier === 'attendee'" class="flex flex-col gap-3 mb-5">
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
        <p v-else class="text-sm text-ink-lighter mb-5 m-0">
          Custom passages are available to program attendees. Enter your invite code above to unlock this feature.
        </p>

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
          <div v-if="signupPending" class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-4 text-sm text-center flex flex-col items-center gap-3">
            <p class="font-semibold mb-1">Check your inbox</p>
            <p class="m-0">We've sent a confirmation link to <strong>{{ email }}</strong>. Click it to finish creating your account.</p>
            <button
              class="btn-secondary btn-sm mt-1"
              :disabled="resendLoading || resendCooldown > 0"
              @click="handleResend"
            >
              {{ resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email' }}
            </button>
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
            <div class="flex flex-col gap-1.5">
              <label class="field-label" for="signup-code">Program code <span class="text-ink-lighter font-normal">(optional)</span></label>
              <input id="signup-code" v-model="inviteCodeAtSignup" class="field-input uppercase" type="text" placeholder="XXXX-XXXX" maxlength="32" autocomplete="off">
              <p class="text-xs text-ink-lighter m-0">If you attended our English program, enter your invite code to unlock all features.</p>
            </div>
            <button type="submit" class="btn-primary mt-1" :disabled="authLoading">
              {{ authLoading ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        </template>
      </div>
    <!-- About link -->
    <section class="w-full max-w-2xl">
      <NuxtLink to="/about" class="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-white hover:bg-surface transition-colors no-underline">
        <div>
          <p class="text-sm font-semibold text-ink m-0">About セカトークXP</p>
          <p class="text-xs text-ink-lighter m-0 mt-0.5">What this app is and how to use it</p>
        </div>
        <svg class="w-4 h-4 text-ink-lighter shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </section>

    </template>

  </main>
</template>
