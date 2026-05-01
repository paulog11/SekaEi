<template>
  <section class="container-page py-12 sm:py-16 !pt-0">
    <h2 class="text-lg font-semibold text-ink text-center mb-10">How it works</h2>
    <ol class="flex flex-col sm:flex-row gap-6 sm:gap-8 list-none p-0 m-0">
      <li
        v-for="step in steps"
        :key="step.n"
        class="flex-1 flex flex-col items-center text-center gap-3"
      >
        <div class="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center font-semibold text-base shrink-0">
          {{ step.n }}
        </div>
        <h3 class="text-base font-semibold text-ink m-0">{{ step.title }}</h3>
        <p class="text-sm text-ink-light leading-relaxed m-0">{{ step.body }}</p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    n: 1,
    title: 'Choose a passage',
    body: 'Pick from our library of curated texts, or paste any English text you want to practise.',
  },
  {
    n: 2,
    title: 'Record yourself reading',
    body: 'Read the passage aloud into your microphone. Your video stays private — only audio is processed.',
  },
  {
    n: 3,
    title: 'Get instant feedback',
    body: 'See per-word and per-phoneme accuracy scores powered by Azure AI Speech.',
  },
]
</script>
