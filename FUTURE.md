# Future / Out of Scope

Items deferred from the approval-gated access implementation.

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
