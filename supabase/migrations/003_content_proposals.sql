-- ============================================
-- Migration: Content Proposals Support
-- Adds fields for content generation workflow
-- ============================================

-- 1. Add new status values to automation_logs
ALTER TABLE automation_logs DROP CONSTRAINT IF EXISTS automation_logs_status_check;
ALTER TABLE automation_logs ADD CONSTRAINT automation_logs_status_check
  CHECK (status IN ('success', 'error', 'warning', 'pending_approval', 'approved', 'rejected', 'processing'));

-- 2. Add execution_data column for storing proposal data
ALTER TABLE automation_logs ADD COLUMN IF NOT EXISTS execution_data jsonb;

-- 3. Create scheduled_content table for content pipeline
CREATE TABLE IF NOT EXISTS scheduled_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('reel', 'post', 'carousel', 'story')),
  topic text NOT NULL,
  caption text,
  script text,
  hashtags text[],
  engagement_prediction text CHECK (engagement_prediction IN ('low', 'medium', 'high')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'generating', 'ready', 'scheduled', 'published', 'failed')),
  media_url text,
  instagram_media_id text,
  published_at timestamptz,
  scheduled_for timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_client ON scheduled_content(client_id);

-- 4. Enable RLS
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (allow service role to do everything)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_content' AND policyname = 'Service role full access to scheduled_content'
  ) THEN
    CREATE POLICY "Service role full access to scheduled_content"
      ON scheduled_content FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Update automation_logs policy for service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'Service role full access to automation_logs'
  ) THEN
    CREATE POLICY "Service role full access to automation_logs"
      ON automation_logs FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Done!
