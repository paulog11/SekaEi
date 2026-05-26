/**
 * Generate single-use invite codes and insert them into invite_codes via service role.
 *
 * Usage:
 *   SUPABASE_URL=... NUXT_SUPABASE_SECRET_KEY=... pnpm gen:invite-codes \
 *     --count 50 --prefix SEKA --expires 2026-12-31 --note "Spring 2026 cohort"
 *
 * Reads environment from process.env. Point at local Supabase:
 *   SUPABASE_URL=http://127.0.0.1:54321 NUXT_SUPABASE_SECRET_KEY=<local service role>
 * Or at production (after local tests pass):
 *   SUPABASE_URL=https://<project>.supabase.co NUXT_SUPABASE_SECRET_KEY=<prod service role>
 *
 * Output: out/invite-codes-YYYY-MM-DD-HHMM.csv  (gitignored — treat as secret)
 */

import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Confusion-free alphabet: no 0/O, 1/I/L
const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const i = args.indexOf(flag)
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback
  }
  return {
    count: parseInt(get('--count', '10'), 10),
    prefix: get('--prefix', 'SEKA').toUpperCase(),
    expires: get('--expires', ''),
    note: get('--note', ''),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const { count, prefix, expires, note } = parseArgs()

const url = process.env.SUPABASE_URL
const key = process.env.NUXT_SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('Error: SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY must be set.')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const codes: string[] = []
while (codes.length < count) {
  codes.push(`${prefix}-${alpha()}`)
}

const rows = codes.map(code => ({
  code,
  max_uses: 1,
  expires_at: expires || null,
  note: note || null,
}))

const { error } = await db
  .from('invite_codes')
  .upsert(rows, { onConflict: 'code', ignoreDuplicates: true })

if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}

// Write CSV
mkdirSync('out', { recursive: true })
const ts = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
const csvPath = join('out', `invite-codes-${ts}.csv`)
const header = 'code,max_uses,expires_at,note'
const lines = rows.map(r => `${r.code},${r.max_uses},${r.expires_at ?? ''},${r.note ?? ''}`)
writeFileSync(csvPath, [header, ...lines].join('\n') + '\n')

console.log(`✓ Inserted ${count} codes into invite_codes`)
console.log(`✓ CSV written to ${csvPath}`)
