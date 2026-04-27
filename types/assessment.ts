export interface AzurePhoneme {
  Phoneme: string
  PronunciationAssessment: {
    AccuracyScore: number
    NBestPhonemes?: Array<{ Phoneme: string; Score: number }>
  }
  Offset?: number
  Duration?: number
}

export interface AzureWord {
  Word: string
  Offset: number
  Duration: number
  PronunciationAssessment: {
    AccuracyScore: number
    ErrorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' | 'UnexpectedBreak' | 'MissingBreak' | 'Monotone'
  }
  Phonemes: AzurePhoneme[]
}

export interface ProsodyAssessment {
  ProsodyScore: number
}

export interface OverallPronunciationAssessment {
  AccuracyScore: number
  FluencyScore: number
  CompletenessScore: number
  PronScore: number
  ProsodyScore?: number
}

export interface AssessmentResult {
  PronunciationAssessment: OverallPronunciationAssessment
  Words: AzureWord[]
  recognizedText: string
}

export interface AssessmentError {
  error: string
}
