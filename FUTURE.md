# Future / Out of Scope

- Cloud storage / audio upload
- Streaming / real-time scoring (current flow is record-then-score)
- Multi-language support (Azure supports 33 locales — just change `speechRecognitionLanguage` in `azure.ts`)
- Real English quiz logic beyond what exists: audio playback, scoring persistence, spaced repetition

## User approval

- **Admin UI in-app** — list pending users and approve/reject without going to the Supabase dashboard
- **Email notification to user on approval** — right now users just get access the next time they load the app; no "you've been approved" email is sent
- **Signup rate limiting** — nothing stops someone from creating many accounts and flooding your approval inbox
- **Signup reason field** — let applicants explain who they are when they sign up

## Revert: temporary email-free signup

A temporary change disabled signup emails so accounts can be created while email
delivery is unreliable. New users now land on /pending and must be approved
manually in the Supabase Dashboard (profiles.approval_status -> 'approved'). To
restore the normal email-confirmation + admin-approval flow:

1. Hosted Dashboard -> Authentication -> Sign In / Providers -> Email -> turn
   "Confirm email" back ON.
2. Hosted Dashboard -> Database -> Webhooks -> re-enable the send-approval-email
   webhook (INSERT on public.profiles).
3. `pages/account.vue` -> restore handleSignUp()'s success branch to
   `signupPending.value = true`; remove the device-claim + navigateTo('/pending')
   lines.
4. `supabase/config.toml` -> set enable_confirmations = true (then
   `supabase stop && supabase start` for local dev).

---

# Industry-Standard Gap Survey (2026-05-28)

A broad, categorized inventory of what an industry-standard public web app for
Japanese university students would typically ship with, but is currently absent
or partial in this repo. Each item lists what's missing, why it matters, and a
concrete suggested approach (library / file / Vercel feature). This is a menu,
not a prescribed ship list.

## 1. Legal & compliance

Currently fully absent. For a Japan-targeted product collecting email + voice
recordings + behavioral data, this is the largest single gap.

- **Privacy policy (プライバシーポリシー)** — required under APPI; must disclose what's collected (email, university, audio uploads, attempt history), retention, third parties (Supabase, Azure Speech, Anthropic, Vercel Analytics, Google Fonts). Add as `pages/privacy.vue` with both Japanese and English versions. Link from `account.vue` signup form (consent checkbox), footer, and the `confirm` page.
- **Terms of service (利用規約)** — sets acceptable use, no-warranty, dispute resolution. `pages/terms.vue`. Sign-up form should checkbox "プライバシーポリシーと利用規約に同意します" before enabling submit.
- **Specified Commercial Transactions Act notice (特定商取引法に基づく表記)** — only required if anything paid is offered. Skippable today; revisit if invite-code tier ever becomes paid.
- **Cookie / tracking disclosure** — Supabase session cookies + Vercel Analytics require disclosure. A simple "we use cookies for sign-in and analytics — see [Privacy]" banner (no per-vendor opt-in needed at current scope unless you onboard EU users) using a tiny custom component in `app.vue` keyed by `localStorage`.
- **Contact / data-subject-request channel** — APPI requires a way for users to request access/deletion/correction. Add `pages/contact.vue` with a mailto and a short request form, plus link in privacy policy.
- **Age / parental disclosure** — university students are usually adults but some are minors (under 18). A simple "you confirm you are 18+ or have your guardian's consent" line in the signup form covers it.

Suggested approach: keep these as static `.vue` pages with content in both `ja`
and `en` sections. No CMS needed at this size. Link them from a new shared
`<AppFooter>` component on all non-app routes.

## 2. SEO, discoverability & marketing surface

Logged-out visitors currently land on a dashboard. There is no marketing page,
no social card image, and search engines have minimal signal.

