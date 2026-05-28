-- Create blocked_users table for tracking user blocks
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(255),
    UNIQUE(blocker_id, blocked_id)
);

-- Index for quick lookups during discovery queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Allow users to see who they have blocked
CREATE POLICY "Users can view their own blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

-- Allow admins to see all blocks
CREATE POLICY "Admins can view all blocks"
ON public.blocked_users FOR SELECT
USING (auth.role() = 'service_role');

-- Allow users to create blocks
CREATE POLICY "Users can create blocks"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

-- Allow users to unblock
CREATE POLICY "Users can delete their own blocks"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);
