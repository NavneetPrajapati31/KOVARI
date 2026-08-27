-- Migration: Enforce database-level uniqueness on direct_messages client_id
-- Additive safety profile: Creates a partial unique index. Supports multiple legacy NULL values.

-- 1. Create a partial unique index on client_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_direct_messages_client_id_unique 
ON public.direct_messages (client_id) 
WHERE client_id IS NOT NULL;
