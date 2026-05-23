<script setup lang="ts">
import { useTutorialStore } from '~/stores/tutorialStore'

const user = useSupabaseUser()
const tutorialStore = useTutorialStore()
const route = useRoute()
const appReady = useState('appReady', () => true)

const noNavRoutes = ['/pending', '/confirm', '/reset', '/dev-only']
const showNav = computed(() => !noNavRoutes.includes(route.path))

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito:wght@400;500;600;700&display=swap',
    },
  ],
})

onMounted(() => {
  if (user.value) tutorialStore.fetch()
})

watch(user, (u) => {
  if (u) tutorialStore.fetch()
})
</script>

<template>
  <!-- Auth-check loading overlay — client only, covers page while /api/me is in-flight -->
  <AppLoading v-if="!appReady" />

  <!-- Top header — desktop only, hidden on auth/gate pages -->
  <header v-if="showNav" class="hidden sm:block border-b border-border bg-white sticky top-0 z-30">
    <div class="max-w-page mx-auto px-5 h-14 flex items-center justify-between">
      <NuxtLink to="/" class="text-lg font-bold tracking-tight text-ink no-underline">セカトーク</NuxtLink>

      <nav class="flex gap-1">
        <NuxtLink to="/" class="nav-link">Dashboard</NuxtLink>
        <NuxtLink to="/practice" class="nav-link">Pronunciation</NuxtLink>
        <NuxtLink to="/practice/words" class="nav-link">Words</NuxtLink>
        <NuxtLink to="/idiomslang" class="nav-link">Idioms</NuxtLink>
        <NuxtLink to="/account" class="nav-link">{{ user ? 'Account' : 'Sign in' }}</NuxtLink>
      </nav>
    </div>
  </header>

  <NuxtPage />

  <!-- Bottom tab bar — mobile only, hidden on auth/gate pages -->
  <BottomTabBar v-if="showNav" />

  <!-- First-time user tutorial overlay -->
  <TutorialOverlay />
</template>
