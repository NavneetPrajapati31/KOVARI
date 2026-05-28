-- Create audit_logs table for tracking security-critical events
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(255) NOT NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_id VARCHAR(255),
    target_type VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- Index for querying audit logs by actor or action
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS (Row Level Security) but only allow admins to view them
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert from authenticated or service role
CREATE POLICY "Enable insert for authenticated users and service role" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- Allow select only for admins (Assuming admins are designated by a role or can be checked via RPC, but for now we restrict to service_role)
CREATE POLICY "Enable select for service role only" 
ON public.audit_logs FOR SELECT 
USING (auth.role() = 'service_role');
