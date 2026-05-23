import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { stubNitroGlobals } from '../fixtures/serverTestHarness'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockSynthesize = vi.fn()

vi.mock('~/server/utils/azure', () => ({
  synthesizeSpeech: mockSynthesize,
  ALLOWED_VOICES: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'],
  DEFAULT_VOICE: 'en-US-AriaNeural',
}))

const mockRequireApprovedUser = vi.fn()

vi.mock('~/server/utils/approval', () => ({
  requireApprovedUser: mockRequireApprovedUser,
}))

const mockSetHeader = vi.fn()
const { createError } = stubNitroGlobals({ setHeader: mockSetHeader })
const mockRuntimeConfig = vi.fn()
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

const { default: handler } = await import('~/server/api/synthesize.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_USER = { id: 'user-abc' }
const FAKE_AUDIO = Buffer.from([0xff, 0xfb, 0x10])

function makeEvent(body?: Record<string, unknown>) {
  return { __body: body } as unknown as H3Event
}

beforeEach(() => {
  vi.clearAllMocks()
  // Always restore readBody — the rate-limit test overwrites it with a hanging mock
  vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))
  mockRequireApprovedUser.mockResolvedValue(FAKE_USER)
  mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  mockSynthesize.mockResolvedValue(FAKE_AUDIO)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('synthesize.post — authentication', () => {
  it('throws 401 when user is unauthenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(mockSynthesize).not.toHaveBeenCalled()
  })

  it('throws 403 when user is not approved', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 403, message: 'Account pending approval.' }))
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('synthesize.post — credential validation', () => {
  it('throws 500 when azureSpeechKey is missing', async () => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: '', azureSpeechRegion: 'eastus' })
    await expect(handler(makeEvent({ text: 'hello' }))).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when azureSpeechRegion is missing', async () => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: '' })
    await expect(handler(makeEvent({ text: 'hello' }))).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('synthesize.post — text validation', () => {
  it('throws 400 when text is missing', async () => {
    await expect(handler(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when text is empty string', async () => {
    await expect(handler(makeEvent({ text: '' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when text is whitespace only', async () => {
    await expect(handler(makeEvent({ text: '   ' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when text exceeds 2000 characters', async () => {
    await expect(handler(makeEvent({ text: 'a'.repeat(2001) }))).rejects.toMatchObject({
      statusCode: 400,
      message: 'text too long (max 2000 characters).',
    })
  })

  it('allows text exactly at 2000 characters', async () => {
    await expect(handler(makeEvent({ text: 'a'.repeat(2000) }))).resolves.toBeDefined()
  })
})

describe('synthesize.post — voice validation', () => {
  it('defaults to en-US-AriaNeural when voice is omitted', async () => {
    await handler(makeEvent({ text: 'hello' }))
    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.any(String),
      'en-US-AriaNeural',
      expect.any(String),
      expect.any(String),
    )
  })

  it('uses the requested voice when it is in the allow-list', async () => {
    await handler(makeEvent({ text: 'hello', voice: 'en-US-GuyNeural' }))
    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.any(String),
      'en-US-GuyNeural',
      expect.any(String),
      expect.any(String),
    )
  })

  it('falls back to default when voice is not in the allow-list', async () => {
    await handler(makeEvent({ text: 'hello', voice: 'xx-Malicious-Voice' }))
    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.any(String),
      'en-US-AriaNeural',
      expect.any(String),
      expect.any(String),
    )
  })
})

describe('synthesize.post — rate limiting', () => {
  it('throws 429 when per-user inflight count reaches 5', async () => {
    const resolvers: Array<() => void> = []
    ;(globalThis as Record<string, unknown>).readBody = vi.fn(
      () => new Promise<void>(r => resolvers.push(r)).then(() => ({ text: 'hi' })),
    )

    const handlers = [
      handler(makeEvent()),
      handler(makeEvent()),
      handler(makeEvent()),
      handler(makeEvent()),
      handler(makeEvent()),
    ]

    await new Promise(r => setTimeout(r, 0))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 429 })

    resolvers.forEach(r => r())
    await Promise.allSettled(handlers)
  })
})

describe('synthesize.post — successful synthesis', () => {
  it('returns the audio Buffer from synthesizeSpeech', async () => {
    const result = await handler(makeEvent({ text: 'Hello world' }))
    expect(result).toEqual(FAKE_AUDIO)
  })

  it('sets Content-Type to audio/mpeg', async () => {
    await handler(makeEvent({ text: 'Hello world' }))
    expect(mockSetHeader).toHaveBeenCalledWith(expect.anything(), 'Content-Type', 'audio/mpeg')
  })

  it('sets Cache-Control header', async () => {
    await handler(makeEvent({ text: 'Hello world' }))
    expect(mockSetHeader).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', expect.stringContaining('max-age'))
  })

  it('calls synthesizeSpeech with trimmed text, voice, key, and region', async () => {
    await handler(makeEvent({ text: '  Hello world  ', voice: 'en-US-JennyNeural' }))
    expect(mockSynthesize).toHaveBeenCalledWith('Hello world', 'en-US-JennyNeural', 'key', 'eastus')
  })
})

describe('synthesize.post — Azure error handling', () => {
  it('throws 422 when synthesizeSpeech rejects with an Error', async () => {
    mockSynthesize.mockRejectedValue(new Error('Service is busy. Please wait a moment and try again.'))
    await expect(handler(makeEvent({ text: 'hello' }))).rejects.toMatchObject({
      statusCode: 422,
      message: 'Service is busy. Please wait a moment and try again.',
    })
  })

  it('throws 422 with generic message for non-Error rejection', async () => {
    mockSynthesize.mockRejectedValue('unknown sdk failure')
    await expect(handler(makeEvent({ text: 'hello' }))).rejects.toMatchObject({
      statusCode: 422,
      message: 'Speech synthesis failed.',
    })
  })
})
