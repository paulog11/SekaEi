# `server/api/`

HTTP route handlers (Nitro file-based routing). Filename = method + path. Every handler that touches user data calls a guard from `../utils/approval.ts` as its first line. See [docs/architecture.md](../../docs/architecture.md) for the bigger picture.

## Endpoints

### Pronunciation & TTS

| Method · Path | Auth | Limits | Purpose |
|---|---|---|---|
| `POST /api/assess` | signed-in | per-tier daily quota; 3 concurrent/user; audio 1 KB–4 MB | Azure pronunciation assessment. Multipart: `audio` (WAV) + `referenceText`. |
| `POST /api/synthesize` | approved | 5 concurrent/user; text ≤2000 chars | Azure TTS → 24 kHz MP3. Cached `private, max-age=86400`. |

### Attempts

| Method · Path | Auth | Notes |
|---|---|---|
| `POST /api/attempts` | approved | Persists an attempt. Fires off streak, phoneme-stats, and flagged-words updates in the background. |
| `GET /api/attempts` | approved | List for the user. Optional `?passageId=`, `?limit=` (≤500). |
| `GET /api/attempts/:id` | signed-in | Fetch one by slug. Scoped to caller's `user_id`. Includes raw `azure_result`. |

### Profile (`/api/me`)

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /api/me` | signed-in | Profile + streak summary. Single source of truth for "who am I and what's my state". |
| `PATCH /api/me` | approved | Update `displayName` and/or `university` only. Profanity check on display name. |
| `POST /api/me/tutorial` | approved | Mark in-app tour complete. Idempotent. |

### Custom passages

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /api/passages` | signed-in | List user's custom passages. |
| `POST /api/passages` | signed-in + `canAddCustomPassages` tier | Create. Title required, text ≤300 chars, category in `PASSAGE_CATEGORIES`. 409 on duplicate title. |
| `DELETE /api/passages/:id` | approved | Hard delete, scoped by `user_id`. |

### Flagged words

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /api/flagged-words` | signed-in | `?status=active|retired|all` (default `active`), `?limit=` ≤200. |
| `POST /api/flagged-words` | approved | Manually flag. `source` ∈ `'auto'|'manual'`, `score` ∈ 0–100. Word normalised server-side. |
| `DELETE /api/flagged-words` | approved | Soft-delete (sets `retired_at`). |

### Stats

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /api/stats/streak` | signed-in | Current/longest streak + goal + `todayMet`. Safe defaults when no row. |
| `GET /api/stats/phonemes` | signed-in | Weakest/strongest phonemes. Min-3-attempts filter, top-10 each. |
| `PUT /api/stats/goal` | approved | Set daily goal minutes (1–120). |

### Coach & invite codes

| Method · Path | Auth | Notes |
|---|---|---|
| `POST /api/coach` | signed-in + tier with `coachDaily > 0` | LLM coach reply. Daily quota enforced via `increment_coach_usage` RPC. |
| `POST /api/redeem-code` | signed-in | Exchange invite code for attendee tier. In-memory rate limit 10/user/hour. |
| `POST /api/devices/claim` | signed-in | Links a pre-signup device id to the user; reattributes any anonymous attempts. |

### Admin (out-of-app surface)

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /api/admin/approve` | UUID token in query | Returns an HTML page. Used by the approval email. Token rotated after use. |

## Conventions

- **Authorization first.** Every handler starts with `requireAccess`, `requireApprovedUser`, or `useSupabaseUser`. If you're tempted to skip it, you're writing a security bug.
- **`requireApprovedUser` is the default**; `useSupabaseUser` is only correct when the endpoint must still work for pending/rejected users (e.g. `GET /api/me`, `GET /api/attempts/:id`).
- **No service-role from request paths.** Service-role lives in `server/utils/supabaseService.ts` and is reserved for trusted flows (admin endpoint, signup hooks).
- **Per-user rate limits / quotas** belong in this folder. Cross-user concerns belong in `server/utils/`.
- **Snake_case in DB, camelCase in responses.** Map at the edge.
