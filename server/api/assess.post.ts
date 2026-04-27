import { runPronunciationAssessment } from '../utils/azure'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.azureSpeechKey || !config.azureSpeechRegion) {
    throw createError({
      statusCode: 500,
      message: 'Azure Speech credentials are not configured on the server.',
    })
  }

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, message: 'Multipart form data required.' })
  }

  const audioPart = parts.find(p => p.name === 'audio')
  const textPart = parts.find(p => p.name === 'referenceText')

  if (!audioPart?.data) {
    throw createError({ statusCode: 400, message: 'Missing audio field.' })
  }
  if (!textPart?.data) {
    throw createError({ statusCode: 400, message: 'Missing referenceText field.' })
  }

  const referenceText = textPart.data.toString('utf-8').trim()
  if (!referenceText) {
    throw createError({ statusCode: 400, message: 'referenceText must not be empty.' })
  }

  try {
    const result = await runPronunciationAssessment(
      audioPart.data,
      referenceText,
      config.azureSpeechKey,
      config.azureSpeechRegion,
    )
    return result
  } catch (err) {
    throw createError({
      statusCode: 422,
      message: err instanceof Error ? err.message : 'Assessment failed.',
    })
  }
})
