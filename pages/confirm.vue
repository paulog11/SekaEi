<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

useSekaSeoMeta({ title: 'Confirming — セカトークXP', noindex: true })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { apiFetch, getDeviceId } = useApi()
const error = ref<string | null>(null)
const resendEmail = ref('')
const resendLoading = ref(false)
const resendSent = ref(false)
const resendCooldown = ref(0)

onMounted(async () => {
  // Supabase populates the session from the URL fragment before this fires.
  // If no session exists, the link is invalid or expired.
  if (!user.value) {
    error.value = 'Confirmation link is invalid or expired.'
    return
  }
  try {
    await apiFetch('/api/devices/claim', { method: 'POST', body: { deviceId: getDeviceId() } })
  } catch { /* non-fatal — device claim failure doesn't block access */ }
  await navigateTo('/practice')
})

async function handleResend() {
  if (!resendEmail.value) return
  resendLoading.value = true
  try {
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: resendEmail.value,
      options: { emailRedirectTo: `${window.location.origin}/confirm` },
    })
    if (!resendError) {
      resendSent.value = true
      resendCooldown.value = 60
      const timer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) clearInterval(timer)
      }, 1000)
    }
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <main class="container-page flex flex-col items-center justify-center py-24 gap-4">
    <template v-if="error">
      <div class="card w-full max-w-sm flex flex-col items-center gap-4 text-center">
        <p class="text-lg font-semibold text-red-600">Link invalid or expired</p>
        <p class="text-sm text-ink-light m-0">Enter your email to receive a new confirmation link.</p>
        <template v-if="resendSent">
          <p class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 w-full m-0">
            Sent! Check your inbox.
          </p>
          <button
            v-if="resendCooldown > 0"
            class="btn-secondary btn-sm"
            disabled
          >
            Resend in {{ resendCooldown }}s
          </button>
          <button v-else class="btn-secondary btn-sm" @click="handleResend">Resend again</button>
        </template>
        <template v-else>
          <input
            v-model="resendEmail"
            type="email"
            class="field-input w-full"
            placeholder="you@example.com"
            @keydown.enter="handleResend"
          >
          <button
            class="btn-primary btn-sm w-full"
            :disabled="resendLoading || !resendEmail"
            @click="handleResend"
          >
            {{ resendLoading ? 'Sending…' : 'Resend confirmation email' }}
          </button>
        </template>
        <NuxtLink to="/account" class="text-sm text-ink-light hover:text-ink underline">Back to sign in</NuxtLink>
      </div>
    </template>
    <template v-else>
      <p class="text-lg font-semibold text-ink">Email confirmed!</p>
      <p class="text-sm text-ink-light">Redirecting you to practice…</p>
      <p class="text-xs text-ink-lighter text-center max-w-xs">
        確認することで
        <NuxtLink to="/privacy" class="underline hover:text-ink-light">プライバシーポリシー</NuxtLink>
        と
        <NuxtLink to="/terms" class="underline hover:text-ink-light">利用規約</NuxtLink>
        に同意したものとみなされます。
      </p>
    </template>
  </main>
</template>
