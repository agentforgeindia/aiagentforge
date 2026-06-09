-- candidate_stage_log — tracks every stage change for a candidate
-- Used to show full journey timeline in admin and candidate dashboard

CREATE TABLE IF NOT EXISTS candidate_stage_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage        text        NOT NULL,
  changed_at   timestamptz NOT NULL DEFAULT now(),
  changed_by   text        -- admin email or 'system' or 'candidate'
);

CREATE INDEX IF NOT EXISTS idx_csl_candidate ON candidate_stage_log(candidate_id, changed_at DESC);

-- Auto-log the initial 'applied' stage when a candidate is inserted
CREATE OR REPLACE FUNCTION fn_log_candidate_stage()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Only log if stage actually changed (or new row)
  IF TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO candidate_stage_log(candidate_id, stage, changed_by)
    VALUES (NEW.id, NEW.stage, 'system');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_candidate_stage ON candidates;
CREATE TRIGGER trg_log_candidate_stage
  AFTER INSERT OR UPDATE OF stage ON candidates
  FOR EACH ROW EXECUTE FUNCTION fn_log_candidate_stage();
