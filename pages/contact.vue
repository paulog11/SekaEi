<script setup lang="ts">
definePageMeta({ access: 'free' })
useHead({ title: 'お問い合わせ — セカトークXP' })

// TODO: Replace with your actual support email address
const SUPPORT_EMAIL = 'support@example.com'
</script>

<template>
  <main class="container-page max-w-2xl flex flex-col gap-6">

    <div>
      <h1 class="font-heading text-2xl font-bold text-ink mb-1">お問い合わせ</h1>
      <p class="text-sm text-ink-light m-0">ご質問・ご要望はメールにてお受けしています。2週間以内に返信いたします。</p>
    </div>

    <section class="card flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-base font-semibold text-ink">一般のお問い合わせ</h2>
          <p class="text-sm text-ink-medium leading-relaxed m-0">
            機能に関するご質問、不具合のご報告、その他ご意見・ご要望については下記のメールアドレスまでご連絡ください。
          </p>
          <a
            :href="`mailto:${SUPPORT_EMAIL}`"
            class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
          >
            {{ SUPPORT_EMAIL }}
          </a>
        </div>
      </div>
    </section>

    <section class="card flex flex-col gap-4">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
          </svg>
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-base font-semibold text-ink">個人情報に関するご請求</h2>
          <p class="text-sm text-ink-medium leading-relaxed m-0">
            個人情報保護法に基づく開示・訂正・利用停止・削除のご請求は、同じメールアドレスにて承ります。
            件名に <strong>「[個人情報]」</strong> とご記入いただくと、迅速に対応いたします。
          </p>
          <ul class="flex flex-col gap-1.5 m-0 pl-0 list-none">
            <li class="text-sm text-ink-medium flex gap-2 items-center">
              <span class="text-amber-500 shrink-0">●</span>開示請求（保有する情報の確認）
            </li>
            <li class="text-sm text-ink-medium flex gap-2 items-center">
              <span class="text-amber-500 shrink-0">●</span>訂正請求（情報の修正）
            </li>
            <li class="text-sm text-ink-medium flex gap-2 items-center">
              <span class="text-amber-500 shrink-0">●</span>利用停止請求
            </li>
            <li class="text-sm text-ink-medium flex gap-2 items-center">
              <span class="text-amber-500 shrink-0">●</span>削除請求（アカウント削除を含む）
            </li>
          </ul>
          <a
            :href="`mailto:${SUPPORT_EMAIL}?subject=%5B%E5%80%8B%E4%BA%BA%E6%83%85%E5%A0%B1%5D%20`"
            class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
          >
            {{ SUPPORT_EMAIL }}
          </a>
        </div>
      </div>
    </section>

    <div class="text-center">
      <p class="text-xs text-ink-lighter m-0">
        詳しくは
        <NuxtLink to="/privacy" class="text-primary underline">プライバシーポリシー</NuxtLink>
        もあわせてご確認ください。
      </p>
    </div>

  </main>
</template>
