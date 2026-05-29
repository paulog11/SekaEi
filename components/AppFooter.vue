<template>
  <footer class="border-t border-border bg-surface mt-8">
    <div class="max-w-page mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span class="text-xs text-ink-lighter">© {{ year }} セカトークXP</span>
      <nav class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <NuxtLink to="/privacy" class="text-xs text-ink-light hover:text-ink transition-colors duration-150">プライバシーポリシー</NuxtLink>
        <NuxtLink to="/terms" class="text-xs text-ink-light hover:text-ink transition-colors duration-150">利用規約</NuxtLink>
        <NuxtLink to="/commerce" class="text-xs text-ink-light hover:text-ink transition-colors duration-150">特定商取引法に基づく表記</NuxtLink>
        <NuxtLink to="/contact" class="text-xs text-ink-light hover:text-ink transition-colors duration-150">お問い合わせ</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
