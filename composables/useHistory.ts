import type { AssessmentResult } from '~/types/assessment'
import { useHistoryStore } from '~/stores/historyStore'
import type { AttemptRecord as _AttemptRecord } from '~/stores/historyStore'

export type AttemptRecord = _AttemptRecord

export function useHistory() {
  const store = useHistoryStore()

  return {
    addAttempt: (record: import('~/stores/historyStore').AttemptRecord, azureResult?: AssessmentResult) =>
      store.addAttempt(record, azureResult),
    getHistory: ({ force = false } = {}) => store.fetchAll({ force }),
    getByPassage: (passageId: string, { force = false } = {}) => store.fetchByPassage(passageId, { force }),
  }
}
