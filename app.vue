<script setup lang="ts">
import { ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'

const { apiFetch } = useApi()
onMounted(() => {
  apiFetch('/api/me').catch(() => {})
})

const mobileNavOpen = ref(false)
const route = useRoute()
watch(route, () => { mobileNavOpen.value = false })
</script>

<template>
  <header class="border-b border-border bg-white sticky top-0 z-30">
    <div class="max-w-page mx-auto px-5 h-14 flex items-center justify-between">
      <NuxtLink to="/" class="text-lg font-bold tracking-tight text-ink no-underline">SekaEi</NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden sm:flex gap-1">
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink to="/practice" class="nav-link">Practice</NuxtLink>
        <NuxtLink to="/account" class="nav-link">Account</NuxtLink>
      </nav>

      <!-- Mobile hamburger -->
      <button
        class="sm:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-ink-medium hover:bg-surface transition-colors"
        :aria-expanded="mobileNavOpen"
        aria-controls="mobile-nav"
        aria-label="Open menu"
        @click="mobileNavOpen = !mobileNavOpen"
      >
        <svg v-if="!mobileNavOpen" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile nav overlay -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <nav
        v-if="mobileNavOpen"
        id="mobile-nav"
        class="sm:hidden border-t border-border bg-white px-5 py-2 flex flex-col gap-1"
      >
        <NuxtLink to="/" class="nav-link-mobile" @click="mobileNavOpen = false">Home</NuxtLink>
        <NuxtLink to="/practice" class="nav-link-mobile" @click="mobileNavOpen = false">Practice</NuxtLink>
        <NuxtLink to="/account" class="nav-link-mobile" @click="mobileNavOpen = false">Account</NuxtLink>
      </nav>
    </Transition>
  </header>

  <NuxtPage />
</template>
