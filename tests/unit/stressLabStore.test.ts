// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStressLabStore } from '~/stores/stressLabStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('stressLabStore — initial state', () => {
  it('starts at the first challenge of the first pack', () => {
    const store = useStressLabStore()
    expect(store.currentIndex).toBe(0)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedIndex).toBeNull()
    expect(store.currentChallenge.word).toBe('water')
  })
})

describe('stressLabStore — submitAnswer', () => {
  it('sets hasGuessedCorrectly when index matches stressedIndex', () => {
    const store = useStressLabStore()
    store.submitAnswer(0)
    expect(store.hasGuessedCorrectly).toBe(true)
    expect(store.selectedIndex).toBeNull()
  })

  it('sets selectedIndex when index is wrong', () => {
    const store = useStressLabStore()
    store.submitAnswer(1)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedIndex).toBe(1)
  })
})

describe('stressLabStore — nextChallenge', () => {
  it('increments currentIndex', () => {
    const store = useStressLabStore()
    store.nextChallenge()
    expect(store.currentIndex).toBe(1)
  })

  it('resets guess state', () => {
    const store = useStressLabStore()
    store.submitAnswer(1)
    store.nextChallenge()
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedIndex).toBeNull()
  })
})

describe('stressLabStore — restartPack', () => {
  it('resets index and guess state', () => {
    const store = useStressLabStore()
    store.nextChallenge()
    store.nextChallenge()
    store.submitAnswer(1)
    store.restartPack()
    expect(store.currentIndex).toBe(0)
    expect(store.hasGuessedCorrectly).toBe(false)
    expect(store.selectedIndex).toBeNull()
  })
})

describe('stressLabStore — selectPack', () => {
  it('switches to the given pack index and resets to its first challenge', () => {
    const store = useStressLabStore()
    store.selectPack(1)
    expect(store.currentPackIndex).toBe(1)
    expect(store.currentIndex).toBe(0)
    expect(store.currentChallenge.word).toBe('banana')
  })
})
