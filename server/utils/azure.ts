import sdk from 'microsoft-cognitiveservices-speech-sdk'
import type { AssessmentResult } from '../../types/assessment'

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
  pushStream.write(pcmData)
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
