import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

// ---------------------------------------------------------------------------
// Mock dependencies before importing the handler
// ---------------------------------------------------------------------------

const mockRunAssessment = vi.fn()

vi.mock('~/server/utils/azure', () => ({
  runPronunciationAssessment: mockRunAssessment,
}))

// Mock Nuxt/h3 server utilities that are auto-imported in Nitro context
const mockRuntimeConfig = vi.fn()

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  useRuntimeConfig: mockRuntimeConfig,
  readMultipartFormData: vi.fn(),
  createError: (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  },
}))

// h3 globals used inside the handler are not auto-imported in tests —
// we stub them on globalThis so the handler can call them directly.
const mockReadMultipart = vi.fn()
const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)
vi.stubGlobal('readMultipartFormData', mockReadMultipart)
vi.stubGlobal('createError', createError)
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)

// Import after stubbing
const { default: handler } = await import('~/server/api/assess.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent() {
  return {} // Nitro event object; mocked utilities ignore it
}

function makeMultipartParts(overrides?: {
  audio?: Buffer | null
  referenceText?: string | null
}) {
  const parts = []
  if (overrides?.audio !== null) {
    parts.push({ name: 'audio', data: overrides?.audio ?? Buffer.from('fake-wav') })
  }
  if (overrides?.referenceText !== null) {
    parts.push({
      name: 'referenceText',
      data: Buffer.from(overrides?.referenceText ?? 'Hello world'),
    })
  }
  return parts
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assess.post — credential validation', () => {
  it('throws 500 when azureSpeechKey is missing', async () => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: '', azureSpeechRegion: 'eastus' })
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when azureSpeechRegion is missing', async () => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: '' })
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('assess.post — multipart validation', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  })

  it('throws 400 when no multipart data is present', async () => {
    mockReadMultipart.mockResolvedValue(null)
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when audio field is missing', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ audio: null }))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Missing audio field.',
    })
  })

  it('throws 413 when audio exceeds 4 MB', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: Buffer.alloc(4 * 1024 * 1024 + 1) },
      { name: 'referenceText', data: Buffer.from('Hello world') },
    ])
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 413 })
  })

  it('throws 400 when referenceText field is missing', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: null }))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Missing referenceText field.',
    })
  })

  it('throws 400 when referenceText is whitespace only', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: '   ' }))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'referenceText must not be empty.',
    })
  })

  it('throws 400 when referenceText exceeds 2000 characters', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: 'a'.repeat(2001) }))
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when referenceText is empty string', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: '' }))
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('assess.post — successful call', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  })

  it('calls runPronunciationAssessment with correct arguments', async () => {
    const audioData = Buffer.from('fake-wav-data')
    const text = 'Hello world'
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: text }))
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: audioData },
      { name: 'referenceText', data: Buffer.from(text) },
    ])
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())

    await handler(makeEvent())

    expect(mockRunAssessment).toHaveBeenCalledWith(audioData, text, 'key', 'eastus')
  })

  it('returns the AssessmentResult from runPronunciationAssessment', async () => {
    const expected = mockAssessmentResult()
    mockReadMultipart.mockResolvedValue(makeMultipartParts())
    mockRunAssessment.mockResolvedValue(expected)

    const result = await handler(makeEvent())
    expect(result).toEqual(expected)
  })

  it('trims whitespace from referenceText before passing to assessment', async () => {
    const paddedText = '  Hello world  '
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: Buffer.from('fake') },
      { name: 'referenceText', data: Buffer.from(paddedText) },
    ])
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())

    await handler(makeEvent())
    expect(mockRunAssessment).toHaveBeenCalledWith(
      expect.any(Buffer),
      'Hello world',
      expect.any(String),
      expect.any(String),
    )
  })
})

describe('assess.post — Azure error handling', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
    mockReadMultipart.mockResolvedValue(makeMultipartParts())
  })

  it('throws 422 when runPronunciationAssessment rejects with an Error', async () => {
    mockRunAssessment.mockRejectedValue(new Error('No speech recognized'))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 422,
      message: 'No speech recognized',
    })
  })

  it('throws 422 with generic message for non-Error rejection', async () => {
    mockRunAssessment.mockRejectedValue('unknown failure')
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 422,
      message: 'Assessment failed.',
    })
  })
})
