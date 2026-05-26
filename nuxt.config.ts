export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@pinia/nuxt', '@vercel/analytics', '@vercel/speed-insights'],
  // auth-state must run first (it's async, so Nuxt awaits it) so the session
  // is cached before approval-guard's immediate watcher calls getSession().
  plugins: [
    '~/plugins/auth-state.client.ts',
    '~/plugins/approval-guard.client.ts',
  ],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
      exclude: ['/', '/account', '/confirm', '/reset', '/pending'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: true,
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
      },
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    azureSpeechKey: '',
    azureSpeechRegion: '',
    supabaseSecretKey: '',
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
