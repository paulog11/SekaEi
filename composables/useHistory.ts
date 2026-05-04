import { useApi } from './useApi'
import type { AssessmentResult } from '~/types/assessment'

export interface AttemptRecord {
  id?: string
  passageId: string
  passageTitle: string
  timestamp: number
  scores: {
    accuracy: number
    fluency: number
    completeness: number
    prosody?: number
    overall: number
  }
}

// Module-level in-memory cache — lives for the page session, avoids redundant fetches.
// Exported so tests can reset between cases.
export const _cache = { all: null as AttemptRecord[] | null, passageId: null as string | null, passageData: null as AttemptRecord[] | null }

function invalidate() {
  _cache.all = null
  _cache.passageId = null
  _cache.passageData = null
}

export function useHistory() {
  const { apiFetch } = useApi()

  async function addAttempt(record: AttemptRecord, azureResult?: AssessmentResult): Promise<void> {
    invalidate()
    try {
      await apiFetch('/api/attempts', {
        method: 'POST',
        body: {
          passageId: record.passageId,
          passageTitle: record.passageTitle,
          scores: record.scores,
          azureResult: azureResult ?? null,
        },
      })
    } catch {
      // Silently degrade — attempt is lost but app continues working
    }
  }

  async function getHistory(): Promise<AttemptRecord[]> {
    if (_cache.all) return _cache.all
    try {
      const res = await apiFetch<{ attempts: AttemptRecord[] }>('/api/attempts')
      _cache.all = res.attempts
      return _cache.all
    } catch {
      return []
    }
  }

  async function getByPassage(passageId: string): Promise<AttemptRecord[]> {
    if (_cache.passageId === passageId && _cache.passageData) return _cache.passageData
    try {
      const res = await apiFetch<{ attempts: AttemptRecord[] }>(`/api/attempts?passageId=${encodeURIComponent(passageId)}`)
      _cache.passageId = passageId
      _cache.passageData = res.attempts
      return _cache.passageData
    } catch {
      return []
    }
  }

  return { addAttempt, getHistory, getByPassage }
}