- **Marketing landing page** — replace `/` for unauthenticated visitors with a real landing page (hero, screenshot, "what you'll learn", testimonials/quotes if any, signup CTA). Keep `/dashboard` as the post-login home and route `/` based on `authStore.isLoggedIn`. Could also extract to `pages/index.vue` vs new `pages/dashboard.vue`.
- **`robots.txt`** — add `public/robots.txt` allowing all crawlers except `/account`, `/pending`, `/attempt/*`, `/practice/words`. Reference sitemap.
- **Sitemap** — install `@nuxtjs/sitemap` to auto-generate from page routes. Exclude protected/auth-gated paths.
- **Per-page meta** — every `useHead` call today sets only `title`. Extend to `useSeoMeta({ title, description, ogTitle, ogDescription, ogImage, twitterCard: 'summary_large_image' })`. Public pages (landing, about, privacy, terms) need real descriptions; protected pages can use defaults.
- **Open Graph / Twitter card image** — design a 1200×630 brand card (the gradient + セカトークXP logo would work). Drop into `public/og-image.png` and reference as `ogImage` default.
- **`<html lang>`** — currently absent. Set in `nuxt.config.ts` under `app.head.htmlAttrs.lang = 'ja'` (primary audience is JP). Improves a11y and search.
- **Structured data (JSON-LD)** — `EducationalApplication` schema on the landing page; helps Google rich results.
- **Canonical URLs** — set `link[rel=canonical]` per page via `useHead`.

Suggested approach: `@nuxtjs/sitemap` module + one shared composable
`useSekaSeoMeta(overrides)` that fills in brand defaults (og:image,
og:site_name, twitter:site) so each page only specifies what's unique.

## 3. Account lifecycle (post-signup management)

These are user-rights features expected in any modern public app, and most are
required by APPI.

- **Account deletion** — currently absent. Required under APPI's right to deletion. Add `DELETE /api/me` that deletes profile + attempts + flagged_words + invite_redemptions and calls `supabase.auth.admin.deleteUser()`. Surface in `account.vue` as a "Delete account" section with a typed-confirmation modal ("type DELETE to confirm").
- **Data export** — APPI right of disclosure. `GET /api/me/export` returning a JSON bundle of profile + attempts + audio metadata. Button on account page that triggers download.
- **Change email** — absent. `pages/account.vue` "Change email" form calling `supabase.auth.updateUser({ email })` (Supabase handles the verification email). Show pending change state.
- **Change password while signed in** — currently users are forced through the forgot-password flow even when logged in. Add inline "Change password" form on `account.vue` calling `supabase.auth.updateUser({ password })` after re-prompting current password.
- **Session / device list** — you already track devices via `/api/devices/claim`. Add `GET /api/devices` + "Active devices" panel with a "Sign out other devices" button (calls `supabase.auth.signOut({ scope: 'others' })`).
- **Notification preferences** — only relevant once you send transactional/marketing emails (see §9). Hold until then.
- **Avatar / display picture** — optional polish. If added, use Supabase Storage bucket `avatars`.

Suggested approach: group these in a new collapsible "Privacy & account" section
in `pages/account.vue` rather than separate pages, since each is small.

## 4. Auth security hardening

The current auth flow works but lacks the safety nets a public, internet-exposed
login form is expected to have.

- **Rate limiting on auth endpoints** — Supabase has built-in limits, but you should add an app-level limit too. `/api/redeem-code` already does this in-memory (lines 12–27 of the handler); generalize that to a small utility and apply to any future auth-adjacent endpoints. For sign-in itself, rely on Supabase's limits and consider Vercel Firewall rate-limit rules on `/account` POST traffic.
- **Account lockout / CAPTCHA after failed attempts** — Supabase supports hCaptcha/Turnstile integration on auth. Wire it up in `pages/account.vue` for sign-in/sign-up after N failures (or always, simpler).
- **2FA / MFA (TOTP)** — Supabase supports MFA enrollment natively. Defer until you have engaged returning users, but worth noting as a follow-up.
- **Session timeout / refresh** — Supabase manages refresh automatically; current config is 8h. Document this in the privacy policy and consider a shorter timeout for highly sensitive ops (account deletion).
- **Password breach check** — optional but cheap: HaveIBeenPwned k-anonymity API check at signup to reject known-breached passwords.
- **Email enumeration hardening** — confirm sign-in and password-reset return identical messages regardless of whether the email exists (Supabase mostly does this by default, but verify).
- **Admin approval UI** — current admin flow is single-use email links. That works at small scale, but at the first volume bump you'll want a `pages/admin.vue` (gated by a `profiles.role = 'admin'` claim) listing pending users with approve/reject buttons. Keep email links as a fallback.

## 5. Error handling & resilience

The user-facing failure paths are underdeveloped.

