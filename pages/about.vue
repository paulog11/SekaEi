<script setup lang="ts">
definePageMeta({ access: 'free' })
useHead({ title: 'About — セカトークXP' })
</script>

<template>
  <main class="container-page flex flex-col items-center gap-8 pb-12">

    <!-- Hero -->
    <div class="w-full max-w-2xl text-center pt-4">
      <div class="flex items-center justify-center gap-2 mb-3">
        <span class="font-heading text-3xl font-bold text-ink tracking-tight">セカトーク</span>
        <span class="text-sm font-bold bg-primary text-white px-2 py-1 rounded-md tracking-widest leading-none">XP</span>
      </div>
      <p class="text-ink-light text-base m-0">Extra Practice for English Learners</p>
    </div>

    <!-- What is it -->
    <section class="w-full max-w-2xl card">
      <h2 class="text-base font-semibold text-ink mb-3">What is セカトークXP?</h2>
      <p class="text-sm text-ink-medium m-0 leading-relaxed">
        セカトークXP is an English practice tool designed for Japanese university students.
        It gives you real, measurable feedback on your spoken English — not just "good" or "bad",
        but a precise score for every word and every sound. The more you practice, the more clearly you can see your progress.
      </p>
      <p class="text-sm text-ink-medium mt-3 m-0 leading-relaxed">
        XP stands for <strong>Extra Practice</strong> — a reminder that fluency comes from consistent effort beyond the classroom.
      </p>
    </section>

    <!-- Pronunciation Practice -->
    <section class="w-full max-w-2xl card">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path stroke-linecap="round" d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round" />
            <line x1="9" y1="21" x2="15" y2="21" stroke-linecap="round" />
          </svg>
        </div>
        <div>
          <h2 class="text-base font-semibold text-ink mb-2">Pronunciation Practice</h2>
          <p class="text-sm text-ink-medium m-0 leading-relaxed">
            Choose a passage — a movie quote, a speech, or your own text — then read it aloud.
            Azure AI analyses your recording and scores each word on accuracy, fluency, completeness, and prosody.
          </p>
          <ul class="mt-3 flex flex-col gap-1.5 m-0 pl-0 list-none">
            <li class="flex items-start gap-2 text-sm text-ink-medium">
              <span class="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
              Green words (≥80) — pronounced clearly
            </li>
            <li class="flex items-start gap-2 text-sm text-ink-medium">
              <span class="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
              Amber words (60–79) — nearly there
            </li>
            <li class="flex items-start gap-2 text-sm text-ink-medium">
              <span class="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
              Red words (&lt;60) — need more practice
            </li>
          </ul>
          <p class="text-sm text-ink-medium mt-3 m-0 leading-relaxed">
            Tap any word to see a breakdown of its individual sounds (phonemes), so you know exactly which part to work on.
          </p>
        </div>
      </div>
    </section>

    <!-- Idioms & Slang -->
    <section class="w-full max-w-2xl card">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 4.5A9 9 0 1 0 12 3a9 9 0 0 0-9 9c0 1.7.47 3.29 1.29 4.64L3 21l4.36-1.29A8.96 8.96 0 0 0 12 21" />
          </svg>
        </div>
        <div>
          <h2 class="text-base font-semibold text-ink mb-2">Idioms &amp; Slang <span class="text-xs font-normal text-ink-lighter ml-1">Work in progress</span></h2>
          <p class="text-sm text-ink-medium m-0 leading-relaxed">
            English idioms are confusing because their meaning has nothing to do with the literal words.
            "Break a leg" doesn't mean anyone is getting hurt.
          </p>
          <p class="text-sm text-ink-medium mt-3 m-0 leading-relaxed">
            In this track you see a literal image of the phrase, then choose its real figurative meaning from a 2×2 grid of images.
            It trains you to connect the expression to the concept — the way a native speaker does naturally.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <div class="w-full max-w-2xl flex gap-3 flex-wrap">
      <NuxtLink to="/practice" class="btn-primary flex-1 text-center">Start Pronunciation Practice</NuxtLink>
      <NuxtLink to="/idiomslang" class="btn-secondary flex-1 text-center">Try Idioms &amp; Slang</NuxtLink>
    </div>

  </main>
</template>
