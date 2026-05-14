export interface WeakPhonemeHit {
  ph: string
  heard: string
  score: number
}

export interface FlaggedWord {
  id: string
  user_id: string
  word: string
  display_word: string
  ipa: string | null
  source_passage_id: string | null
  source: 'auto' | 'manual'
  attempts_count: number
  last_score: number
  lowest_score: number
  best_score: number
  weak_phonemes: WeakPhonemeHit[] | null
  retired_at: string | null
  last_seen: string
  created_at: string
}

export interface FlagWordPayload {
  word: string
  displayWord: string
  source: 'auto' | 'manual'
  score: number
  ipa?: string
  passageId?: string
  weakPhonemes?: WeakPhonemeHit[]
}

export interface CoachDrill {
  pair: [string, string]
  hint: string
}

export interface CoachReply {
  pattern: string
  drills: CoachDrill[]
  tip: string
  model: string
  cached: boolean
}
