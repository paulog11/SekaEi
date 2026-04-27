import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * The AudioWorkletProcessor runs in a browser audio thread — unavailable in Node.
 * Strategy: hand-roll a minimal mock of AudioWorkletProcessor + registerProcessor,
 * evaluate the worklet source in that context, then test process() directly.
 */

type PostMessageFn = (msg: unknown, transfer?: Transferable[]) => void

interface MockPort {
  postMessage: PostMessageFn
}

interface ProcessorInstance {
  port: MockPort
  process: (inputs: Float32Array[][]) => boolean
}

function loadWorkletProcessor(): ProcessorInstance {
  let instance: ProcessorInstance | null = null
  const postMessage = vi.fn<PostMessageFn>()

  // Minimal AudioWorkletProcessor polyfill
  class AudioWorkletProcessor {
    port: MockPort = { postMessage }
  }

  function registerProcessor(_name: string, Ctor: new () => ProcessorInstance) {
    instance = new Ctor()
    instance.port = { postMessage }
  }

  const src = readFileSync(resolve(__dirname, '../../public/worklets/pcm-capture.js'), 'utf8')
  // eslint-disable-next-line no-new-func
  new Function('AudioWorkletProcessor', 'registerProcessor', src)(
    AudioWorkletProcessor,
    registerProcessor,
  )

  if (!instance) throw new Error('registerProcessor was never called')
  return instance
}

describe('pcm-capture AudioWorkletProcessor', () => {
  it('calls postMessage with { type: "pcm", data: Float32Array } for valid input', () => {
    const proc = loadWorkletProcessor()
    const input = new Float32Array([0.1, 0.2, 0.3])
    proc.process([[input]])
    expect(proc.port.postMessage).toHaveBeenCalledOnce()
    const [msg] = (proc.port.postMessage as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(msg).toMatchObject({ type: 'pcm' })
    expect(msg.data).toBeInstanceOf(Float32Array)
    const values = Array.from(msg.data as Float32Array)
    expect(values).toHaveLength(3)
    // Float32 precision — use approximate comparison
    expect(values[0]).toBeCloseTo(0.1, 5)
    expect(values[1]).toBeCloseTo(0.2, 5)
    expect(values[2]).toBeCloseTo(0.3, 5)
  })

  it('clones the buffer — data is not the same reference as input', () => {
    const proc = loadWorkletProcessor()
    const input = new Float32Array([0.5, 0.6])
    proc.process([[input]])
    const [msg] = (proc.port.postMessage as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(msg.data).not.toBe(input)
  })

  it('transfers the buffer (second argument to postMessage contains the buffer)', () => {
    const proc = loadWorkletProcessor()
    const input = new Float32Array([0.1, 0.2])
    proc.process([[input]])
    const call = (proc.port.postMessage as ReturnType<typeof vi.fn>).mock.calls[0]
    const transfer = call[1] as ArrayBuffer[]
    expect(transfer).toBeDefined()
    expect(transfer[0]).toBeInstanceOf(ArrayBuffer)
  })

  it('does NOT call postMessage when input channel is empty', () => {
    const proc = loadWorkletProcessor()
    proc.process([[new Float32Array(0)]])
    expect(proc.port.postMessage).not.toHaveBeenCalled()
  })

  it('does NOT call postMessage when inputs array is empty', () => {
    const proc = loadWorkletProcessor()
    proc.process([[]])
    expect(proc.port.postMessage).not.toHaveBeenCalled()
  })

  it('does NOT call postMessage when inputs is an empty outer array', () => {
    const proc = loadWorkletProcessor()
    proc.process([])
    expect(proc.port.postMessage).not.toHaveBeenCalled()
  })

  it('always returns true to keep the processor alive', () => {
    const proc = loadWorkletProcessor()
    expect(proc.process([[new Float32Array([0.1])]])).toBe(true)
    expect(proc.process([[new Float32Array(0)]])).toBe(true)
    expect(proc.process([[]])).toBe(true)
  })
})
