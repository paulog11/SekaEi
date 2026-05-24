import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { stubNitroGlobals } from '../fixtures/serverTestHarness'

// ── fs mock ───────────────────────────────────────────────────────────────────
const fsReadFile = vi.fn()
const fsMkdir = vi.fn()
const fsWriteFile = vi.fn()

vi.mock('node:fs', () => ({
  promises: { readFile: fsReadFile, mkdir: fsMkdir, writeFile: fsWriteFile },
}))

// ── Azure mock ────────────────────────────────────────────────────────────────
const synthesizeSpeechMock = vi.fn()
vi.mock('~/server/utils/azure', () => ({
  synthesizeSpeech: synthesizeSpeechMock,
  DEFAULT_VOICE: 'en-US-AriaNeural',
}))

// ── Approval mock ─────────────────────────────────────────────────────────────
const requireApprovedUserMock = vi.fn()
vi.mock('~/server/utils/approval', () => ({ requireApprovedUser: requireApprovedUserMock }))

// ── Nitro stubs ───────────────────────────────────────────────────────────────
const mockSetHeader = vi.fn()
const { createError } = stubNitroGlobals({ setHeader: mockSetHeader })
const mockRuntimeConfig = vi.fn()
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

const { default: handler } = await import('~/server/api/native-audio.post')

// ── Helpers ───────────────────────────────────────────────────────────────────
const FAKE_USER = { id: 'user-1' }
const FAKE_AUDIO = Buffer.from('mp3data')
const TEXT = 'Hello world'

function makeEvent(body?: Record<string, unknown>) {
  return { __body: body ?? { text: TEXT } } as unknown as H3Event
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))
  requireApprovedUserMock.mockResolvedValue(FAKE_USER)
  mockRuntimeConfig.mockReturnValue({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })
  fsMkdir.mockResolvedValue(undefined)
  fsWriteFile.mockResolvedValue(undefined)
})

describe('native-audio.post — cache behaviour', () => {
  it('returns cached file without calling Azure on cache hit', async () => {
    fsReadFile.mockResolvedValue(FAKE_AUDIO)

    await handler(makeEvent())

    expect(fsReadFile).toHaveBeenCalledOnce()
    expect(synthesizeSpeechMock).not.toHaveBeenCalled()
  })

  it('calls Azure and writes to disk on cache miss', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechMock.mockResolvedValue(FAKE_AUDIO)

    await handler(makeEvent())

    expect(synthesizeSpeechMock).toHaveBeenCalledOnce()
    expect(fsWriteFile).toHaveBeenCalledOnce()
  })

  it('still returns audio even if disk write fails', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechMock.mockResolvedValue(FAKE_AUDIO)
    fsWriteFile.mockRejectedValue(new Error('disk full'))

    const result = await handler(makeEvent())
    expect(result).toBeDefined()
  })
})

describe('native-audio.post — authentication and validation', () => {
  it('throws 401 when requireApprovedUser throws', async () => {
    requireApprovedUserMock.mockRejectedValue(createError({ statusCode: 401, message: 'Unauthorized' }))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 500 when Azure credentials are missing', async () => {
    mockRuntimeConfig.mockReturnValue({ azureSpeechKey: '', azureSpeechRegion: '' })

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 400 for empty text', async () => {
    await expect(handler(makeEvent({ text: '' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for text longer than 2000 chars', async () => {
    await expect(handler(makeEvent({ text: 'a'.repeat(2001) }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 422 when synthesizeSpeech rejects', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechMock.mockRejectedValue(new Error('quota exceeded'))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 422 })
  })
})

describe('native-audio.post — rate limiting', () => {
  it('throws 429 when per-user concurrency cap is exceeded', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechMock.mockReturnValue(new Promise(() => {})) // never resolves

    const inflight: Promise<unknown>[] = []
    for (let i = 0; i < 5; i++) inflight.push(handler(makeEvent()))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 429 })
  })
})
