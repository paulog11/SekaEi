import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAzureNBestJson, mockAssessmentResult } from '../fixtures/mockAssessmentResult'

// ---------------------------------------------------------------------------
// Mock the entire Azure Speech SDK before importing the module under test
// ---------------------------------------------------------------------------

const mockPushStream = {
  write: vi.fn(),
  close: vi.fn(),
}

const mockRecognizer = {
  recognizeOnceAsync: vi.fn(),
  close: vi.fn(),
}

const mockPronunciationConfig = {
  applyTo: vi.fn(),
  enableProsodyAssessment: false,
}

vi.mock('microsoft-cognitiveservices-speech-sdk', () => {
  return {
    default: {
      SpeechConfig: {
        fromSubscription: vi.fn().mockReturnValue({ speechRecognitionLanguage: '' }),
      },
      AudioStreamFormat: {
        getWaveFormatPCM: vi.fn().mockReturnValue({}),
      },
      AudioInputStream: {
        createPushStream: vi.fn().mockReturnValue(mockPushStream),
      },
      AudioConfig: {
        fromStreamInput: vi.fn().mockReturnValue({}),
      },
      PronunciationAssessmentConfig: vi.fn().mockImplementation(() => mockPronunciationConfig),
      PronunciationAssessmentGradingSystem: { HundredMark: 'HundredMark' },
      PronunciationAssessmentGranularity: { Phoneme: 'Phoneme' },
      SpeechRecognizer: vi.fn().mockImplementation(() => mockRecognizer),
      ResultReason: {
        RecognizedSpeech: 'RecognizedSpeech',
        NoMatch: 'NoMatch',
        Canceled: 'Canceled',
      },
      CancellationDetails: {
        fromResult: vi.fn().mockReturnValue({ errorDetails: 'Network error', reason: 'Error' }),
      },
      PropertyId: {
        SpeechServiceResponse_JsonResult: 'SpeechServiceResponse_JsonResult',
      },
    },
  }
})

// Import after mocking
const { runPronunciationAssessment } = await import('~/server/utils/azure')

const FAKE_KEY = 'test-key'
const FAKE_REGION = 'eastus'
const FAKE_TEXT = 'Hello world'

function makeWavBuffer(extraBytes = 0): Buffer {
  // 44-byte header + optional extra bytes simulating PCM data
  return Buffer.alloc(44 + extraBytes, 0)
}

function makeResult(reason: string, jsonStr?: string) {
  return {
    reason,
    text: FAKE_TEXT,
    properties: {
      getProperty: vi.fn().mockReturnValue(jsonStr ?? mockAzureNBestJson()),
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPushStream.write.mockReset()
  mockPushStream.close.mockReset()
  mockRecognizer.close.mockReset()
  mockPronunciationConfig.applyTo.mockReset()
})

describe('runPronunciationAssessment — happy path', () => {
  it('resolves with AssessmentResult on RecognizedSpeech', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })

    const result = await runPronunciationAssessment(makeWavBuffer(100), FAKE_TEXT, FAKE_KEY, FAKE_REGION)

    expect(result.recognizedText).toBe(FAKE_TEXT)
    expect(result.PronunciationAssessment.AccuracyScore).toBe(85)
    expect(result.Words).toHaveLength(2)
    expect(result.Words[0].Word).toBe('Hello')
  })

  it('recognizer.close() is called after success', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    expect(mockRecognizer.close).toHaveBeenCalledOnce()
  })
})

describe('runPronunciationAssessment — header stripping', () => {
  it('writes wavBuffer.slice(44) to the push stream (strips WAV header)', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })

    const wav = makeWavBuffer(200) // 244 bytes total
    await runPronunciationAssessment(wav, FAKE_TEXT, FAKE_KEY, FAKE_REGION)

    expect(mockPushStream.write).toHaveBeenCalledOnce()
    const writtenArg = mockPushStream.write.mock.calls[0][0] as Buffer
    expect(writtenArg.length).toBe(200) // stripped 44-byte header
  })

  it('closes the push stream after writing', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    expect(mockPushStream.close).toHaveBeenCalledOnce()
  })
})

describe('runPronunciationAssessment — PronunciationAssessmentConfig', () => {
  it('sets enableProsodyAssessment to true', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    expect(mockPronunciationConfig.enableProsodyAssessment).toBe(true)
  })

  it('applies config to recognizer', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    expect(mockPronunciationConfig.applyTo).toHaveBeenCalledWith(mockRecognizer)
  })
})

describe('runPronunciationAssessment — error branches', () => {
  it('rejects with "No speech recognized" on NoMatch', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('NoMatch'))
    })
    await expect(
      runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('No speech recognized')
  })

  it('rejects with cancellation error details on Canceled reason', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('Canceled'))
    })
    await expect(
      runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('Network error')
  })

  it('rejects when SDK error callback fires', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation(
      (_onSuccess: unknown, onError: (e: unknown) => void) => {
        onError('SDK internal error')
      },
    )
    await expect(
      runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('SDK internal error')
    expect(mockRecognizer.close).toHaveBeenCalledOnce()
  })

  it('rejects with "No NBest result" when NBest array is empty', async () => {
    const emptyNBest = JSON.stringify({ NBest: [] })
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech', emptyNBest))
    })
    await expect(
      runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('No NBest result')
  })

  it('rejects with "No NBest result" when NBest key is absent', async () => {
    const noNBest = JSON.stringify({ RecognitionStatus: 'Success' })
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech', noNBest))
    })
    await expect(
      runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('No NBest result')
  })
})

describe('runPronunciationAssessment — result shape', () => {
  it('returns Words array with expected structure', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    const result = await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    const word = result.Words[0]
    expect(word).toHaveProperty('Word')
    expect(word).toHaveProperty('PronunciationAssessment.AccuracyScore')
    expect(word).toHaveProperty('Phonemes')
    expect(Array.isArray(word.Phonemes)).toBe(true)
  })

  it('OverallPronunciationAssessment has all required score fields', async () => {
    mockRecognizer.recognizeOnceAsync.mockImplementation((onSuccess: (r: unknown) => void) => {
      onSuccess(makeResult('RecognizedSpeech'))
    })
    const result = await runPronunciationAssessment(makeWavBuffer(), FAKE_TEXT, FAKE_KEY, FAKE_REGION)
    expect(result.PronunciationAssessment).toHaveProperty('AccuracyScore')
    expect(result.PronunciationAssessment).toHaveProperty('FluencyScore')
    expect(result.PronunciationAssessment).toHaveProperty('CompletenessScore')
    expect(result.PronunciationAssessment).toHaveProperty('PronScore')
  })
})
