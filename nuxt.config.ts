export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    azureSpeechKey: '',
    azureSpeechRegion: '',
    supabaseUrl: '',
    supabaseServiceKey: '',
  },
  nitro: {
    experimental: {
      wasm: false,
    },
  },
})
