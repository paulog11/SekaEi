<script setup lang="ts">
definePageMeta({ access: 'free' })
useSekaSeoMeta({
  title: '利用規約 — セカトークXP',
  description: 'セカトークXPの利用規約。サービスの利用条件、禁止事項、免責事項について定めています。',
})
const updatedAt = '2025年5月28日'
</script>

<template>
  <main class="container-page max-w-2xl flex flex-col gap-6">

    <div>
      <h1 class="font-heading text-2xl font-bold text-ink mb-1">利用規約</h1>
      <p class="text-xs text-ink-lighter m-0">最終更新日：{{ updatedAt }}</p>
    </div>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">1. 適用</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本利用規約（以下「本規約」）は、当社が提供するセカトークXP（以下「本サービス」）の利用に関して、
        すべての利用者に適用されます。本サービスを利用した時点で、本規約に同意したものとみなします。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">2. アカウント登録</h2>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          本サービスのご利用には、メールアドレスによるアカウント登録が必要です。
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          18歳未満の方は、保護者の同意を得たうえでご登録ください。
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          正確な情報を登録してください。虚偽の情報による登録は禁止します。
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          新規登録後は、当社による承認が完了するまで一部機能がご利用いただけない場合があります。
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">3. 禁止事項</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">利用者は以下の行為を行ってはなりません。</p>
      <ul class="flex flex-col gap-2 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          第三者の同意なく、その者の音声を本サービスにアップロードすること
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          自動化されたツール・スクリプトを用いた大量アクセス・不正操作
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          承認システム・招待コードシステムの不正回避
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          リバースエンジニアリング・APIの無断利用
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          法令または公序良俗に反する行為
        </li>
        <li class="text-sm text-ink-medium leading-relaxed flex gap-2">
          <span class="text-primary mt-0.5 shrink-0">●</span>
          他の利用者や当社に損害を与える行為
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">4. サービスの変更・停止</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        当社は、事前の通知なくサービスの内容を変更、または一時停止・終了することがあります。
        これにより利用者に生じた損害について、当社は責任を負いません。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">5. 招待コードと利用ティア</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本サービスには無償の標準プランと、招待コードを使用して利用可能なプログラム参加者向けプランがあります。
        招待コードは譲渡・転売を禁止します。コードの不正利用が確認された場合、アカウントを停止する場合があります。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">6. 知的財産権</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本サービスに関する著作権・商標権・その他の知的財産権は当社に帰属します。
        利用者が本サービスを通じて録音した音声データは、発音評価の実施のみを目的として利用され、その他の目的には使用しません。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">7. 免責事項</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本サービスは現状有姿（as-is）で提供されます。発音スコアはAIによる推定値であり、正確性を保証するものではありません。
        本サービスの利用により利用者に生じた損害（直接・間接を問わず）について、当社は責任を負いません。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">8. 利用者の責任</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        利用者は、本規約に違反した行為によって生じた一切の損害について責任を負います。
        第三者からの請求が当社に対してなされた場合、当社はその費用（弁護士費用を含む）の補償を利用者に求めることができます。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">9. 退会</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        アカウントの削除をご希望の場合は、
        <NuxtLink to="/contact" class="text-primary underline">お問い合わせページ</NuxtLink>
        よりご連絡ください。削除後は、個人情報保護方針に従い適切にデータを消去します。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">10. 準拠法および管轄裁判所</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        本規約は日本国法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="text-base font-semibold text-ink">11. 規約の改定</h2>
      <p class="text-sm text-ink-medium leading-relaxed m-0">
        当社は、必要に応じて本規約を変更することがあります。重要な変更がある場合はサービス内でお知らせします。
        変更後に本サービスを継続して利用した場合、改定後の規約に同意したものとみなします。
      </p>
      <ul class="flex flex-col gap-1 m-0 pl-0 list-none">
        <li class="text-sm text-ink-medium">{{ updatedAt }}：初版制定</li>
      </ul>
    </section>

  </main>
</template>
