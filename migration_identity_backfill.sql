-- Migration: Backfill users.email from profiles.email
-- Purpose: Unify identity by making users.email the source of truth for both web and mobile profiles.

-- 1. Identify users that have an email in profiles but not in users table.
-- 2. Update users.email where it's NULL or empty but profiles.email is set.

UPDATE users u
SET email = p.email
FROM profiles p
WHERE p.user_id = u.id
  AND (u.email IS NULL OR u.email = '')
  AND (p.email IS NOT NULL AND p.email != '');

-- OPTIONAL: Verify how many rows were updated (run this before/after the update)
-- SELECT count(*) 
-- FROM users u
-- INNER JOIN profiles p ON p.user_id = u.id
-- WHERE u.email IS NULL AND p.email IS NOT NULL;
