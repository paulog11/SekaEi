<script setup lang="ts">
definePageMeta({ access: 'free' })
useSekaSeoMeta({
  title: 'プライバシーポリシー — セカトークXP',
  description: 'セカトークXPのプライバシーポリシー。収集する情報、利用目的、第三者への提供について説明します。',
})
const updatedAt = '2025年5月28日'
</script>

<template>
  <main class="container-page max-w-2xl flex flex-col gap-6">

    <div>
      <h1 class="font-heading text-2xl font-bold text-ink mb-1">プライバシーポリシー</h1>
      <p class="text-xs text-ink-lighter m-0">最終更新日：{{ updatedAt }}</p>
    </div>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">1. 事業者情報</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本プライバシーポリシーは、セカトークXP（以下「本サービス」）を運営する事業者（以下「当社」）が、
        利用者の個人情報をどのように取得・利用・管理するかを定めるものです。
        <!-- TODO: 事業者名・住所・代表者名を記入してください -->
      </p>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">2. 取得する情報</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">本サービスでは、以下の情報を取得します。</p>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>メールアドレス</strong>：アカウント作成・認証に使用します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>大学名</strong>（任意）：プロフィール表示に使用します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>表示名</strong>（任意）：アプリ内表示に使用します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>音声録音データ</strong>：発音評価のため一時的にサーバーへ送信されます。評価処理後は即時破棄され、当社のサーバーには保存されません。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>発音評価結果</strong>：スコアデータ（単語・音素レベルの正確さ・流暢さ等）を保存します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>学習履歴</strong>：練習回数・連続学習日数・弱点音素などの統計情報を保存します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>デバイス識別子</strong>：複数端末からの利用を管理するため生成されます。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>アクセスログ</strong>（IPアドレス、ブラウザ情報）：ホスティングサービスにより自動収集されます。</span>
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">3. 利用目的</h2>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>本サービスの提供・維持・改善
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>発音評価フィードバックの生成
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>利用者へのトランザクションメール（確認メール、パスワードリセット等）の送信
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>不正利用の防止・セキュリティ維持
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>利用統計の集計（個人を特定しない形式）
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">4. 第三者への提供・委託</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        当社は、以下のサービスに業務を委託しており、サービス提供に必要な範囲で個人情報を共有します。
        いずれも当社との間でデータ処理契約を締結しており、法令に基づく適切な管理を行っています。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-ink-medium border-collapse">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left font-semibold py-2 pr-4 text-ink">サービス</th>
              <th class="text-left font-semibold py-2 pr-4 text-ink">用途</th>
              <th class="text-left font-semibold py-2 text-ink">所在地</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="py-2 pr-4">Supabase</td>
              <td class="py-2 pr-4">認証・データベース</td>
              <td class="py-2">米国</td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Microsoft Azure AI Speech</td>
              <td class="py-2 pr-4">音声認識・発音評価</td>
              <td class="py-2">米国 / アジア東部</td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Anthropic</td>
              <td class="py-2 pr-4">AIコーチング機能</td>
              <td class="py-2">米国</td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Vercel</td>
              <td class="py-2 pr-4">ホスティング・アクセス解析</td>
              <td class="py-2">米国</td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Google Fonts</td>
              <td class="py-2 pr-4">フォント配信</td>
              <td class="py-2">米国</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        上記以外の第三者に対して、法令に基づく場合または利用者の同意がある場合を除き、個人情報を提供しません。
      </p>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">5. 保管期間</h2>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>音声録音データ</strong>：評価処理後に即時破棄されます。当社サーバーには保存されません。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>アカウント情報・学習履歴</strong>：アカウント削除のご要請があるまで保持します。</span>
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          <span><strong>アクセスログ</strong>：Vercelの標準ログ保持期針に従います（通常30日）。</span>
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">6. 個人情報に関するご請求</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        利用者は、当社が保有する自身の個人情報について、開示・訂正・利用停止・削除を請求する権利を有します。
        ご請求は<NuxtLink to="/contact" class="text-primary underline">お問い合わせページ</NuxtLink>よりお申し付けください。
        2週間以内に対応いたします。
      </p>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">7. Cookieの利用</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本サービスは以下の目的でCookieおよびローカルストレージを使用します。
      </p>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>ログインセッションの維持（Supabase認証Cookie）
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>ページビューおよびCore Web Vitalsの計測（Vercel Analytics・Speed Insights）
        </li>
      </ul>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        Vercel Analyticsは個人を特定しない集計データのみを収集します。広告目的のトラッキングは行っていません。
      </p>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">8. お問い合わせ</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本プライバシーポリシーに関するお問い合わせは、
        <NuxtLink to="/contact" class="text-primary underline">お問い合わせページ</NuxtLink>
        よりご連絡ください。
      </p>
    </section>

    <section class="card flex flex-col gap-4">
      <h2 class="text-base font-semibold text-ink">9. 改定履歴</h2>
      <ul class="flex flex-col gap-1 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium">{{ updatedAt }}：初版制定</li>
      </ul>
    </section>

  </main>
</template>
