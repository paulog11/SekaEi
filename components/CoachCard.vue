<script setup lang="ts">
import type { CoachReply } from '~/types/flaggedWord'

defineProps<{
  result: CoachReply | null
  loading: boolean
  error?: string | null
}>()

defineEmits<{
  (e: 'request'): void
}>()
</script>

<template>
  <div class="coach-card">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-lg">🧠</span>
      <h3 class="text-base font-semibold text-primary m-0">AI Pronunciation Coach</h3>
    </div>

    <template v-if="!result && !loading">
      <p class="text-sm text-ink-medium mb-3">
        Get a personalized analysis of your pronunciation patterns and targeted minimal-pair drills.
      </p>
      <p class="text-sm text-ink-lighter italic">Coming soon!</p>
    </template>

    <template v-else-if="loading">
      <div class="space-y-2">
        <div class="skeleton h-4 w-3/4" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-2/3" />
      </div>
    </template>

    <template v-else-if="result">
      <!-- Pattern -->
      <p class="text-sm text-ink font-medium mb-3">{{ result.pattern }}</p>

      <!-- Minimal pair drills -->
      <div v-if="result.drills.length > 0" class="flex flex-col gap-2 mb-4">
        <p class="text-xs text-ink-lighter uppercase tracking-wider">Minimal pair drills</p>
        <div
          v-for="(drill, i) in result.drills"
          :key="i"
          class="bg-white rounded-lg border border-primary-200 px-3 py-2.5"
        >
          <div class="flex gap-3 items-center mb-1">
            <span class="text-base font-bold text-primary">{{ drill.pair[0] }}</span>
            <span class="text-ink-lighter">vs</span>
            <span class="text-base font-bold text-primary">{{ drill.pair[1] }}</span>
          </div>
          <p class="text-xs text-ink-medium m-0">{{ drill.hint }}</p>
        </div>
      </div>

      <!-- Tip -->
      <div class="bg-white/70 rounded-lg border border-primary-200 px-3 py-2.5">
        <p class="text-xs text-ink-lighter uppercase tracking-wider mb-1">Today's tip</p>
        <p class="text-sm text-ink m-0">{{ result.tip }}</p>
      </div>

      <p class="text-[0.65rem] text-ink-lighter mt-2">Powered by {{ result.model }}{{ result.cached ? ' (cached)' : '' }}</p>
    </template>
  </div>
</template>
