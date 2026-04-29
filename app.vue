<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const { apiFetch } = useApi()
onMounted(() => {
  apiFetch('/api/me').catch(() => {})
})
</script>

<template>
  <header class="site-nav">
    <div class="site-nav__inner">
      <NuxtLink to="/" class="site-nav__brand">SekaEi</NuxtLink>
      <nav class="site-nav__links">
        <NuxtLink to="/" class="site-nav__link">Home</NuxtLink>
        <NuxtLink to="/practice" class="site-nav__link">Practice</NuxtLink>
        <NuxtLink to="/account" class="site-nav__link">Account</NuxtLink>
      </nav>
    </div>
  </header>
  <NuxtPage />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: #fff;
  color: #111827;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.site-nav {
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.site-nav__inner {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 1.25rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-nav__brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  text-decoration: none;
  letter-spacing: -0.5px;
}

.site-nav__links {
  display: flex;
  gap: 0.25rem;
}

.site-nav__link {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.site-nav__link:hover { color: #111827; background: #f9fafb; }
.site-nav__link.router-link-active { color: #2563eb; }
.site-nav__link.router-link-exact-active { color: #2563eb; background: #eff6ff; }
</style>
