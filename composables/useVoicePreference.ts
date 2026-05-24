/**
 * @fileoverview Module-level shared ref for the user's preferred TTS voice,
 * persisted to localStorage. Unknown values fall back to `DEFAULT_VOICE`.
 */

import { ref } from 'vue'
import { ALLOWED_VOICES, DEFAULT_VOICE, type AllowedVoice } from '~/types/voices'

const STORAGE_KEY = 'sekaei_voice'

function readStored(): AllowedVoice {
  if (typeof localStorage === 'undefined') return DEFAULT_VOICE
  const v = localStorage.getItem(STORAGE_KEY)
  return (ALLOWED_VOICES as readonly string[]).includes(v ?? '') ? (v as AllowedVoice) : DEFAULT_VOICE
}

const voice = ref<AllowedVoice>(readStored())

export function useVoicePreference() {
  function setVoice(v: AllowedVoice) {
    voice.value = v
    localStorage.setItem(STORAGE_KEY, v)
  }
  return { voice, setVoice }
}
