<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Coming Soon — セカトークXP' })
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-white">
    <div class="text-5xl" aria-hidden="true">🚧</div>
    <div class="max-w-sm">
      <h1 class="text-2xl font-bold text-ink mb-2">Coming soon</h1>
      <p class="text-ink-light text-sm leading-relaxed">
        This feature is still being built. Check back soon.
      </p>
    </div>
    <NuxtLink to="/" class="btn-secondary text-sm">
      Back to home
    </NuxtLink>
  </div>
</template>
