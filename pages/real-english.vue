<script setup lang="ts">
import { MOCK_IDIOMS } from '~/mocks/mockIdioms'
</script>

<template>
  <main class="container-page pb-28 sm:pb-16">
    <div class="pt-10 sm:pt-14 mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold text-ink mb-2">Real English</h1>
      <p class="text-ink-light text-base sm:text-lg">Idioms &amp; slang — coming soon</p>
    </div>

    <ul class="flex flex-col gap-3">
      <li
        v-for="idiom in MOCK_IDIOMS"
        :key="idiom.id"
        class="card py-3 px-4 text-ink font-medium"
      >
        {{ idiom.phrase }}
      </li>
    </ul>
  </main>
</template>
