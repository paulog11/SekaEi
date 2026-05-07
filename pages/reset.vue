<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({ title: 'Reset password — SekaEi' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// When Supabase delivers the recovery link it sets a session with type=recovery.
// useSupabaseUser() will be populated if the user arrived via a reset email link.
const isRecovery = ref(false)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

onMounted(() => {
  // If a recovery session already exists the user arrived from the reset email.
  if (user.value) {
    isRecovery.value = true
  }
})

async function handleRequestReset() {
  error.value = null
  success.value = null
  if (!email.value.trim()) {
    error.value = 'Please enter your email address.'
    return
  }
  loading.value = true
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: `${window.location.origin}/reset`,
    })
    if (err) {
      error.value = err.message
    } else {
      success.value = `Check your inbox at ${email.value.trim()} for a reset link.`
    }
  } finally {
    loading.value = false
  }
}

async function handleSetNewPassword() {
  error.value = null
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  loading.value = true
  try {
    const { error: err } = await supabase.auth.updateUser({ password: password.value })
    if (err) {
      error.value = err.message
    } else {
      await navigateTo('/account')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container-page flex flex-col items-center py-16">
    <div class="card w-full max-w-md">

      <!-- ── Set new password (arrived via reset email link) ── -->
      <template v-if="isRecovery">
        <h1 class="text-xl font-bold text-ink mb-6">Set a new password</h1>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm mb-5">
          {{ error }}
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleSetNewPassword">
          <div class="flex flex-col gap-1.5">
            <label class="field-label" for="new-password">New password</label>
            <input
              id="new-password"
              v-model="password"
              class="field-input"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            >
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="field-label" for="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              class="field-input"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            >
          </div>
          <button type="submit" class="btn-primary mt-1" :disabled="loading">
            {{ loading ? 'Saving…' : 'Set new password' }}
          </button>
        </form>
      </template>

      <!-- ── Request reset email ── -->
      <template v-else>
        <h1 class="text-xl font-bold text-ink mb-2">Reset your password</h1>
        <p class="text-sm text-ink-light mb-6">
          Enter the email address for your account and we'll send you a reset link.
        </p>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm mb-5">
          {{ error }}
        </div>

        <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm mb-5">
          {{ success }}
        </div>

        <form v-if="!success" class="flex flex-col gap-4" @submit.prevent="handleRequestReset">
          <div class="flex flex-col gap-1.5">
            <label class="field-label" for="reset-email">Email</label>
            <input
              id="reset-email"
              v-model="email"
              class="field-input"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            >
          </div>
          <button type="submit" class="btn-primary mt-1" :disabled="loading">
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </button>
        </form>

        <NuxtLink to="/account" class="block text-center text-sm text-ink-light hover:text-ink mt-5">
          Back to sign in
        </NuxtLink>
      </template>

    </div>
  </main>
</template>
