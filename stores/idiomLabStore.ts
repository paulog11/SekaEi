import { defineStore } from 'pinia'
import { ALL_PACKS } from '~/mocks/mockIdioms'
import type { IdiomChallenge, IdiomPack } from '~/types/idioms'

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export const useIdiomLabStore = defineStore('idiomLab', () => {
  const packs = ref<IdiomPack[]>(ALL_PACKS)
  const currentPackIndex = ref(0)
  const currentIndex = ref(0)
  const hasGuessedCorrectly = ref(false)
  const selectedAnswer = ref<string | null>(null)

  const currentPack = computed(() => packs.value[currentPackIndex.value]!)
  const challenges = computed(() => currentPack.value.challenges)
  const currentChallenge = computed<IdiomChallenge>(() => challenges.value[currentIndex.value]!)
  const isPackComplete = computed(() => currentIndex.value >= challenges.value.length)

  const shuffledOptions = computed(() =>
    shuffle([
      currentChallenge.value.figurativeImageUrl,
      ...currentChallenge.value.distractorImageUrls,
    ])
  )

  function submitAnswer(imageUrl: string) {
    if (imageUrl === currentChallenge.value.figurativeImageUrl) {
      hasGuessedCorrectly.value = true
    } else {
      selectedAnswer.value = imageUrl
    }
  }

  function nextChallenge() {
    hasGuessedCorrectly.value = false
    selectedAnswer.value = null
    currentIndex.value += 1
  }

  function restartPack() {
    hasGuessedCorrectly.value = false
    selectedAnswer.value = null
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
    selectedAnswer,
    currentChallenge,
    isPackComplete,
    shuffledOptions,
    submitAnswer,
    nextChallenge,
    restartPack,
    selectPack,
  }
})
