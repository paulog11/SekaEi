/**
 * AudioWorkletProcessor that emits raw Float32 PCM chunks back to the main thread.
 * Registered as 'pcm-capture-processor'.
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length > 0) {
      // Clone the buffer — the underlying SharedArrayBuffer is recycled after process() returns
      const channelData = input[0].slice(0)
      this.port.postMessage({ type: 'pcm', data: channelData }, [channelData.buffer])
    }
    return true
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor)
