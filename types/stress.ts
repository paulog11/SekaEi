/**
 * @fileoverview Word-stress track types. Mirrors the idiom-quiz shape:
 * a `StressChallenge` (one word to place stress on) grouped into a
 * `StressPack` (a themed set of challenges).
 */

export interface StressChallenge {
  id: string
  word: string
  syllables: string[] // the word split into syllables, in order, e.g. ['ba','na','na']
  stressedIndex: number // 0-based index into `syllables` of the stressed syllable
  ipa?: string
  sampleSentence?: string
}

export interface StressPack {
  id: string
  title: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  challenges: StressChallenge[]
}
