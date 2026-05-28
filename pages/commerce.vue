<script setup lang="ts">
definePageMeta({ access: 'free' })
useHead({ title: '特定商取引法に基づく表記 — セカトークXP' })
const updatedAt = '2025年5月28日'
</script>

<template>
  <main class="container-page max-w-2xl flex flex-col gap-6">

    <div>
      <h1 class="font-heading text-2xl font-bold text-ink mb-1">特定商取引法に基づく表記</h1>
      <p class="text-xs text-ink-lighter m-0">最終更新日：{{ updatedAt }}</p>
    </div>

    <section class="card flex flex-col gap-4">
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        現在、セカトークXPは無償でサービスを提供しています。有償プランを開始する際に、以下の項目を更新します。
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-ink-medium border-collapse">
          <tbody class="divide-y divide-border">
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink w-40 shrink-0 align-top">販売事業者</td>
              <td class="py-3 text-ink-medium"><!-- TODO: 事業者名 --></td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">代表者</td>
              <td class="py-3 text-ink-medium"><!-- TODO: 代表者名 --></td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">所在地</td>
              <td class="py-3 text-ink-medium"><!-- TODO: 住所 --></td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">連絡先</td>
              <td class="py-3 text-ink-medium">
                <NuxtLink to="/contact" class="text-primary underline">お問い合わせページ</NuxtLink>よりご連絡ください。
              </td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">販売価格</td>
              <td class="py-3 text-ink-medium">現在、すべての機能を無償でご提供しています。</td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">お支払い方法</td>
              <td class="py-3 text-ink-medium">現時点では有償サービスはありません。</td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">返品・キャンセル</td>
              <td class="py-3 text-ink-medium">現時点では有償サービスはありません。</td>
            </tr>
            <tr>
              <td class="py-3 pr-6 font-semibold text-ink align-top">動作環境</td>
              <td class="py-3 text-ink-medium">最新版のChrome、Safari、Firefox、Edgeでご利用いただけます。マイク接続が必要です。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </main>
</template>
