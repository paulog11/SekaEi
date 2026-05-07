<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

useHead({ title: 'Confirming — SekaEi' })

const user = useSupabaseUser()
const { apiFetch, getDeviceId } = useApi()
const error = ref<string | null>(null)

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
</script>

<template>
  <main class="container-page flex flex-col items-center justify-center py-24 gap-4">
    <template v-if="error">
      <p class="text-lg font-semibold text-red-600">Link invalid or expired</p>
      <p class="text-sm text-ink-light">{{ error }}</p>
      <NuxtLink to="/account" class="btn-primary btn-sm mt-2">Back to sign in</NuxtLink>
    </template>
    <template v-else>
      <p class="text-lg font-semibold text-ink">Email confirmed!</p>
      <p class="text-sm text-ink-light">Redirecting you to practice…</p>
    </template>
  </main>
</template>
