-- Add beta_invited and beta_active as valid statuses
-- Your existing status field already has 'new' as default
-- Just update the launch_bypass_users table from earlier

ALTER TABLE launch_bypass_users
ADD COLUMN IF NOT EXISTS email text NULL,
ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS notes text NULL,
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'admin' 
  CHECK (tier IN ('admin', 'beta'));

-- Backfill existing rows
UPDATE launch_bypass_users SET tier = 'admin' WHERE tier IS NULL;

CREATE INDEX IF NOT EXISTS idx_launch_bypass_clerk_id 
ON launch_bypass_users(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_status 
ON waitlist(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_email 
ON waitlist(email);
