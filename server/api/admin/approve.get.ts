import type { H3Event } from 'h3'
import { useSupabaseService } from '../../utils/supabaseService'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function htmlPage(event: H3Event, status: number, title: string, body: string) {
  setResponseStatus(event, status)
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:480px;margin:80px auto;padding:0 20px;text-align:center}
h1{font-size:1.5rem;margin-bottom:.5rem}.msg{color:#555}</style></head>
<body><h1>${title}</h1><p class="msg">${body}</p></body></html>`
}

export default defineEventHandler(async (event) => {
  const { token, action } = getQuery(event) as { token?: string; action?: string }

  if (!token || !UUID_RE.test(token)) {
    return htmlPage(event, 400, 'Invalid link', 'This approval link is malformed or missing.')
  }

  if (action !== 'approve' && action !== 'reject') {
    return htmlPage(event, 400, 'Invalid action', 'Action must be "approve" or "reject".')
  }

  const db = useSupabaseService()

  // Look up profile by token
  const { data: profile, error: lookupError } = await db
    .from('profiles')
    .select('id, approval_decided_at')
    .eq('approval_token', token)
    .single()

  if (lookupError || !profile) {
    return htmlPage(event, 404, 'Link not found', 'This approval link is invalid or has already been used.')
  }

  // Single-use: reject if already decided
  if (profile.approval_decided_at) {
    return htmlPage(event, 410, 'Link expired', 'This approval link has already been used.')
  }

  // Fetch user email for display
  const { data: userData } = await db.auth.admin.getUserById(profile.id)
  const userEmail = userData?.user?.email ?? profile.id

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { error: updateError } = await db
    .from('profiles')
    .update({
      approval_status: newStatus,
      approval_decided_at: new Date().toISOString(),
      approval_decided_by: 'email-link',
      // Rotate token so link can't be replayed
      approval_token: crypto.randomUUID(),
    })
    .eq('id', profile.id)

  if (updateError) {
    return htmlPage(event, 500, 'Error', 'Failed to update the account. Try again or update directly in Supabase.')
  }

  const title = action === 'approve' ? 'User approved' : 'User rejected'
  const verb = action === 'approve' ? 'approved' : 'rejected'
  return htmlPage(event, 200, title, `${userEmail} has been ${verb}.`)
})
