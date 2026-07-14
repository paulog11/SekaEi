<script setup lang="ts">
import { computed } from 'vue'
import { LEVELS, levelForXp } from '~/types/levels'
import { SAMPLE_PASSAGES } from '~/types/passages'
import type { Passage } from '~/types/passages'
import { passageStars, levelStampEarned } from '~/composables/useProgress'
import type { AttemptRecord } from '~/composables/useHistory'

const props = defineProps<{
  history: AttemptRecord[]
  xpTotal: number
}>()

const emit = defineEmits<{
  select: [passage: Passage]
}>()

const currentLevel = computed(() => levelForXp(props.xpTotal))

function passagesForLevel(passageIds: string[]): Passage[] {
  return passageIds
    .map(id => SAMPLE_PASSAGES.find(p => p.id === id))
    .filter((p): p is Passage => p !== undefined)
}

function starsFor(passageId: string) {
  return passageStars(props.history.filter(r => r.passageId === passageId))
}
</script>

<template>
  <div class="flex flex-col">
    <div
      v-for="(level, idx) in LEVELS"
      :key="level.level"
      class="relative pl-6"
      :class="idx < LEVELS.length - 1 ? 'pb-6 border-l-2 border-dashed border-border ml-2' : 'ml-2'"
    >
      <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow"
        :class="level.level === currentLevel.level ? 'bg-primary' : levelStampEarned(level, history) ? 'bg-emerald-500' : 'bg-surface'"
      />

      <!-- Level header -->
      <div
        class="card-pop bg-white p-3 flex flex-col gap-1"
        :class="level.level === currentLevel.level ? 'border-2 border-primary' : ''"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="font-heading text-sm font-semibold text-ink m-0 truncate">
              Lv {{ level.level }} · {{ level.city }}
            </p>
            <p class="text-[11px] text-ink-lighter m-0">{{ level.cityJa }} · {{ level.rank }}</p>
          </div>
          <div class="flex flex-col items-end gap-0.5 shrink-0">
            <span
              v-if="level.level === currentLevel.level"
              class="text-[10px] font-semibold text-primary whitespace-nowrap"
            >
              You are here ✈️
            </span>
            <span
              v-if="levelStampEarned(level, history)"
              class="text-[10px] font-semibold text-emerald-600 whitespace-nowrap"
              title="Passport stamp earned"
            >
              ✓ Stamp earned
            </span>
            <span class="text-[10px] text-ink-lighter whitespace-nowrap">{{ level.xpThreshold }} XP</span>
          </div>
        </div>

        <!-- Passage stops -->
        <div class="flex flex-col gap-1.5 mt-1.5">
          <button
            v-for="passage in passagesForLevel(level.passageIds)"
            :key="passage.id"
            type="button"
            class="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-left hover:bg-primary-50 transition-colors duration-150"
            @click="emit('select', passage)"
          >
            <div class="min-w-0">
              <p class="text-xs font-medium text-ink m-0 truncate">{{ passage.title }}</p>
              <p v-if="passage.source" class="text-[10px] text-ink-lighter m-0 truncate">{{ passage.source }}</p>
            </div>
            <div
              class="rating rating-sm pointer-events-none shrink-0"
              :aria-label="`${starsFor(passage.id)} out of 3 stars`"
            >
              <span
                v-for="n in 3"
                :key="n"
                class="mask mask-star bg-amber-400"
                :aria-checked="starsFor(passage.id) >= n"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
