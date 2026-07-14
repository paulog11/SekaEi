<script setup lang="ts">
import { LEVELS } from '~/types/levels'
import { levelStampEarned } from '~/composables/useProgress'
import type { AttemptRecord } from '~/composables/useHistory'

const props = defineProps<{
  history: AttemptRecord[]
}>()

const STAMP_EMOJI: Record<number, string> = {
  1: '🗼',
  2: '🌺',
  3: '🎬',
  4: '🗽',
  5: '🏛',
  6: '🎡',
  7: '🥐',
  8: '✈️',
}

function isEarned(level: (typeof LEVELS)[number]) {
  return levelStampEarned(level, props.history)
}
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <div
      v-for="level in LEVELS"
      :key="level.level"
      class="flex flex-col items-center gap-1"
    >
      <div
        class="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center text-center px-1"
        :class="isEarned(level)
          ? 'border-solid border-primary bg-primary-50 text-primary rotate-[-6deg]'
          : 'border-dashed border-border text-ink-lighter'"
        :aria-label="`${level.city} stamp — ${isEarned(level) ? 'earned' : 'not earned'}`"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ STAMP_EMOJI[level.level] }}</span>
        <span class="text-[8px] font-semibold uppercase tracking-wide leading-tight mt-0.5 line-clamp-2">
          {{ level.city }}
        </span>
      </div>
    </div>
  </div>
</template>
