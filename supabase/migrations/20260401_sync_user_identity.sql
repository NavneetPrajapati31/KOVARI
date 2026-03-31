-- Create sync_user_identity RPC for atomic login/signup
-- Consolidates users/profiles checks and inserts into a single transaction for Case 18
CREATE OR REPLACE FUNCTION public.sync_user_identity(
  p_email TEXT,
  p_name TEXT,
  p_google_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_existing_user RECORD;
  v_existing_profile RECORD;
BEGIN
  -- 1. Sync User (Case 19: Atomic Race-Condition-Proof Sync)
  -- This handles lookup, insert, and update in ONE command.
  INSERT INTO public.users (email, name, google_id)
  VALUES (p_email, p_name, p_google_id)
  ON CONFLICT (email) 
  DO UPDATE SET
    google_id = COALESCE(users.google_id, EXCLUDED.google_id),
    name = COALESCE(users.name, EXCLUDED.name)
  RETURNING id INTO v_user_id;

  -- 2. If for some reason the above didn't find the user (e.g. migration id mismatch), 
  -- but we have a profile ID, we handle that as a fallback. 
  -- (Normally not needed with ON CONFLICT email, but kept for Profile-first legacy users)
  IF v_user_id IS NULL THEN
     SELECT user_id INTO v_user_id FROM public.profiles WHERE email ILIKE p_email LIMIT 1;
  END IF;

  -- 4. Atomic Profile Upsert (Ensure consistency for Onboarding Task 8)
  INSERT INTO public.profiles (user_id, email, name, username)
  VALUES (
    v_user_id, 
    p_email, 
    p_name, 
    LOWER(SPLIT_PART(p_email, '@', 1)) -- Default username from email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name);

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
