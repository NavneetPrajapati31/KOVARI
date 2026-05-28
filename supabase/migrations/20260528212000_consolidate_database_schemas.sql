-- Consolidate duplicate unique constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

-- Drop redundant duplicate indexes to optimize storage and write performance
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_google_id;
DROP INDEX IF EXISTS public.idx_blocked_users_blocker_id; -- redundant because unique(blocker_id, blocked_id) handles this prefix

-- Re-enforce strict foreign keys with cascading deletes on blocked_users table
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocker_id_fkey 
    FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;
ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocked_id_fkey 
    FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enforce CHECK constraint to prevent self-blocking
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS check_not_self_block;
ALTER TABLE public.blocked_users ADD CONSTRAINT check_not_self_block 
    CHECK (blocker_id <> blocked_id);
