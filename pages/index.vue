<script setup lang="ts">
definePageMeta({})

const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string) || 'https://sekatoku.example.com'

useSekaSeoMeta({
  title: 'セカトークXP — 英語発音・イディオム練習',
  description: 'AIが発音を採点してくれる、日本の大学生のための英語練習ツール。すべての単語・音素をスコアリング。無料で始められます。',
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'セカトークXP',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      inLanguage: 'ja',
      url: siteUrl,
      description: 'AIが発音を採点してくれる、日本の大学生のための英語練習ツール。',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    }),
  }],
})

const features = [
  {
    icon: 'mic',
    title: 'Pronunciation Practice',
    description: 'Read a passage aloud. AI scores every word and phoneme — accuracy, fluency, completeness, and prosody.',
  },
  {
    icon: 'chat',
    title: 'Idioms & Slang',
    description: 'See a literal image, pick the figurative meaning. Train your intuition for natural English expressions.',
  },
  {
    icon: 'chart',
    title: 'Pitch Contour Graph',
    description: 'Visualise how your intonation rises and falls compared to a native speaker after each recording.',
  },
  {
    icon: 'star',
    title: 'Progress Tracking',
    description: 'Streak, passage mastery, weak phonemes — see exactly where to focus your practice.',
  },
]
</script>

<template>
  <main>
    <!-- Hero -->
    <section class="bg-hero-fade">
      <div class="max-w-page mx-auto px-5 pt-16 pb-20 flex flex-col items-center text-center gap-6">
        <div class="flex items-center gap-2">
          <span class="font-heading text-4xl font-bold tracking-tight text-ink">セカトーク</span>
          <span class="text-sm font-bold bg-primary text-white px-2 py-1 rounded-md tracking-widest leading-none">XP</span>
        </div>

        <h1 class="font-heading text-3xl sm:text-4xl font-bold text-ink max-w-xl leading-tight m-0">
          英語をもっとリアルに、<br class="hidden sm:block">もっと正確に。
        </h1>

        <p class="text-base text-ink-light max-w-md m-0 leading-relaxed">
          AI-powered pronunciation scoring and idiom practice, built for Japanese university students.
          Read a passage, get instant feedback on every word and sound.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 mt-2">
          <NuxtLink to="/account" class="btn-primary px-8 py-3 text-base font-semibold">
            無料で始める
          </NuxtLink>
          <NuxtLink to="/about" class="btn-secondary px-8 py-3 text-base font-semibold">
            もっと見る
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Screenshot placeholder -->
    <section class="bg-white border-y border-border py-12">
      <div class="max-w-page mx-auto px-5">
        <img src="/assets/landing-screenshot.jpg" alt="App screenshot" />
      </div>
    </section>

    <!-- Features -->
    <section class="bg-white py-16">
      <div class="max-w-page mx-auto px-5">
        <h2 class="font-heading text-2xl font-bold text-ink text-center mb-10">What you'll learn</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

          <!-- Pronunciation -->
          <div class="card flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path stroke-linecap="round" d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round" />
                <line x1="9" y1="21" x2="15" y2="21" stroke-linecap="round" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-ink mb-1">Pronunciation Practice</h3>
              <p class="text-sm text-ink-medium m-0 leading-relaxed">
                Read a passage aloud. AI scores every word and phoneme — accuracy, fluency, completeness, and prosody.
              </p>
            </div>
          </div>

          <!-- Idioms -->
          <div class="card flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 4.5A9 9 0 1 0 12 3a9 9 0 0 0-9 9c0 1.7.47 3.29 1.29 4.64L3 21l4.36-1.29A8.96 8.96 0 0 0 12 21" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-ink mb-1">Idioms &amp; Slang</h3>
              <p class="text-sm text-ink-medium m-0 leading-relaxed">
                See a literal image, pick the figurative meaning. Train your intuition for natural English expressions.
              </p>
            </div>
          </div>

          <!-- Pitch graph -->
          <div class="card flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <polyline stroke-linecap="round" stroke-linejoin="round" points="3 17 7 12 11 14 15 8 21 10" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-ink mb-1">Pitch Contour Graph</h3>
              <p class="text-sm text-ink-medium m-0 leading-relaxed">
                Visualise how your intonation rises and falls compared to a native speaker after each recording.
              </p>
            </div>
          </div>

          <!-- Progress -->
          <div class="card flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-ink mb-1">Progress Tracking</h3>
              <p class="text-sm text-ink-medium m-0 leading-relaxed">
                Streak, passage mastery, weak phonemes — see exactly where to focus your practice.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-hero-fade py-16">
      <div class="max-w-page mx-auto px-5 text-center flex flex-col items-center gap-5">
        <h2 class="font-heading text-2xl font-bold text-ink m-0">Ready to practise?</h2>
        <p class="text-sm text-ink-light max-w-sm m-0">
          Sign up for free and start getting real feedback on your English pronunciation today.
        </p>
        <NuxtLink to="/account" class="btn-primary px-8 py-3 text-base font-semibold">
          Sign up — it's free
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
