<script setup lang="ts">
import { useInstallPrompt } from '~/composables/useInstallPrompt'

const { canInstall, isIosPrompt, dismissed, install, dismiss } = useInstallPrompt()

const show = computed(() => !dismissed.value && (canInstall.value || isIosPrompt.value))
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="show"
      class="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 mb-6"
    >
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-primary m-0">Add to Home Screen</p>
        <p v-if="isIosPrompt" class="text-xs text-ink-light m-0 mt-0.5">
          Tap the Share button then "Add to Home Screen" for the app experience.
        </p>
        <p v-else class="text-xs text-ink-light m-0 mt-0.5">
          Install SekaEi for quick access — no browser chrome.
        </p>
      </div>
      <button v-if="!isIosPrompt" class="btn-primary btn-sm shrink-0" @click="install">Install</button>
      <button
        class="text-ink-lighter hover:text-ink ml-1 shrink-0"
        aria-label="Dismiss install prompt"
        @click="dismiss"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
