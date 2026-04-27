import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHistory } from '~/composables/useHistory'
import type { AttemptRecord } from '~/composables/useHistory'

// localStorage is not available in the node environment — provide a minimal in-memory stub
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
vi.stubGlobal('localStorage', localStorageMock)

function makeAttempt(overrides?: Partial<AttemptRecord>): AttemptRecord {
  return {
    passageId: 'interstellar',
    passageTitle: 'Interstellar',
    timestamp: Date.now(),
    scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('useHistory — addAttempt / getHistory', () => {
  it('starts with an empty history', () => {
    const { getHistory } = useHistory()
    expect(getHistory()).toEqual([])
  })

  it('stores a single attempt', () => {
    const { addAttempt, getHistory } = useHistory()
    const attempt = makeAttempt()
    addAttempt(attempt)
    expect(getHistory()).toHaveLength(1)
    expect(getHistory()[0]).toMatchObject({ passageId: 'interstellar' })
  })

  it('prepends new attempts (most recent first)', () => {
    const { addAttempt, getHistory } = useHistory()
    addAttempt(makeAttempt({ timestamp: 1000 }))
    addAttempt(makeAttempt({ timestamp: 2000 }))
    const history = getHistory()
    expect(history[0].timestamp).toBe(2000)
    expect(history[1].timestamp).toBe(1000)
  })

  it('caps history at 50 entries', () => {
    const { addAttempt, getHistory } = useHistory()
    for (let i = 0; i < 55; i++) {
      addAttempt(makeAttempt({ timestamp: i }))
    }
    expect(getHistory()).toHaveLength(50)
  })

  it('drops the oldest entries when capped', () => {
    const { addAttempt, getHistory } = useHistory()
    for (let i = 0; i < 51; i++) {
      addAttempt(makeAttempt({ timestamp: i }))
    }
    const history = getHistory()
    // Oldest (timestamp=0) should be gone; newest (timestamp=50) should be first
    expect(history[0].timestamp).toBe(50)
    expect(history.some(r => r.timestamp === 0)).toBe(false)
  })
})

describe('useHistory — getByPassage', () => {
  it('returns only attempts for the given passageId', () => {
    const { addAttempt, getByPassage } = useHistory()
    addAttempt(makeAttempt({ passageId: 'interstellar' }))
    addAttempt(makeAttempt({ passageId: 'rocky-balboa' }))
    addAttempt(makeAttempt({ passageId: 'interstellar' }))
    expect(getByPassage('interstellar')).toHaveLength(2)
    expect(getByPassage('rocky-balboa')).toHaveLength(1)
    expect(getByPassage('great-dictator')).toHaveLength(0)
  })
})

describe('useHistory — corrupt storage tolerance', () => {
  it('returns empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem('sekaei.history.v1', 'not-valid-json{{')
    const { getHistory } = useHistory()
    expect(getHistory()).toEqual([])
  })

  it('returns empty array when localStorage contains a non-array', () => {
    localStorage.setItem('sekaei.history.v1', JSON.stringify({ not: 'an array' }))
    const { getHistory } = useHistory()
    expect(getHistory()).toEqual([])
  })

  it('silently skips write when localStorage throws (e.g. quota)', () => {
    const orig = localStorageMock.setItem
    localStorageMock.setItem = () => { throw new Error('QuotaExceededError') }
    const { addAttempt, getHistory } = useHistory()
    expect(() => addAttempt(makeAttempt())).not.toThrow()
    localStorageMock.setItem = orig
    expect(getHistory()).toEqual([])
  })
})
