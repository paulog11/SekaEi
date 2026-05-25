-- Temporarily auto-approve new sign-ups and grant attendee tier
-- so testers can access the app without manual approval.
ALTER TABLE profiles
  ALTER COLUMN approval_status SET DEFAULT 'approved',
  ALTER COLUMN tier SET DEFAULT 'attendee';
