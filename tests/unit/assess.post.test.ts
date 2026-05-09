import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

// ---------------------------------------------------------------------------
// Mock dependencies before importing the handler
// ---------------------------------------------------------------------------

const mockRunAssessment = vi.fn()

vi.mock('~/server/utils/azure', () => ({
  runPronunciationAssessment: mockRunAssessment,
}))

const mockSupabaseUser = vi.fn()
const mockRpcFn = vi.fn()
const mockSupabaseClient = { rpc: mockRpcFn }
const mockUseSupabase = vi.fn(() => mockSupabaseClient)

vi.mock('~/server/utils/supabase', () => ({
  useSupabaseUser: mockSupabaseUser,
  useSupabase: mockUseSupabase,
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

const FAKE_USER = { id: 'user-123' }

function makeEvent() {
  return {} // Nitro event object; mocked utilities ignore it
}

function makeValidWavBuffer(size = 2000): Buffer {
  const b = Buffer.alloc(size)
  b.write('RIFF', 0, 'ascii')
  b.write('WAVE', 8, 'ascii')
  return b
}

function makeMultipartParts(overrides?: {
  audio?: Buffer | null
  referenceText?: string | null
}) {
  const parts = []
  if (overrides?.audio !== null) {
    parts.push({ name: 'audio', data: overrides?.audio ?? makeValidWavBuffer() })
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
  // Default: authenticated user, under daily limit
  mockSupabaseUser.mockResolvedValue(FAKE_USER)
  mockRpcFn.mockResolvedValue({ data: 1, error: null })
  mockUseSupabase.mockReturnValue(mockSupabaseClient)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assess.post — authentication', () => {
  it('throws 401 when user is not authenticated', async () => {
    const err = new Error('Not authenticated.') as Error & { statusCode: number }
    err.statusCode = 401
    mockSupabaseUser.mockRejectedValue(err)
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(mockRunAssessment).not.toHaveBeenCalled()
  })
})

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

  it('allows audio exactly at 4 MB limit', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: makeValidWavBuffer(4 * 1024 * 1024) },
      { name: 'referenceText', data: Buffer.from('Hello world') },
    ])
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())
    await expect(handler(makeEvent())).resolves.toBeDefined()
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

  it('allows referenceText exactly at 2000 characters', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: 'a'.repeat(2000) }))
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())
    await expect(handler(makeEvent())).resolves.toBeDefined()
  })

  it('throws 400 when referenceText exceeds 2000 characters', async () => {
    mockReadMultipart.mockResolvedValue(makeMultipartParts({ referenceText: 'a'.repeat(2001) }))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'referenceText too long (max 2000 characters).',
    })
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
    const audioData = makeValidWavBuffer()
    const text = 'Hello world'
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
      { name: 'audio', data: makeValidWavBuffer() },
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

// ---------------------------------------------------------------------------

describe('assess.post — audio strict validation', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  })

  it('throws 400 when audio is shorter than 1024 bytes', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: Buffer.alloc(500) },
      { name: 'referenceText', data: Buffer.from('Hello') },
    ])
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Audio too short.',
    })
  })

  it('throws 415 when audio MIME is set and not audio/*', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', type: 'application/octet-stream', data: makeValidWavBuffer(2000) },
      { name: 'referenceText', data: Buffer.from('Hello') },
    ])
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 415 })
  })

  it('throws 400 when WAV magic bytes are missing', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: Buffer.alloc(2000) },
      { name: 'referenceText', data: Buffer.from('Hello') },
    ])
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid WAV.',
    })
  })

  it('accepts a valid WAV buffer', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: makeValidWavBuffer(2000) },
      { name: 'referenceText', data: Buffer.from('Hello') },
    ])
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())
    await expect(handler(makeEvent())).resolves.toBeDefined()
  })
})

describe('assess.post — reference text normalization', () => {
  beforeEach(() => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  })

  it('strips control characters from referenceText', async () => {
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: makeValidWavBuffer(2000) },
      { name: 'referenceText', data: Buffer.from('Hello\r\nworld') },
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

  it('NFC-normalizes referenceText', async () => {
    // 'é' as decomposed (U+0065 U+0301) should become NFC composed (U+00E9)
    const decomposed = 'café'
    mockReadMultipart.mockResolvedValue([
      { name: 'audio', data: makeValidWavBuffer(2000) },
      { name: 'referenceText', data: Buffer.from(decomposed, 'utf-8') },
    ])
    mockRunAssessment.mockResolvedValue(mockAssessmentResult())
    await handler(makeEvent())
    const passed = mockRunAssessment.mock.calls[0][1] as string
    expect(passed).toBe('café')
    expect(passed.length).toBe(4)
  })
})
