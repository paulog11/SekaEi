export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@pinia/nuxt'],
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#2563eb' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1,viewport-fit=cover' },
      ],
    },
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~/tailwind.config.ts',
  },
  supabase: {
    redirectOptions: {
      login: '/account',
      callback: '/confirm',
      exclude: ['/', '/account', '/confirm', '/reset'],
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
    anthropicApiKey: '',
    public: {
      // 'development' | 'production'
      // Pages marked stage: 'development' redirect to /dev-only in production.
      appStage: process.env.NUXT_PUBLIC_APP_STAGE ?? 'development',
    },
  },
  nitro: {
    experimental: {
      wasm: false,
    },
  },
})
