<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/practice',       label: 'Pronunciation', aria: 'Pronunciation tab' },
  { to: '/practice/words', label: 'Words',         aria: 'Difficult Words tab' },
  { to: '/real-english',   label: 'Idioms',        aria: 'Real English tab'  },
  { to: '/',               label: 'Dashboard',     aria: 'Dashboard tab'     },
  { to: '/account',        label: 'Account',       aria: 'Account tab'       },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <nav
    aria-label="Main navigation"
    class="fixed bottom-0 inset-x-0 sm:hidden z-30 border-t border-border bg-white"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :aria-label="tab.aria"
        :aria-current="isActive(tab.to) ? 'page' : undefined"
        class="bottom-tab"
        :class="{ 'bottom-tab-active': isActive(tab.to) }"
      >
        <!-- Real English: speech bubble -->
        <template v-if="tab.to === '/real-english'">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 4.5A9 9 0 1 0 12 3a9 9 0 0 0-9 9c0 1.7.47 3.29 1.29 4.64L3 21l4.36-1.29A8.96 8.96 0 0 0 12 21" />
          </svg>
        </template>

        <!-- Words: bookmark/star -->
        <template v-else-if="tab.to === '/practice/words'">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </template>

        <!-- Practice: microphone -->
        <template v-else-if="tab.to === '/practice'">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path stroke-linecap="round" d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round" />
            <line x1="9" y1="21" x2="15" y2="21" stroke-linecap="round" />
          </svg>
        </template>

        <!-- Progress: bar chart -->
        <template v-else-if="tab.to === '/'">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3"  y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7"  width="4" height="14" rx="1" />
            <rect x="17" y="3"  width="4" height="18" rx="1" />
          </svg>
        </template>

        <!-- Account: user circle -->
        <template v-else>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path stroke-linecap="round" d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
          </svg>
        </template>

        <span class="text-[11px] leading-none font-medium">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
