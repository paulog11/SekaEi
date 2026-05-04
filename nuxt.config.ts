export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~/tailwind.config.ts',
  },
  supabase: {
    redirectOptions: {
      login: '/account',
      callback: '/confirm',
      exclude: ['/', '/account', '/confirm'],
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    azureSpeechKey: '',
    azureSpeechRegion: '',
    supabaseServiceKey: '',
  },
  nitro: {
    experimental: {
      wasm: false,
    },
  },
})
