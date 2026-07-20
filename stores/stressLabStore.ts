/**
 * @fileoverview Word-stress quiz state. Mirrors idiomLabStore's structure:
 * packs of challenges, a current-pack/current-index cursor, and a
 * correct/wrong guess flag. Unlike idioms, answer options are the
 * challenge's own `syllables` in fixed order, rendered directly by the view
 * — no shuffling needed here.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ALL_STRESS_PACKS } from '~/mocks/mockStress'
import type { StressChallenge, StressPack } from '~/types/stress'

export const useStressLabStore = defineStore('stressLab', () => {
  const packs = ref<StressPack[]>(ALL_STRESS_PACKS)
  const currentPackIndex = ref(0)
  const currentIndex = ref(0)
  const hasGuessedCorrectly = ref(false)
  const selectedIndex = ref<number | null>(null)

  const currentPack = computed(() => packs.value[currentPackIndex.value]!)
  const challenges = computed(() => currentPack.value.challenges)
  const currentChallenge = computed<StressChallenge>(() => challenges.value[currentIndex.value]!)
  const isPackComplete = computed(() => currentIndex.value >= challenges.value.length)

  function submitAnswer(index: number) {
    if (index === currentChallenge.value.stressedIndex) {
      hasGuessedCorrectly.value = true
    } else {
      selectedIndex.value = index
    }
  }

  function nextChallenge() {
    hasGuessedCorrectly.value = false
    selectedIndex.value = null
    currentIndex.value += 1
  }

  function restartPack() {
    hasGuessedCorrectly.value = false
    selectedIndex.value = null
    currentIndex.value = 0
  }

  function selectPack(packIndex: number) {
    currentPackIndex.value = packIndex
    restartPack()
  }

  return {
    packs,
    currentPackIndex,
    currentPack,
    challenges,
    currentIndex,
    hasGuessedCorrectly,
    selectedIndex,
    currentChallenge,
    isPackComplete,
    submitAnswer,
    nextChallenge,
    restartPack,
    selectPack,
  }
})
