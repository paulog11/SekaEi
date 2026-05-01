<script setup lang="ts">
useHead({ title: 'SekaEi — English Pronunciation Practice' })
</script>

<template>
  <main>
    <!-- Hero -->
    <section class="bg-hero-fade">
      <div class="container-page text-center pt-16 sm:pt-24 pb-20 flex flex-col items-center gap-4">
        <WaveformGlyph class="text-primary w-24 h-10" />
        <h1 class="text-[clamp(2.5rem,6vw,3.5rem)] font-bold tracking-tight text-ink m-0">SekaEi</h1>
        <p class="text-base sm:text-lg text-ink-light max-w-md leading-relaxed m-0">
          English pronunciation practice — record yourself and get instant feedback.
        </p>
        <NuxtLink to="/practice" class="btn-primary btn-large mt-2">
          Start Practising
        </NuxtLink>
      </div>
    </section>

    <!-- How it works -->
    <HowItWorks />
  </main>
</template>
