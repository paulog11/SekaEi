import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock the Azure Speech SDK before importing the module under test
// ---------------------------------------------------------------------------

const mockSpeechConfig = {
  speechSynthesisVoiceName: '',
  speechSynthesisOutputFormat: 0,
}

const mockSynthesizer = {
  speakTextAsync: vi.fn(),
  close: vi.fn(),
}

vi.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  default: {
    SpeechConfig: {
      fromSubscription: vi.fn().mockReturnValue(mockSpeechConfig),
    },
    SpeechSynthesizer: vi.fn().mockImplementation(() => mockSynthesizer),
    SpeechSynthesisOutputFormat: {
      Audio24Khz48KBitRateMonoMp3: 18,
    },
    ResultReason: {
      SynthesizingAudioCompleted: 'SynthesizingAudioCompleted',
    },
  },
}))

const { synthesizeSpeech } = await import('~/server/utils/azure')

const FAKE_KEY = 'test-key'
const FAKE_REGION = 'eastus'
const FAKE_VOICE = 'en-US-AriaNeural'
const FAKE_TEXT = 'Hello world'
const FAKE_AUDIO_DATA = new Uint8Array([1, 2, 3, 4]).buffer

function makeSuccessResult() {
  return {
    reason: 'SynthesizingAudioCompleted',
    audioData: FAKE_AUDIO_DATA,
  }
}

function triggerSpeakSuccess() {
  mockSynthesizer.speakTextAsync.mockImplementation(
    (_text: string, onSuccess: (r: unknown) => void) => {
      onSuccess(makeSuccessResult())
    },
  )
}

function triggerSpeakCancelled() {
  mockSynthesizer.speakTextAsync.mockImplementation(
    (_text: string, onSuccess: (r: unknown) => void) => {
      onSuccess({ reason: 'Canceled', audioData: new ArrayBuffer(0), errorDetails: 'quota exceeded' })
    },
  )
}

function triggerSpeakError() {
  mockSynthesizer.speakTextAsync.mockImplementation(
    (_text: string, _onSuccess: unknown, onError: (e: unknown) => void) => {
      onError('SDK internal error')
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSpeechConfig.speechSynthesisVoiceName = ''
  mockSpeechConfig.speechSynthesisOutputFormat = 0
})

describe('synthesizeSpeech — SDK configuration', () => {
  it('calls SpeechConfig.fromSubscription with provided key and region', async () => {
    triggerSpeakSuccess()
    await synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION)
    const sdk = (await import('microsoft-cognitiveservices-speech-sdk')).default
    expect(sdk.SpeechConfig.fromSubscription).toHaveBeenCalledWith(FAKE_KEY, FAKE_REGION)
  })

  it('sets speechSynthesisVoiceName to the provided voice', async () => {
    triggerSpeakSuccess()
    await synthesizeSpeech(FAKE_TEXT, 'en-US-GuyNeural', FAKE_KEY, FAKE_REGION)
    expect(mockSpeechConfig.speechSynthesisVoiceName).toBe('en-US-GuyNeural')
  })

  it('sets speechSynthesisOutputFormat to Audio24Khz48KBitRateMonoMp3', async () => {
    triggerSpeakSuccess()
    await synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION)
    expect(mockSpeechConfig.speechSynthesisOutputFormat).toBe(18)
  })
})

describe('synthesizeSpeech — happy path', () => {
  it('resolves with a Buffer containing the audio data', async () => {
    triggerSpeakSuccess()
    const result = await synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(4)
  })

  it('passes the text to speakTextAsync', async () => {
    triggerSpeakSuccess()
    await synthesizeSpeech('Testing one two', FAKE_VOICE, FAKE_KEY, FAKE_REGION)
    expect(mockSynthesizer.speakTextAsync.mock.calls[0][0]).toBe('Testing one two')
  })

  it('closes synthesizer after successful synthesis', async () => {
    triggerSpeakSuccess()
    await synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION)
    expect(mockSynthesizer.close).toHaveBeenCalledOnce()
  })
})

describe('synthesizeSpeech — error branches', () => {
  it('rejects and closes synthesizer on cancelled result', async () => {
    triggerSpeakCancelled()
    await expect(
      synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('Service is busy')
    expect(mockSynthesizer.close).toHaveBeenCalledOnce()
  })

  it('rejects and closes synthesizer on SDK error callback', async () => {
    triggerSpeakError()
    await expect(
      synthesizeSpeech(FAKE_TEXT, FAKE_VOICE, FAKE_KEY, FAKE_REGION),
    ).rejects.toThrow('Assessment failed')
    expect(mockSynthesizer.close).toHaveBeenCalledOnce()
  })
})
