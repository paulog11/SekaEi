<script setup lang="ts">
import { computed } from 'vue'
import { levelProgress } from '~/types/levels'

const props = defineProps<{
  total: number
}>()

const progress = computed(() => levelProgress(props.total))
const isMaxLevel = computed(() => progress.value.nextThreshold === null)
</script>

<template>
  <div class="card-pop bg-white flex flex-col gap-1.5 p-4">
    <div class="flex items-baseline justify-between gap-2">
      <p class="font-heading text-sm font-semibold text-ink m-0 truncate">
        {{ progress.level.rank }}
      </p>
      <span class="text-[11px] text-ink-lighter shrink-0 truncate">{{ progress.level.city }}</span>
    </div>
    <progress
      class="progress progress-primary w-full"
      :value="isMaxLevel ? 1 : progress.intoLevel"
      :max="isMaxLevel ? 1 : progress.span"
    />
    <p class="text-[11px] text-ink-lighter m-0">
      <template v-if="isMaxLevel">
        {{ total.toLocaleString() }} XP · {{ progress.level.rank }}
      </template>
      <template v-else>
        {{ progress.intoLevel }} / {{ progress.span }} XP
      </template>
    </p>
  </div>
</template>
