<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => {
  if (props.error.statusCode === 404) return 'Page not found'
  if (props.error.statusCode === 403) return "You don't have access to this page"
  return 'Something went wrong'
})

const message = computed(() => {
  if (props.error.statusCode === 404) return "We couldn't find what you were looking for."
  if (props.error.statusCode === 403) return "You don't have permission to view this page."
  return "An error occurred on our end. Please try again."
})

function goHome() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <div class="max-w-page mx-auto px-5 h-14 flex items-center">
      <NuxtLink to="/" class="flex items-center gap-1.5 no-underline">
        <span class="text-lg font-bold tracking-tight text-ink">セカトーク</span>
        <span class="text-[11px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-md tracking-widest leading-none">XP</span>
      </NuxtLink>
    </div>

    <main class="flex-1 flex flex-col items-center justify-center px-5 text-center">
      <p class="text-6xl font-heading font-bold text-primary m-0 mb-4">{{ error.statusCode }}</p>
      <h1 class="text-xl font-heading font-bold text-ink m-0 mb-2">{{ title }}</h1>
      <p class="text-sm text-ink-light m-0 mb-8 max-w-xs">{{ message }}</p>
      <button class="btn-primary" @click="goHome">Back to dashboard</button>
    </main>
  </div>
</template>
