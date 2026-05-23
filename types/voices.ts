export const ALLOWED_VOICES = ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'] as const
export type AllowedVoice = typeof ALLOWED_VOICES[number]
export const DEFAULT_VOICE: AllowedVoice = 'en-US-AriaNeural'

export const VOICE_LABELS: Record<AllowedVoice, { name: string; gender: string }> = {
  'en-US-AriaNeural': { name: 'Aria', gender: 'Female' },
  'en-US-JennyNeural': { name: 'Jenny', gender: 'Female' },
  'en-US-GuyNeural': { name: 'Guy', gender: 'Male' },
}