- **Custom error page** — add `error.vue` at the project root (Nuxt convention). Handles 404, 403, 500 with brand styling and a "Back to dashboard" CTA. Today 404s render the framework default.
- **404 for unknown routes** — `error.vue` handles this once present.
- **Per-page error boundaries** — wrap network-dependent sections (dashboard tiles, idiom packs) in a small `<ErrorBoundary>` component that shows "Couldn't load — retry" instead of breaking the whole page.
- **Offline / network UX** — your PWA manifest exists but no service worker. If offline support matters, add `@vite-pwa/nuxt` with a "you're offline" fallback. Otherwise add a toast on `navigator.onLine === false`.
- **Form submission failure feedback** — audit forms (account, custom passage creation, invite code) to confirm they surface API errors with a user-readable message, not silent fail.
- **Loading skeletons** — `words.vue` has them; extend the pattern to dashboard tiles and `/attempt/[id]`.

## 6. Observability (production debugging)

You have Vercel Analytics + Speed Insights. Missing: anything that helps you
debug a user-reported bug.

- **Error tracking** — Sentry (`@sentry/nuxt`) is the standard. Captures unhandled exceptions client + server with source maps. Wire `SENTRY_DSN` as a Vercel env var; release tag from `VERCEL_GIT_COMMIT_SHA`.
- **Structured server logging** — your `server/api/` handlers use `console.log/error`. On Vercel these go to deployment logs but aren't queryable. Either (a) leave as-is and rely on Sentry for errors, or (b) add a tiny `logger.ts` that emits JSON lines so Vercel Log Drains / Logflare / Axiom can index them.
- **Product analytics events** — Vercel Analytics gives pageviews + web vitals only. For funnel analysis (signup → first practice → first score) consider PostHog (free tier generous, has session replay) or Plausible (privacy-first, simpler). Important for an early product to know where the activation funnel breaks.
- **Uptime / synthetic checks** — Vercel doesn't ping for you. UptimeRobot or Better Stack hitting `/` and `/api/me` (unauthenticated → 401, but reachable).
- **Status page** — defer until you have paying users; until then a Twitter/X post is fine.

## 7. Security headers & platform hardening

No security headers are currently set. All can be added in one place.

