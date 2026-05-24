/**
 * @fileoverview Azure Cognitive Services Speech SDK wrapper. Two entry points:
 * {@link synthesizeSpeech} for TTS and {@link runPronunciationAssessment} for
 * scoring. Provider-swap point — if Azure is replaced, this file and
 * `server/api/assess.post.ts` are the only required changes.
 */

import sdk from 'microsoft-cognitiveservices-speech-sdk'
import type { AssessmentResult } from '../../types/assessment'
export { ALLOWED_VOICES, DEFAULT_VOICE } from '../../types/voices'
export type { AllowedVoice } from '../../types/voices'

/**
 * Synthesises `text` as 24 kHz mono MP3 using the given Azure voice.
 *
 * @throws An `Error` with a user-safe message (rate-limited / unauthorized /
 *   network / generic) — original SDK details are logged but not surfaced.
 */
export async function synthesizeSpeech(
  text: string,
  voice: string,
  key: string,
  region: string,
): Promise<Buffer> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region)
  speechConfig.speechSynthesisVoiceName = voice
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as unknown as sdk.AudioConfig)

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close()
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(Buffer.from(result.audioData))
        } else {
          const errorDetails = (result as unknown as { errorDetails?: string }).errorDetails
          console.error('[azure] TTS cancelled:', errorDetails ?? result.reason)
          reject(classifyAzureError(errorDetails ?? String(result.reason)))
        }
      },
      (err) => {
        synthesizer.close()
        console.error('[azure] TTS error:', err)
        reject(classifyAzureError(String(err)))
      },
    )
  })
}

function classifyAzureError(detail: string): Error {
  const d = detail.toLowerCase()
  if (d.includes('quota') || d.includes('throttl') || d.includes('rate'))
    return new Error('Service is busy. Please wait a moment and try again.')
  if (d.includes('unauthorized') || d.includes('forbidden') || d.includes('access denied'))
    return new Error('Speech service is unavailable. Please try again later.')
  if (d.includes('network') || d.includes('connect') || d.includes('timeout'))
    return new Error('Network error reaching speech service. Check your connection.')
  return new Error('Assessment failed. Please try again.')
}

/**
 * Runs Azure Pronunciation Assessment against `referenceText` over `wavBuffer`.
 *
 * Strips the 44-byte WAV header before feeding the PushStream because the
 * format is supplied explicitly (`getWaveFormatPCM(16000, 16, 1)`) — passing
 * a header would corrupt the first samples.
 *
 * Returns Azure's first NBest result with overall scores plus per-word and
 * per-phoneme breakdowns. Rejects with a user-safe `Error` on cancellation,
 * SDK errors, NoMatch, or missing NBest.
 */
export async function runPronunciationAssessment(
  wavBuffer: Buffer,
  referenceText: string,
  key: string,
  region: string,
): Promise<AssessmentResult> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region)
  speechConfig.speechRecognitionLanguage = 'en-US'

  const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  const pushStream = sdk.AudioInputStream.createPushStream(format)

  // Azure SDK expects the WAV data without the 44-byte header when using PushStream with explicit format
  // We strip the header here
  const pcmData = wavBuffer.slice(44)
  pushStream.write(pcmData.buffer.slice(pcmData.byteOffset, pcmData.byteOffset + pcmData.byteLength) as ArrayBuffer)
  pushStream.close()

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream)

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true, // enableMiscue
  )
  pronunciationConfig.enableProsodyAssessment = true

  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
  pronunciationConfig.applyTo(recognizer)

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close()

        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          const jsonStr = result.properties.getProperty(
            sdk.PropertyId.SpeechServiceResponse_JsonResult,
          )
          const json = JSON.parse(jsonStr)
          const nbest = json?.NBest?.[0]

          if (!nbest) {
            reject(new Error('No NBest result returned from Azure'))
            return
          }

          resolve({
            PronunciationAssessment: nbest.PronunciationAssessment,
            Words: nbest.Words ?? [],
            recognizedText: result.text,
          })
        } else if (result.reason === sdk.ResultReason.NoMatch) {
          reject(new Error('No speech recognized. Please speak clearly and try again.'))
        } else {
          const detail = sdk.CancellationDetails.fromResult(result)
          console.error('[azure] Recognition cancelled:', detail.errorDetails ?? detail.reason)
          reject(classifyAzureError(detail.errorDetails ?? String(detail.reason)))
        }
      },
      (err) => {
        recognizer.close()
        console.error('[azure] SDK error:', err)
        reject(classifyAzureError(String(err)))
      },
    )
  })
}
