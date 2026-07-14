<script setup lang="ts">
import type { LevelDef } from '~/types/levels'

defineProps<{
  open: boolean
  level: LevelDef
}>()

const emit = defineEmits<{
  close: []
}>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 flex items-center justify-center px-4"
        style="z-index: 60; background: rgba(0,0,0,0.45)"
        aria-modal="true"
        role="dialog"
        aria-label="Level up"
        @click.self="emit('close')"
        @keydown="handleKeydown"
      >
        <div class="bg-white rounded-2xl border-2 border-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] p-6 w-full max-w-sm text-center">
          <p class="text-4xl mb-2" aria-hidden="true">✈️</p>
          <h2 class="font-heading text-lg font-bold text-ink mb-1">Level Up!</h2>
          <p class="text-sm text-ink-light mb-4 m-0">
            Welcome to {{ level.city }}!<br>
            <span class="text-xs text-ink-lighter">{{ level.cityJa }}</span>
          </p>
          <p class="font-heading text-2xl font-bold text-primary my-4">
            {{ level.rank }}
          </p>
          <button class="btn-primary w-full" type="button" @click="emit('close')">
            Continue
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