- **`vercel.json` headers block** (or migrate to `vercel.ts` per current Vercel guidance) with:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (or `frame-ancestors 'none'` via CSP)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: microphone=(self), camera=(), geolocation=()` — note `microphone=(self)` since the recorder needs it
- **Content Security Policy (CSP)** — most impactful but trickiest. Allow: self, Supabase domains, Azure Speech, Anthropic (server-only so not needed in browser CSP), Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Vercel Analytics (`va.vercel-scripts.com`), Vercel Insights. Start with `Content-Security-Policy-Report-Only` for a week before enforcing.
- **Vercel Firewall** — turn on managed rulesets and consider a custom rule rate-limiting `/api/assess` and `/account` POSTs.
- **Vercel BotID** — useful on signup form to block bot signups before they spam Supabase.
- **OIDC tokens for server→Azure / server→Anthropic** — if either provider supports it; otherwise keep current key-in-env approach (which is correct).
- **CSRF** — Supabase auth tokens are double-submit cookies + Authorization header so CSRF is largely a non-issue, but document this assumption.

## 8. Performance & assets

- **Image optimization** — currently raw `<img>` tags including idiom JPEGs in `public/images/`. Install `@nuxt/image` and replace with `<NuxtImg>` — auto-generates WebP/AVIF, sizes, lazy-loading. Big win for `/idiomslang` LCP.
- **Apple touch icon + favicon variants** — PWA icons exist but aren't linked as `apple-touch-icon`. Add 180×180 PNG and reference in `app.head.link`.
- **Font subsetting** — Poppins + Nunito loaded from Google Fonts. Acceptable, but if performance matters consider `@nuxt/fonts` for self-hosted + subset.
- **Bundle audit** — `chart.js` + `microsoft-cognitiveservices-speech-sdk` are heavy. Verify the speech SDK is server-only (it should be — `server/utils/azure.ts`). Confirm `chart.js` is dynamic-imported only on the attempt detail page.
- **Cache headers on static assets** — Vercel handles `_nuxt/*` automatically. For `public/images/idioms/*` add `Cache-Control: public, max-age=31536000, immutable` via headers config.
- **Preconnect to Supabase + Azure** — small win; add `<link rel="preconnect">` in head.

## 9. Email & communications

Currently the only emails users see are the Supabase auth ones (confirm, reset).

- **Branded email templates** — Supabase lets you customize the confirmation/reset emails. Today they're default. Add brand color, JP+EN bilingual copy, support email.
- **Transactional email beyond auth** — eventually: welcome email post-approval, weekly streak summary, "you've been inactive for 14 days" nudge. Requires Resend / Postmark / Loops. Defer until activation flow is solid.
- **Marketing email** — not needed at current scale; if added, requires opt-in checkbox at signup (Japan opt-in rules), unsubscribe link, and a notification-preferences page.
- **Support email address** — pick one (e.g. `support@sekatoku.app`) and surface in the contact page + footer + email templates.

## 10. Internationalization

The UI is mixed JP+EN (page titles bilingual, hero text English, brand name
Japanese). For a Japan-primary audience this is a soft gap.

- **`@nuxtjs/i18n` module** — even if you only ship `ja` today, the structure forces you to extract strings and adds the option to layer `en` later. Heavy lift; defer unless you're planning a JP-only rewrite.
- **Lighter alternative** — just set `<html lang="ja">` and audit copy to confirm every public-facing string a Japanese student would read on first visit (landing, signup, error states) is in Japanese, with English reserved for instructional content (which is the point of the app).
- **Date/number formatting** — `Intl.DateTimeFormat('ja-JP')` for streak dates, attempt timestamps.
- **Japanese-aware input** — confirm the display name validation regex (currently `letters/numbers/spaces/hyphens/underscores/periods`) allows hiragana/katakana/kanji. If not, this is a real bug.

## 11. Help, support & trust signals

Brand-new users need somewhere to land when something confuses them.

- **FAQ page** — `pages/faq.vue` covering: "how does scoring work", "is my voice stored", "how do I get approved", "what is an invite code", "how do I delete my account". Pull from real support questions as they come in.
- **About / company page** — partially exists in `/about` (it's actually a feature explainer). Consider splitting into `/about` (who built this, mission) and `/how-it-works` (current `/about` content).
- **Footer** — there is no global footer today. Add `<AppFooter>` with: brand, links to Privacy / Terms / Contact / FAQ / About, copyright, language selector if i18n added. Render on public + authenticated pages.
- **Onboarding** — `TutorialOverlay` on `/practice` is good. Consider adding a one-time post-approval welcome flow on `/dashboard` ("here's where to start").
- **In-app help / contextual tips** — small `?` icons next to non-obvious things (e.g. what "prosody" means).

## 12. Admin / operations tooling

Currently absent except for the email-link approval flow.

- **Admin dashboard page** — `pages/admin.vue` gated by `profiles.role = 'admin'` (need to add this column). Lists pending signups (approve/reject), all users (search, view attempts), invite codes (create, revoke, view redemptions), flagged content.
- **Invite code generation UI** — codes today appear to be inserted manually into the DB. An admin form to mint codes (with quota + expiration) would save work.
- **Feature flags** — for staged rollouts of incomplete features like the idiom lab. Vercel Edge Config or a tiny Supabase `feature_flags` table.
- **Backup & restore** — Supabase has automated daily backups on paid tiers. Verify your tier and document RTO/RPO.

## 13. Quality gates & release process

Some of these you have; calling them out for completeness.

- **CI on PRs** — present (`.github/workflows/ci.yml` running unit tests). Add typecheck (`pnpm typecheck`) and lint to the same workflow if not already there.
- **Preview deployments** — Vercel does this automatically per PR. Confirm the preview URL is posted as a PR comment.
- **Lighthouse / Vercel Speed Insights budgets** — Speed Insights captures Core Web Vitals; consider failing builds if LCP regresses past a threshold (Vercel "Performance" checks).
- **`vercel.ts` config** — current project uses default config implicitly. Migrate to `vercel.ts` so headers, redirects, rewrites, and any cron jobs live in version control.
- **E2E tests** — Vitest unit coverage is strong; nothing exercises the full browser flow (signup → confirm → approve → practice → score). Playwright in CI against preview deployments would catch regressions in the most important happy path.
- **Dependency updates** — Dependabot / Renovate to keep `@nuxtjs/supabase`, `microsoft-cognitiveservices-speech-sdk`, etc. current.

## 14. Content & growth infrastructure (nice-to-haves)

Lower-priority, listed for completeness.

- **Changelog / "What's new"** — a simple `/changelog` page or in-app modal when a new feature ships.
- **Blog / SEO content** — if you want organic growth from JP students Googling "発音 練習 アプリ", a blog (`content/blog/*.md` via `@nuxt/content`) is the lever. Big commitment.
- **Referral mechanic** — invite codes are halfway there; surfacing "give a friend a code" in-app would amplify it.
- **Public stats / social proof** — "N students practicing this week" on the landing page once numbers are meaningful.
