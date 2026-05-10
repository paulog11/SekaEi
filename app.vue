<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const { apiFetch } = useApi()
const user = useSupabaseUser()

onMounted(() => {
  apiFetch('/api/me').catch(() => {})
})
</script>

<template>
  <!-- Top header — desktop only -->
  <header class="hidden sm:block border-b border-border bg-white sticky top-0 z-30">
    <div class="max-w-page mx-auto px-5 h-14 flex items-center justify-between">
      <NuxtLink to="/" class="text-lg font-bold tracking-tight text-ink no-underline">SekaEi</NuxtLink>

      <nav class="flex gap-1">
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink to="/practice" class="nav-link">Practice</NuxtLink>
        <NuxtLink to="/progress" class="nav-link">Progress</NuxtLink>
        <NuxtLink to="/account" class="nav-link">{{ user ? 'Account' : 'Sign in' }}</NuxtLink>
      </nav>
    </div>
  </header>

  <NuxtPage />

  <!-- Bottom tab bar — mobile only -->
  <BottomTabBar />
</template>
