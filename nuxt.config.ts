export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~/tailwind.config.ts',
  },
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
