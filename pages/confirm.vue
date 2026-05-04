<script setup lang="ts">
useHead({ title: 'Confirming — SekaEi' })

onMounted(() => {
  setTimeout(() => navigateTo('/practice'), 2000)
})
</script>

<template>
  <main class="container-page flex flex-col items-center justify-center py-24 gap-4">
    <p class="text-lg font-semibold text-ink">Email confirmed!</p>
    <p class="text-sm text-ink-light">Redirecting you to practice…</p>
  </main>
</template>
