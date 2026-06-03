CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  message text NOT NULL,
  page_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON feedback FOR ALL
  TO service_role
  USING (true);
