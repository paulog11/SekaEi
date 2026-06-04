<script setup lang="ts">
import { computed } from 'vue'
import { TIER_LABELS, type Tier } from '~/server/utils/tierLimits'

const props = defineProps<{ tier: Tier }>()
const isAttendee = computed(() => props.tier === 'attendee')
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="isAttendee ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'"
  >
    <span v-if="isAttendee" aria-hidden="true">✦</span>{{ TIER_LABELS[props.tier] }}
  </span>
</template>
