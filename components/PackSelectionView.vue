<script setup lang="ts">
import { useIdiomLabStore } from '~/stores/idiomLabStore'
import type { IdiomPack } from '~/types/idioms'

const store = useIdiomLabStore()
const emit = defineEmits<{ (e: 'select', packIndex: number): void }>()

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
function toRoman(n: number): string { return ROMAN[n] ?? String(n) }

function variantClass(index: number): string {
  if (index === 1) return 'pack-card--rose'
  return ''
}

function difficultyColor(d: IdiomPack['difficulty']): string {
  if (d === 'Intermediate') return 'bg-amber-400 text-amber-900'
  if (d === 'Advanced')     return 'bg-red-400 text-red-900'
  return 'bg-emerald-400 text-emerald-900'
}

function handleOpen(index: number) {
  store.selectPack(index)
  emit('select', index)
}
</script>

<template>
  <div class="flex flex-col items-center gap-8 py-8">
    <div class="text-center">
      <h2 class="text-xl font-heading font-bold text-ink">Choose a Pack</h2>
      <p class="text-sm text-ink-light mt-1">Select a pack to start practising idioms.</p>
    </div>

    <div class="flex flex-wrap justify-center gap-10">
      <div v-for="(pack, index) in store.packs" :key="pack.id" class="flex flex-col items-center gap-3">

        <div
          :class="['pack-card', variantClass(index)]"
          role="button"
          tabindex="0"
          :aria-label="`Open ${pack.title}`"
          @click="handleOpen(index)"
          @keydown.enter="handleOpen(index)"
          @keydown.space.prevent="handleOpen(index)"
        >
          <!-- Roman numeral -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              class="font-heading font-bold text-white/80 text-6xl leading-none select-none"
              style="text-shadow: 0 2px 12px rgba(0,0,0,0.4);"
            >{{ toRoman(index + 1) }}</span>
          </div>

          <!-- Bottom info strip -->
          <div class="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-b-2xl">
            <p class="text-xs font-heading font-bold text-ink leading-tight truncate">{{ pack.title }}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] text-ink-light">{{ pack.challenges.length }} idioms</span>
              <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', difficultyColor(pack.difficulty)]">
                {{ pack.difficulty ?? 'Beginner' }}
              </span>
            </div>
          </div>
        </div>

        <button class="btn-primary btn-sm" @click="handleOpen(index)">Open Pack</button>
      </div>
    </div>
  </div>
</template>
