<script setup lang="ts">
useHead({ title: 'Account — SekaEi' })

const activeTab = ref<'signin' | 'signup'>('signin')
const submitted = ref(false)

function handleSubmit() {
  submitted.value = true
}

function switchTab(tab: 'signin' | 'signup') {
  activeTab.value = tab
  submitted.value = false
}
</script>

<template>
  <main class="page">
    <div class="card">
      <div class="tabs">
        <button
          :class="['tab', { 'tab--active': activeTab === 'signin' }]"
          @click="switchTab('signin')"
        >
          Sign in
        </button>
        <button
          :class="['tab', { 'tab--active': activeTab === 'signup' }]"
          @click="switchTab('signup')"
        >
          Create account
        </button>
      </div>

      <div v-if="submitted" class="notice">
        Authentication isn't enabled in this preview.
      </div>

      <form v-if="activeTab === 'signin'" class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label" for="signin-email">Email</label>
          <input id="signin-email" class="input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="field">
          <label class="label" for="signin-password">Password</label>
          <input id="signin-password" class="input" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn--primary">Sign in</button>
      </form>

      <form v-else class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="label" for="signup-name">Name</label>
          <input id="signup-name" class="input" type="text" placeholder="Your name" autocomplete="name">
        </div>
        <div class="field">
          <label class="label" for="signup-email">Email</label>
          <input id="signup-email" class="input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="field">
          <label class="label" for="signup-password">Password</label>
          <input id="signup-password" class="input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <div class="field">
          <label class="label" for="signup-confirm">Confirm password</label>
          <input id="signup-confirm" class="input" type="password" placeholder="••••••••" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn--primary">Create account</button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  justify-content: center;
}

.card {
  width: 100%;
  max-width: 420px;
  margin-top: 2rem;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 2rem;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  flex: 1;
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab:hover { color: #374151; }
.tab--active { color: #2563eb; border-bottom-color: #2563eb; }

.notice {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  color: #1d4ed8;
  margin-bottom: 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: #2563eb; }

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}
.btn:hover { opacity: 0.85; }
.btn--primary { background: #2563eb; color: white; }
</style>
