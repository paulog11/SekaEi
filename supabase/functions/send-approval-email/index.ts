// @ts-nocheck — Deno runtime; not checked by Node/vue-tsc
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record as { id: string; approval_token: string }

    if (!record?.id || !record?.approval_token) {
      return new Response('Missing record fields', { status: 400 })
    }

    // Fetch user email via service role (not in webhook payload)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(record.id)
    if (userError || !userData?.user?.email) {
      console.error('Failed to fetch user:', userError)
      return new Response('User not found', { status: 404 })
    }
    const userEmail = userData.user.email

    const approveUrl = `${APP_URL}/api/admin/approve?token=${record.approval_token}&action=approve`
    const rejectUrl = `${APP_URL}/api/admin/approve?token=${record.approval_token}&action=reject`

    const html = `
<p>A new user has signed up for セカトークXP and is awaiting approval.</p>
<p><strong>Email:</strong> ${userEmail}</p>
<p>
  <a href="${approveUrl}" style="background:#16a34a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;margin-right:8px">Approve</a>
  <a href="${rejectUrl}" style="background:#dc2626;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Reject</a>
</p>
<hr>
<p style="font-size:12px;color:#666">These links are single-use. You can also update <code>approval_status</code> directly in the Supabase dashboard.</p>
`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'セカトークXP <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `[セカトークXP] New signup: ${userEmail}`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Resend error:', res.status, body)
      return new Response('Failed to send email', { status: 500 })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('send-approval-email error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
