<script setup lang="ts">
import { BADGES } from '~/types/badges'

const props = defineProps<{
  earned: { id: string; earnedAt: string }[]
}>()

function isEarned(id: string) {
  return props.earned.some(b => b.id === id)
}

// SVG inner content keyed by badge id (64×64 viewBox, primary palette #2563eb / #eff6ff)
const BADGE_SVG: Record<string, string> = {
  // 🔥 3-Day Streak — flame
  'streak-3': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <path d="M 32,10 C 40,18 46,28 44,38 C 42,48 38,54 32,56 C 26,54 22,48 20,38 C 18,28 24,18 32,10 Z" fill="#2563eb"/>
    <path d="M 32,10 C 36,6 40,12 38,20 C 36,14 34,13 32,10 Z" fill="#1d4ed8"/>
    <path d="M 32,28 C 36,33 38,40 36,46 C 34,51 32,53 32,53 C 32,53 28,51 28,46 C 26,40 28,33 32,28 Z" fill="#eff6ff" opacity="0.3"/>
  `,
  // ⚡ One Week Strong — lightning bolt
  'streak-7': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <polygon points="40,8 28,8 22,34 33,34 24,56 46,26 36,26" fill="#2563eb"/>
  `,
  // 🏆 Habit Formed — trophy
  'streak-30': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <path d="M 18,14 L 46,14 L 44,36 Q 42,44 32,44 Q 22,44 20,36 Z" fill="#2563eb"/>
    <rect x="14" y="18" width="6" height="16" rx="3" fill="#2563eb"/>
    <rect x="44" y="18" width="6" height="16" rx="3" fill="#2563eb"/>
    <rect x="29" y="44" width="6" height="8" fill="#2563eb"/>
    <rect x="22" y="52" width="20" height="4" rx="1" fill="#2563eb"/>
    <rect x="20" y="54" width="24" height="3" rx="1.5" fill="#1d4ed8"/>
    <polygon points="32,22 33.5,27 39,27 34.5,30.5 36,36 32,32.5 28,36 29.5,30.5 25,27 30.5,27" fill="#eff6ff" opacity="0.45"/>
  `,
  // 🌱 Getting Started — seedling
  'attempts-10': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <path d="M 4,58 Q 32,52 60,58 L 60,64 L 4,64 Z" fill="#2563eb" opacity="0.35"/>
    <rect x="31" y="34" width="2" height="26" fill="#2563eb"/>
    <path d="M 32,46 Q 16,38 18,26 Q 25,33 32,46 Z" fill="#2563eb"/>
    <path d="M 32,40 Q 48,32 46,20 Q 39,27 32,40 Z" fill="#2563eb"/>
    <ellipse cx="32" cy="32" rx="5" ry="6" fill="#2563eb"/>
  `,
  // 💪 Practice Makes Perfect — dumbbell
  'attempts-50': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <rect x="6" y="24" width="10" height="16" rx="3" fill="#2563eb"/>
    <rect x="8" y="20" width="7" height="24" rx="2.5" fill="#1d4ed8"/>
    <rect x="18" y="29" width="28" height="6" fill="#2563eb"/>
    <rect x="48" y="24" width="10" height="16" rx="3" fill="#2563eb"/>
    <rect x="49" y="20" width="7" height="24" rx="2.5" fill="#1d4ed8"/>
  `,
  // 💯 Centurion — medal
  'attempts-100': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <polygon points="28,6 32,4 36,6 34,8 32,6 30,8" fill="#2563eb"/>
    <rect x="30" y="4" width="4" height="12" fill="#2563eb"/>
    <rect x="28" y="4" width="2" height="12" fill="#1d4ed8" opacity="0.7"/>
    <circle cx="32" cy="40" r="20" fill="#2563eb"/>
    <circle cx="32" cy="40" r="15" fill="#eff6ff" opacity="0.2"/>
    <polygon points="32,28 34.5,36 43,36 36.5,41 39,50 32,45 25,50 27.5,41 21,36 29.5,36" fill="#eff6ff" opacity="0.7"/>
  `,
  // 🌟 First Mastery — 5-pointed star burst
  'first-mastery': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <polygon points="32,6 38,24 56,24 42,34 47,53 32,43 17,53 22,34 8,24 26,24" fill="#2563eb"/>
    <polygon points="32,18 35,26 44,26 37,31 40,40 32,35 24,40 27,31 20,26 29,26" fill="#eff6ff" opacity="0.3"/>
  `,
  // 🎯 L/R Master — bullseye with arrow
  'lr-master': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <circle cx="32" cy="36" r="24" fill="#2563eb"/>
    <circle cx="32" cy="36" r="18" fill="#eff6ff"/>
    <circle cx="32" cy="36" r="12" fill="#2563eb"/>
    <circle cx="32" cy="36" r="6" fill="#eff6ff"/>
    <circle cx="32" cy="36" r="3" fill="#2563eb"/>
    <line x1="32" y1="4" x2="32" y2="36" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="32,4 27,14 37,14" fill="#1d4ed8"/>
  `,
  // 👅 TH Tamer — open mouth with tongue tip between teeth (TH phoneme position)
  'th-tamer': `
    <rect width="64" height="64" fill="#eff6ff"/>
    <path d="M 10,30 Q 10,16 32,14 Q 54,16 54,30 L 54,36 Q 54,52 32,54 Q 10,52 10,36 Z" fill="#2563eb"/>
    <path d="M 17,26 Q 17,20 32,20 Q 47,20 47,26 L 47,36 Q 47,46 32,46 Q 17,46 17,36 Z" fill="#eff6ff"/>
    <rect x="22" y="22" width="7" height="10" rx="1" fill="#2563eb" opacity="0.6"/>
    <rect x="30" y="22" width="5" height="10" rx="1" fill="#2563eb" opacity="0.6"/>
    <rect x="36" y="22" width="7" height="10" rx="1" fill="#2563eb" opacity="0.6"/>
    <path d="M 22,36 Q 32,44 42,36 Q 32,48 22,36 Z" fill="#2563eb" opacity="0.5"/>
    <ellipse cx="32" cy="32" rx="9" ry="5" fill="#2563eb" opacity="0.55"/>
  `,
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
        class="w-16 h-16 rounded-full border-2 overflow-hidden transition-all"
        :class="isEarned(badge.id)
          ? 'border-solid border-primary shadow-md'
          : 'border-dashed border-border grayscale opacity-40'"
        :title="badge.description"
        :aria-label="`${badge.name} — ${isEarned(badge.id) ? 'earned' : 'not earned'}`"
      >
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          class="w-full h-full"
          aria-hidden="true"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <g v-html="BADGE_SVG[badge.id]" />
        </svg>
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
