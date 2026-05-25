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
const synthesizeSpeechPcmMock = vi.fn()
vi.mock('~/server/utils/azure', () => ({
  synthesizeSpeechPcm: synthesizeSpeechPcmMock,
  DEFAULT_VOICE: 'en-US-AriaNeural',
}))

// ── Approval mock ─────────────────────────────────────────────────────────────
const requireApprovedUserMock = vi.fn()
vi.mock('~/server/utils/approval', () => ({ requireApprovedUser: requireApprovedUserMock }))

// ── extractPitch mock ─────────────────────────────────────────────────────────
const extractPitchMock = vi.fn()
vi.mock('~/server/utils/extractPitch', () => ({ extractPitchFromPcm16: extractPitchMock }))

// ── Nitro stubs ───────────────────────────────────────────────────────────────
const mockSetHeader = vi.fn()
const { createError } = stubNitroGlobals({ setHeader: mockSetHeader })
const mockRuntimeConfig = vi.fn()
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)

const { default: handler } = await import('~/server/api/native-pitch.post')

// ── Helpers ───────────────────────────────────────────────────────────────────
const FAKE_USER = { id: 'user-1' }
const FAKE_PCM = Buffer.from([0, 0, 0, 0])
const FAKE_SERIES = {
  samples: [{ t: 0, hz: 220 }],
  durationSec: 1,
  medianHz: 220,
}
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
  synthesizeSpeechPcmMock.mockResolvedValue({ pcm: FAKE_PCM, sampleRate: 16000 })
  extractPitchMock.mockReturnValue(FAKE_SERIES)
})

describe('native-pitch.post — cache behaviour', () => {
  it('returns cached series without calling Azure on cache hit', async () => {
    fsReadFile.mockResolvedValue(JSON.stringify(FAKE_SERIES))

    const result = await handler(makeEvent())

    expect(fsReadFile).toHaveBeenCalledOnce()
    expect(synthesizeSpeechPcmMock).not.toHaveBeenCalled()
    expect(extractPitchMock).not.toHaveBeenCalled()
    expect(result).toEqual(FAKE_SERIES)
  })

  it('calls Azure + extractor and writes to disk on cache miss', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))

    const result = await handler(makeEvent())

    expect(synthesizeSpeechPcmMock).toHaveBeenCalledOnce()
    expect(extractPitchMock).toHaveBeenCalledWith(FAKE_PCM, 16000)
    expect(fsWriteFile).toHaveBeenCalledOnce()
    expect(result).toEqual(FAKE_SERIES)
  })

  it('still returns series even if disk write fails', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    fsWriteFile.mockRejectedValue(new Error('disk full'))

    const result = await handler(makeEvent())
    expect(result).toEqual(FAKE_SERIES)
  })
})

describe('native-pitch.post — authentication and validation', () => {
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

  it('throws 422 when synthesizeSpeechPcm rejects', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechPcmMock.mockRejectedValue(new Error('quota exceeded'))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 422 })
  })
})

describe('native-pitch.post — rate limiting', () => {
  it('throws 429 when per-user concurrency cap is exceeded', async () => {
    fsReadFile.mockRejectedValue(new Error('ENOENT'))
    synthesizeSpeechPcmMock.mockReturnValue(new Promise(() => {})) // never resolves

    const inflight: Promise<unknown>[] = []
    for (let i = 0; i < 5; i++) inflight.push(handler(makeEvent()))

    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 429 })
  })
})
