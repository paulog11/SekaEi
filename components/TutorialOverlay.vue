<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useTutorialStore } from '~/stores/tutorialStore'
import { TUTORIAL_STEPS } from '~/types/tutorial'

const store = useTutorialStore()

interface TargetRect { x: number; y: number; w: number; h: number }

const PAD = 8
const TOOLTIP_W = 288

const targetRect = ref<TargetRect | null>(null)
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 375)
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 812)

function queryTarget(selector: string): Element | null {
  return document.querySelector(`[data-tutorial="${selector}"]`)
}

async function refreshTargetRect() {
  const step = TUTORIAL_STEPS[store.currentStep]
  if (!step || !store.active) {
    targetRect.value = null
    return
  }

  await nextTick()

  let el = queryTarget(step.selector)
  let retries = 0
  while (!el && retries < 5) {
    await new Promise<void>(resolve => setTimeout(resolve, 150))
    el = queryTarget(step.selector)
    retries++
  }

  if (!el) {
    console.warn(`[Tutorial] Element [data-tutorial="${step.selector}"] not found, skipping step`)
    if (store.currentStep < TUTORIAL_STEPS.length - 1) store.next()
    return
  }

  // If a scrollAnchor is specified, scroll to that element instead of the target.
  // This keeps context (e.g. the passage text) visible alongside the highlighted button.
  const scrollEl = step.scrollAnchor
    ? (queryTarget(step.scrollAnchor) ?? el)
    : el

  const scrollR = scrollEl.getBoundingClientRect()
  if (scrollR.top < 0 || scrollR.bottom > window.innerHeight) {
    scrollEl.scrollIntoView({ block: 'start', behavior: 'smooth' })
    await new Promise<void>(resolve => setTimeout(resolve, 350))
  }

  const r = el.getBoundingClientRect()
  targetRect.value = { x: r.left, y: r.top, w: r.width, h: r.height }
}

const spotlightRect = computed(() => {
  if (!targetRect.value) return null
  return {
    x: targetRect.value.x - PAD,
    y: targetRect.value.y - PAD,
    w: targetRect.value.w + PAD * 2,
    h: targetRect.value.h + PAD * 2,
  }
})

const tooltipStyle = computed(() => {
  const gap = 12
  const edgePad = 16

  if (!targetRect.value) {
    return {
      top: `${Math.round(vh.value / 2 - 90)}px`,
      left: `${Math.round(vw.value / 2 - TOOLTIP_W / 2)}px`,
    }
  }

  const { x, y, w, h } = targetRect.value
  const left = Math.max(edgePad, Math.min(x + w / 2 - TOOLTIP_W / 2, vw.value - TOOLTIP_W - edgePad))

  // Try below first
  let top = y + h + PAD + gap
  if (top + 200 > vh.value - edgePad) {
    // Try above
    top = y - PAD - gap - 200
    if (top < edgePad) top = edgePad
  }

  return {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
  }
})

const currentStep = computed(() => TUTORIAL_STEPS[store.currentStep])
const isLastStep = computed(() => store.currentStep === TUTORIAL_STEPS.length - 1)
const showNextBtn = computed(() => !currentStep.value?.advanceOn && !isLastStep.value)
const showFinishBtn = computed(() => isLastStep.value)

watch(() => store.currentStep, refreshTargetRect)
watch(() => store.active, (active) => {
  if (active) refreshTargetRect()
})

function onResize() {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  refreshTargetRect()
}
function onScroll() {
  refreshTargetRect()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="store.active"
        class="fixed inset-0 pointer-events-none"
        style="z-index: 60"
        @keydown.esc="store.skip()"
      >
        <!-- Dim overlay with spotlight cutout -->
        <svg
          class="absolute inset-0 w-full h-full"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                v-if="spotlightRect"
                :x="spotlightRect.x"
                :y="spotlightRect.y"
                :width="spotlightRect.w"
                :height="spotlightRect.h"
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.58)"
            mask="url(#tutorial-spotlight-mask)"
          />
        </svg>

        <!-- Tooltip card -->
        <div
          class="fixed pointer-events-auto bg-white rounded-xl border-2 border-ink p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
          :style="{ ...tooltipStyle, width: `${TOOLTIP_W}px`, maxWidth: 'calc(100vw - 2rem)', zIndex: 62 }"
          role="dialog"
          aria-live="polite"
          aria-label="Tutorial"
        >
          <!-- Header row -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-[0.6rem] font-bold uppercase tracking-widest text-ink-lighter">
              Step {{ store.currentStep + 1 }} / {{ TUTORIAL_STEPS.length }}
            </span>
            <button
              class="text-[0.65rem] text-ink-lighter hover:text-ink underline leading-none cursor-pointer bg-transparent border-none p-0"
              @click="store.skip()"
            >
              Skip tour
            </button>
          </div>

          <!-- Content -->
          <h3 class="text-sm font-bold text-ink mb-1 m-0">{{ currentStep?.title }}</h3>
          <p class="text-xs text-ink-medium leading-relaxed m-0 mb-3">{{ currentStep?.body }}</p>

          <!-- Navigation row -->
          <div class="flex items-center justify-between gap-2">
            <button
              v-if="store.currentStep > 0"
              class="text-xs text-ink-lighter hover:text-ink underline cursor-pointer bg-transparent border-none p-0"
              @click="store.prev()"
            >
              ← Back
            </button>
            <span v-else class="flex-1" />

            <span
              v-if="currentStep?.advanceOn === 'event' && !isLastStep"
              class="text-[0.65rem] text-ink-lighter italic"
            >
              {{ currentStep.waitHint }}
            </span>

            <button
              v-else-if="showNextBtn"
              class="btn-primary btn-sm ml-auto"
              @click="store.next()"
            >
              Next →
            </button>

            <button
              v-else-if="showFinishBtn"
              class="btn-primary btn-sm ml-auto"
              @click="store.complete()"
            >
              Finish ✓
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
