<script setup lang="ts">
definePageMeta({ middleware: ['stage'] })
</script>

<template>
  <main class="container-page">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-ink">Idioms</h1>
    </div>

    <IdiomLabView />
  </main>
</template>
