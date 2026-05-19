import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { TUTORIAL_STEPS } from '~/types/tutorial'

export const useTutorialStore = defineStore('tutorial', () => {
  const { apiFetch } = useApi()

  const completed = ref(false)
  const loaded = ref(false)
  const active = ref(false)
  const currentStep = ref(0)

  async function fetch() {
    try {
      const data = await apiFetch<{ user: { tutorialCompletedAt: string | null } }>('/api/me')
      completed.value = !!data.user.tutorialCompletedAt
    } catch {
      // Non-fatal — default to not completed so new users still see the tour
    } finally {
      loaded.value = true
    }
  }

  function start() {
    active.value = true
    currentStep.value = 0
  }

  function replay() {
    active.value = true
    currentStep.value = 0
  }

  function next() {
    if (currentStep.value < TUTORIAL_STEPS.length - 1) {
      currentStep.value++
    }
  }

  function prev() {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  function goTo(step: number) {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      currentStep.value = step
    }
  }

  function advanceIfOnStep(stepIndex: number) {
    if (active.value && currentStep.value === stepIndex) {
      next()
    }
  }

  async function complete() {
    active.value = false
    completed.value = true
    try {
      await apiFetch('/api/me/tutorial', { method: 'POST' })
    } catch {
      // Non-fatal
    }
  }

  function skip() {
    return complete()
  }

  function reset() {
    completed.value = false
    loaded.value = false
    active.value = false
    currentStep.value = 0
  }

  return {
    completed,
    loaded,
    active,
    currentStep,
    fetch,
    start,
    replay,
    next,
    prev,
    goTo,
    advanceIfOnStep,
    complete,
    skip,
    reset,
  }
})
