const STORAGE_KEY = 'sekaei.history.v1'
const MAX_ENTRIES = 50

export interface AttemptRecord {
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

function readHistory(): AttemptRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(records: AttemptRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Quota exceeded or private browsing — silently skip
  }
}

export function useHistory() {
  function addAttempt(record: AttemptRecord): void {
    const history = readHistory()
    history.unshift(record)
    writeHistory(history.slice(0, MAX_ENTRIES))
  }

  function getHistory(): AttemptRecord[] {
    return readHistory()
  }

  function getByPassage(passageId: string): AttemptRecord[] {
    return readHistory().filter(r => r.passageId === passageId)
  }

  return { addAttempt, getHistory, getByPassage }
}
