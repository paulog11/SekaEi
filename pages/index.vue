<script setup lang="ts">
useHead({ title: 'SekaEi — English Pronunciation Practice' })
</script>

<template>
  <main class="home">
    <div class="home__hero">
      <h1 class="home__title">SekaEi</h1>
      <p class="home__subtitle">English pronunciation practice — record yourself and get instant feedback.</p>
      <NuxtLink to="/practice" class="btn btn--primary btn--large">
        Start Practising
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}

.home__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5rem 0 4rem;
  gap: 1rem;
}

.home__title {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -1px;
  color: #111827;
  margin: 0;
}

.home__subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  max-width: 480px;
  line-height: 1.6;
  margin: 0;
}

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn--primary { background: #2563eb; color: white; }
.btn--large   { padding: 0.8rem 2rem; font-size: 1rem; }
</style>
