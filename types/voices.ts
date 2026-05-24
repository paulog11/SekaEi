export const ALLOWED_VOICES = [
  'en-US-AriaNeural',
  'en-US-JennyNeural',
  'en-US-GuyNeural',
  'en-GB-SoniaNeural',
  'en-GB-RyanNeural',
  'en-AU-NatashaNeural',
  'en-AU-WilliamNeural',
  'en-CA-ClaraNeural',
  'en-CA-LiamNeural',
] as const
export type AllowedVoice = typeof ALLOWED_VOICES[number]
export const DEFAULT_VOICE: AllowedVoice = 'en-US-AriaNeural'

export type VoiceRegion = 'American' | 'British' | 'Australian' | 'Canadian'
export const VOICE_REGIONS: readonly VoiceRegion[] = ['American', 'British', 'Australian', 'Canadian']

export const VOICE_LABELS: Record<AllowedVoice, { name: string; gender: string; region: VoiceRegion }> = {
  'en-US-AriaNeural': { name: 'Aria', gender: 'Female', region: 'American' },
  'en-US-JennyNeural': { name: 'Jenny', gender: 'Female', region: 'American' },
  'en-US-GuyNeural': { name: 'Guy', gender: 'Male', region: 'American' },
  'en-GB-SoniaNeural': { name: 'Sonia', gender: 'Female', region: 'British' },
  'en-GB-RyanNeural': { name: 'Ryan', gender: 'Male', region: 'British' },
  'en-AU-NatashaNeural': { name: 'Natasha', gender: 'Female', region: 'Australian' },
  'en-AU-WilliamNeural': { name: 'William', gender: 'Male', region: 'Australian' },
  'en-CA-ClaraNeural': { name: 'Clara', gender: 'Female', region: 'Canadian' },
  'en-CA-LiamNeural': { name: 'Liam', gender: 'Male', region: 'Canadian' },
}
