import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '587', 10)
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record as { id: string; approval_token: string }

    if (!record?.id || !record?.approval_token) {
      return new Response('Missing record fields', { status: 400 })
    }

    // Fetch user email via service role (auth.users not accessible from webhook payload)
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
<p>A new user has signed up for SekaEi and is awaiting approval.</p>
<p><strong>Email:</strong> ${userEmail}</p>
<p>
  <a href="${approveUrl}" style="background:#16a34a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;margin-right:8px">Approve</a>
  <a href="${rejectUrl}" style="background:#dc2626;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Reject</a>
</p>
<hr>
<p style="font-size:12px;color:#666">These links are single-use. You can also update <code>approval_status</code> directly in the Supabase dashboard.</p>
`

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_PORT === 465,
        auth: { username: SMTP_USER, password: SMTP_PASS },
      },
    })

    await client.send({
      from: SMTP_USER,
      to: ADMIN_EMAIL,
      subject: `[SekaEi] New signup: ${userEmail}`,
      html,
    })

    await client.close()

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('send-approval-email error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
