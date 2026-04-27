import type { AssessmentResult, AzureWord, AzurePhoneme } from '~/types/assessment'

export const mockPhoneme = (phoneme: string, score: number): AzurePhoneme => ({
  Phoneme: phoneme,
  PronunciationAssessment: { AccuracyScore: score },
  Offset: 0,
  Duration: 500000,
})

export const mockWord = (
  word: string,
  score: number,
  errorType: AzureWord['PronunciationAssessment']['ErrorType'] = 'None',
  phonemes: AzurePhoneme[] = [],
): AzureWord => ({
  Word: word,
  Offset: 0,
  Duration: 1000000,
  PronunciationAssessment: { AccuracyScore: score, ErrorType: errorType },
  Phonemes: phonemes.length ? phonemes : [mockPhoneme(word[0], score)],
})

export const mockAssessmentResult = (overrides?: Partial<AssessmentResult>): AssessmentResult => ({
  recognizedText: 'Hello world',
  PronunciationAssessment: {
    AccuracyScore: 85,
    FluencyScore: 90,
    CompletenessScore: 100,
    PronScore: 87,
    ProsodyScore: 80,
  },
  Words: [
    mockWord('Hello', 90, 'None', [mockPhoneme('h', 95), mockPhoneme('ə', 88), mockPhoneme('l', 92), mockPhoneme('oʊ', 86)]),
    mockWord('world', 80, 'None', [mockPhoneme('w', 82), mockPhoneme('ɜr', 78), mockPhoneme('l', 81), mockPhoneme('d', 80)]),
  ],
  ...overrides,
})

export const mockAzureNBestJson = (overrides?: Partial<AssessmentResult>) => {
  const result = mockAssessmentResult(overrides)
  return JSON.stringify({
    RecognitionStatus: 'Success',
    NBest: [
      {
        Confidence: 0.95,
        Lexical: result.recognizedText.toLowerCase(),
        ITN: result.recognizedText,
        MaskedITN: result.recognizedText,
        Display: result.recognizedText,
        PronunciationAssessment: result.PronunciationAssessment,
        Words: result.Words,
      },
    ],
  })
}
