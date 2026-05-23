// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useIdiomLabStore } from '~/stores/idiomLabStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('idiomLabStore — submitAnswer', () => {
  it('sets hasGuessedCorrectly when answer matches meaning', () => {
    const store = useIdiomLabStore()
    const correctMeaning = store.currentChallenge.meaning
    store.submitAnswer(correctMeaning)
    expect(store.hasGuessedCorrectly).toBe(true)
    expect(store.selectedAnswer).toBeNull()
  })

  it('sets selectedAnswer when answer is wrong', () => {
    const store = useIdiomLabStore()
    const wrongMeaning = 'Something completely wrong'
    store.submitAnswer(wrongMeaning)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedAnswer).toBe(wrongMeaning)
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
    store.submitAnswer(store.currentChallenge.meaning)
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
    store.submitAnswer('some wrong answer')
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
  it('contains exactly 4 options including the correct meaning', () => {
    const store = useIdiomLabStore()
    const options = store.shuffledOptions
    expect(options).toHaveLength(4)
    expect(options).toContain(store.currentChallenge.meaning)
  })

  it('does not contain the current challenge meaning as a distractor', () => {
    const store = useIdiomLabStore()
    const correct = store.currentChallenge.meaning
    const others = store.shuffledOptions.filter(o => o !== correct)
    expect(others).toHaveLength(3)
    for (const o of others) {
      expect(o).not.toBe(correct)
    }
  })
})
