-- Add tier to profiles (default 'public'; existing users are not silently promoted)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'public'
    CHECK (tier IN ('public', 'attendee'));

-- Invite codes table
-- max_uses = NULL means unlimited (cohort code); max_uses = 1 means single-use.
CREATE TABLE IF NOT EXISTS invite_codes (
  code        text        PRIMARY KEY,
  max_uses    int,
  use_count   int         NOT NULL DEFAULT 0,
  expires_at  timestamptz,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service role may read/write invite_codes directly
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON invite_codes USING (false);

-- Atomic RPC: validate code, increment use_count, flip tier.
-- Returns TRUE on success, FALSE if already attendee (idempotent).
-- Raises exceptions for invalid / expired / exhausted codes.
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row invite_codes%ROWTYPE;
BEGIN
  -- Lock the code row so concurrent calls don't over-redeem
  SELECT * INTO v_row FROM invite_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'code_not_found';
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RAISE EXCEPTION 'code_expired';
  END IF;
  IF v_row.max_uses IS NOT NULL AND v_row.use_count >= v_row.max_uses THEN
    RAISE EXCEPTION 'code_exhausted';
  END IF;

  -- Idempotent: if already attendee, return false without double-counting
  IF (SELECT tier FROM profiles WHERE id = p_user_id) = 'attendee' THEN
    RETURN false;
  END IF;

  UPDATE invite_codes SET use_count = use_count + 1 WHERE code = p_code;
  UPDATE profiles SET tier = 'attendee' WHERE id = p_user_id;
  RETURN true;
END;
$$;
