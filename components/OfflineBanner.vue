<script setup lang="ts">
import { useOnline } from '~/composables/useOnline'

const { online } = useOnline()
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-200"
    enter-from-class="-translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200"
    leave-from-class="translate-y-0"
    leave-to-class="-translate-y-full"
  >
    <div
      v-if="!online"
      class="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-100 border-b border-amber-300 px-4 py-2.5"
      role="status"
      aria-live="polite"
    >
      <svg class="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p class="text-sm font-medium text-amber-900 m-0">You're offline — your progress won't be saved.</p>
    </div>
  </Transition>
</template>
