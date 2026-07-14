<script setup lang="ts">
import { BADGES } from '~/types/badges'

const props = defineProps<{
  earned: { id: string; earnedAt: string }[]
}>()

function isEarned(id: string) {
  return props.earned.some(b => b.id === id)
}
</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
    <div
      v-for="badge in BADGES"
      :key="badge.id"
      class="flex flex-col items-center gap-1 text-center"
    >
      <div
        class="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl"
        :class="isEarned(badge.id)
          ? 'border-solid border-primary bg-primary-50'
          : 'border-dashed border-border grayscale opacity-40'"
        :title="badge.description"
        :aria-label="`${badge.name} — ${isEarned(badge.id) ? 'earned' : 'not earned'}`"
      >
        <span aria-hidden="true">{{ badge.emoji }}</span>
      </div>
      <span
        class="text-[11px] font-semibold leading-tight line-clamp-2"
        :class="isEarned(badge.id) ? 'text-ink' : 'text-ink-lighter'"
      >
        {{ badge.name }}
      </span>
    </div>
  </div>
</template>
