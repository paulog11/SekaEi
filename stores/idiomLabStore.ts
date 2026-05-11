import { defineStore } from 'pinia'
import { MOCK_IDIOMS } from '~/mocks/mockIdioms'
import type { IdiomChallenge } from '~/types/idioms'

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export const useIdiomLabStore = defineStore('idiomLab', () => {
  const challenges = ref<IdiomChallenge[]>(MOCK_IDIOMS)
  const currentIndex = ref(0)
  const hasGuessedCorrectly = ref(false)
  const selectedAnswer = ref<string | null>(null)

  const currentChallenge = computed(() => challenges.value[currentIndex.value]!)

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
    currentIndex.value = (currentIndex.value + 1) % challenges.value.length
  }

  return {
    challenges,
    currentIndex,
    hasGuessedCorrectly,
    selectedAnswer,
    currentChallenge,
    shuffledOptions,
    submitAnswer,
    nextChallenge,
  }
})
