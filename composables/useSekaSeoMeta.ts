const DEFAULT_DESCRIPTION = 'セカトークXP — AIが発音を採点する、日本の大学生のための英語練習ツール。発音・イディオムを無料で上達できます。'

interface SekaSeoOptions {
  title: string
  description?: string
  path?: string
  ogImage?: string
  noindex?: boolean
}

export function useSekaSeoMeta(options: SekaSeoOptions) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = (config.public.siteUrl as string) || 'https://sekatoku.example.com'
  const path = options.path ?? route.path
  const canonicalUrl = `${siteUrl}${path}`
  const description = options.description ?? DEFAULT_DESCRIPTION
  const ogImage = options.ogImage ? `${siteUrl}${options.ogImage}` : `${siteUrl}/og-image.png`

  useSeoMeta({
    title: options.title,
    description,
    ogTitle: options.title,
    ogDescription: description,
    ogImage,
    ogUrl: canonicalUrl,
    ogSiteName: 'セカトークXP',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: description,
    twitterImage: ogImage,
    ...(options.noindex ? { robots: 'noindex, nofollow' } : {}),
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
}
