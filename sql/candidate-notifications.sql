-- candidate_notifications — notifications sent to job applicants
-- Triggered when admin changes stage (selected, hired, rejected, etc.)
-- Frontend polls /api/careers/candidate/notifications?cid=UUID every 30s

CREATE TABLE IF NOT EXISTS candidate_notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type         text        NOT NULL DEFAULT 'stage_update',
  title        text        NOT NULL,
  body         text,
  stage        text,
  is_read      boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notif_cid ON candidate_notifications(candidate_id, created_at DESC);

-- RLS: candidates can read/update their own notifications via anon key if using RLS
-- For now we use service role in the API so no RLS needed.
-- But enable RLS so no public read without service role:
ALTER TABLE candidate_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service-role full access (implicit)
-- Public: no access (API uses service role key)
