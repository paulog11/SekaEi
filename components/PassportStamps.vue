<script setup lang="ts">
import { LEVELS } from '~/types/levels'
import { levelStampEarned } from '~/composables/useProgress'
import type { AttemptRecord } from '~/composables/useHistory'

const props = defineProps<{
  history: AttemptRecord[]
}>()

function isEarned(level: (typeof LEVELS)[number]) {
  return levelStampEarned(level, props.history)
}

// SVG inner content for each level's stamp illustration (64×64 viewBox)
const STAMP_SVG: Record<number, string> = {
  // Tokyo Departure — Tokyo Tower
  1: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect x="0" y="50" width="22" height="6" fill="#2563eb" opacity="0.15"/>
    <rect x="42" y="48" width="22" height="8" fill="#2563eb" opacity="0.15"/>
    <polygon points="32,8 35,26 38,40 44,54 20,54 26,40 29,26" fill="#2563eb"/>
    <rect x="27" y="24" width="10" height="3" rx="0.5" fill="#1d4ed8"/>
    <rect x="24" y="38" width="16" height="4" rx="0.5" fill="#1d4ed8"/>
    <rect x="31" y="2" width="2" height="8" rx="1" fill="#2563eb"/>
  `,
  // Honolulu — Diamond Head
  2: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect y="46" width="64" height="18" fill="#bfdbfe" opacity="0.7"/>
    <polygon points="2,46 14,22 30,18 44,26 62,46" fill="#2563eb"/>
    <rect x="52" y="34" width="2" height="14" fill="#2563eb"/>
    <path d="M53,34 Q46,26 40,30 M53,34 Q60,26 67,28 M53,34 Q48,32 44,36 M53,34 Q58,32 62,36" stroke="#2563eb" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  `,
  // Los Angeles — Hollywood Hills & palms
  3: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <circle cx="50" cy="13" r="9" fill="#bfdbfe"/>
    <path d="M 0,52 Q 10,36 22,40 Q 34,28 46,36 Q 56,30 64,40 L 64,64 L 0,64 Z" fill="#2563eb"/>
    <rect x="11" y="30" width="2" height="24" fill="#2563eb"/>
    <path d="M12,30 Q5,22 0,26 M12,30 Q19,22 24,26 M12,30 Q7,28 4,33 M12,30 Q17,28 20,33" stroke="#2563eb" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <rect x="48" y="26" width="2" height="26" fill="#2563eb"/>
    <path d="M49,26 Q42,18 37,22 M49,26 Q56,18 61,22 M49,26 Q44,24 41,28 M49,26 Q54,24 57,28" stroke="#2563eb" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  `,
  // New York — Statue of Liberty
  4: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect y="50" width="64" height="14" fill="#bfdbfe" opacity="0.6"/>
    <rect x="26" y="46" width="14" height="6" fill="#2563eb"/>
    <rect x="24" y="40" width="16" height="8" fill="#2563eb"/>
    <polygon points="28,22 36,22 38,40 25,40" fill="#2563eb"/>
    <circle cx="32" cy="20" r="4" fill="#2563eb"/>
    <polygon points="32,12 30.5,16 33.5,16" fill="#2563eb"/>
    <polygon points="27,14 26,18 28.5,17" fill="#2563eb"/>
    <polygon points="37,14 38,18 35.5,17" fill="#2563eb"/>
    <line x1="27" y1="28" x2="20" y2="20" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="20" cy="19" r="2" fill="#2563eb"/>
    <ellipse cx="20" cy="15" rx="1.5" ry="2.5" fill="#2563eb" opacity="0.7"/>
  `,
  // Washington D.C. — Capitol dome
  5: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect y="54" width="64" height="10" fill="#2563eb" opacity="0.12"/>
    <rect x="6" y="46" width="52" height="10" fill="#2563eb"/>
    <rect x="4" y="48" width="8" height="8" fill="#2563eb"/>
    <rect x="52" y="48" width="8" height="8" fill="#2563eb"/>
    <rect x="22" y="38" width="20" height="10" fill="#2563eb"/>
    <rect x="27" y="28" width="10" height="12" fill="#2563eb"/>
    <path d="M 22,30 A 10,16 0 0 1 42,30 Z" fill="#2563eb"/>
    <rect x="30" y="14" width="4" height="6" fill="#2563eb"/>
    <rect x="29" y="12" width="6" height="3" rx="1" fill="#2563eb"/>
    <line x1="32" y1="9" x2="32" y2="14" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
  `,
  // London — Big Ben
  6: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect y="52" width="64" height="12" fill="#bfdbfe" opacity="0.5"/>
    <rect x="6" y="44" width="52" height="10" fill="#2563eb" opacity="0.35"/>
    <rect x="26" y="16" width="12" height="38" fill="#2563eb"/>
    <rect x="24" y="12" width="16" height="6" rx="1" fill="#2563eb"/>
    <circle cx="32" cy="30" r="5" fill="#eff6ff"/>
    <line x1="32" y1="30" x2="32" y2="26" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="32" y1="30" x2="35" y2="30" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="24,12 32,2 40,12" fill="#2563eb"/>
    <rect x="23" y="8" width="4" height="6" fill="#2563eb"/>
    <rect x="37" y="8" width="4" height="6" fill="#2563eb"/>
    <polygon points="23,8 25,4 27,8" fill="#2563eb"/>
    <polygon points="37,8 39,4 41,8" fill="#2563eb"/>
  `,
  // Paris — Eiffel Tower
  7: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect y="52" width="64" height="12" fill="#2563eb" opacity="0.1"/>
    <polygon points="32,6 33,24 36,38 44,52 20,52 28,38 31,24" fill="#2563eb"/>
    <rect x="22" y="37" width="20" height="3.5" rx="0.5" fill="#1d4ed8"/>
    <rect x="27" y="23" width="10" height="2.5" rx="0.5" fill="#1d4ed8"/>
    <rect x="30" y="7" width="4" height="4" rx="0.5" fill="#2563eb"/>
    <rect x="31.5" y="2" width="1" height="6" rx="0.5" fill="#2563eb"/>
  `,
  // Tokyo Homecoming — airplane over skyline
  8: `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect x="0" y="46" width="8" height="10" fill="#2563eb"/>
    <rect x="9" y="42" width="6" height="14" fill="#2563eb"/>
    <rect x="17" y="44" width="7" height="12" fill="#2563eb"/>
    <rect x="26" y="38" width="5" height="18" fill="#2563eb"/>
    <polygon points="34,32 35.5,44 32.5,44" fill="#2563eb"/>
    <rect x="33.5" y="29" width="1" height="5" fill="#2563eb"/>
    <rect x="42" y="40" width="7" height="16" fill="#2563eb"/>
    <rect x="51" y="44" width="8" height="12" fill="#2563eb"/>
    <ellipse cx="30" cy="18" rx="11" ry="3" fill="#2563eb" transform="rotate(-15 30 18)"/>
    <polygon points="26,19 12,28 17,30 30,22" fill="#2563eb" transform="rotate(-15 30 18)"/>
    <polygon points="34,19 48,28 43,30 30,22" fill="#2563eb" transform="rotate(-15 30 18)"/>
    <polygon points="40,16 44,9 42,20" fill="#2563eb" transform="rotate(-15 30 18)"/>
  `,
}
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <div
      v-for="level in LEVELS"
      :key="level.level"
      class="flex flex-col items-center gap-1.5"
    >
      <div
        class="w-16 h-16 rounded-full border-2 overflow-hidden transition-all"
        :class="isEarned(level)
          ? 'border-solid border-primary rotate-[-6deg] shadow-md'
          : 'border-dashed border-border grayscale opacity-60'"
        :aria-label="`${level.city} stamp — ${isEarned(level) ? 'earned' : 'not earned'}`"
      >
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          class="w-full h-full"
          aria-hidden="true"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <g v-html="STAMP_SVG[level.level]" />
        </svg>
      </div>
      <span class="text-[8px] font-semibold uppercase tracking-wide text-center leading-tight max-w-[72px] text-ink-lighter">
        {{ level.city }}
      </span>
    </div>
  </div>
</template>
