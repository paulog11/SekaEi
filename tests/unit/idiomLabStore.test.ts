// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useIdiomLabStore } from '~/stores/idiomLabStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('idiomLabStore — submitAnswer', () => {
  it('sets hasGuessedCorrectly when answer matches figurativeImageUrl', () => {
    const store = useIdiomLabStore()
    const correctUrl = store.currentChallenge.figurativeImageUrl
    store.submitAnswer(correctUrl)
    expect(store.hasGuessedCorrectly).toBe(true)
    expect(store.selectedAnswer).toBeNull()
  })

  it('sets selectedAnswer when answer is wrong', () => {
    const store = useIdiomLabStore()
    const wrongUrl = store.currentChallenge.distractorImageUrls[0]
    store.submitAnswer(wrongUrl)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedAnswer).toBe(wrongUrl)
  })
})

describe('idiomLabStore — nextChallenge', () => {
  it('increments currentIndex', () => {
    const store = useIdiomLabStore()
    store.nextChallenge()
    expect(store.currentIndex).toBe(1)
  })

  it('resets guess state', () => {
    const store = useIdiomLabStore()
    store.submitAnswer(store.currentChallenge.figurativeImageUrl)
    store.nextChallenge()
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedAnswer).toBeNull()
  })

  it('marks pack complete when index reaches end', () => {
    const store = useIdiomLabStore()
    const count = store.challenges.length
    for (let i = 0; i < count; i++) store.nextChallenge()
    expect(store.isPackComplete).toBe(true)
  })
})

describe('idiomLabStore — restartPack', () => {
  it('resets index and guess state', () => {
    const store = useIdiomLabStore()
    store.nextChallenge()
    store.nextChallenge()
    store.submitAnswer(store.currentChallenge.distractorImageUrls[0])
    store.restartPack()
    expect(store.currentIndex).toBe(0)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedAnswer).toBeNull()
  })
})

describe('idiomLabStore — selectPack', () => {
  it('switches to the given pack index', () => {
    const store = useIdiomLabStore()
    store.selectPack(1)
    expect(store.currentPackIndex).toBe(1)
    expect(store.currentIndex).toBe(0)
  })
})

describe('idiomLabStore — shuffledOptions', () => {
  it('contains exactly figurativeImageUrl plus all distractors', () => {
    const store = useIdiomLabStore()
    const challenge = store.currentChallenge
    const options = store.shuffledOptions
    expect(options).toHaveLength(1 + challenge.distractorImageUrls.length)
    expect(options).toContain(challenge.figurativeImageUrl)
    for (const d of challenge.distractorImageUrls) {
      expect(options).toContain(d)
    }
  })
})
