export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@pinia/nuxt', '@vercel/analytics', '@vercel/speed-insights', '@nuxtjs/sitemap'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://sekatoku.example.com',
    name: 'セカトークXP',
  },

  sitemap: {
    exclude: [
      '/dashboard',
      '/practice',
      '/practice/words',
      '/idiomslang',
      '/rhythm',
      '/account',
      '/pending',
      '/confirm',
      '/reset',
      '/dev-only',
      '/attempt/**',
    ],
  },
  // auth-state must run first (it's async, so Nuxt awaits it) so the session
  // is cached before approval-guard's immediate watcher calls getSession().
  plugins: [
    '~/plugins/auth-state.client.ts',
    '~/plugins/approval-guard.client.ts',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#2563eb' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1,viewport-fit=cover' },
        { name: 'description', content: 'セカトークXP — AIが発音を採点する、日本の大学生のための英語練習ツール。' },
        { property: 'og:site_name', content: 'セカトークXP' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://sekatoku.example.com',
    },
  },
  nitro: {
    experimental: {
      wasm: false,
    },
  },
})
