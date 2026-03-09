-- SECURITY: Atomic score update function to prevent race conditions (H6)
-- Increments score, missions_total, missions_ok in a single statement
-- and returns the new score for rank calculation.
CREATE OR REPLACE FUNCTION increment_agent_score(
  p_agent_id TEXT,
  p_points BIGINT
)
RETURNS BIGINT
LANGUAGE sql
AS $$
  UPDATE agents
  SET
    score = score + p_points,
    missions_total = missions_total + 1,
    missions_ok = missions_ok + 1
  WHERE agent_id = p_agent_id
  RETURNING score;
$$;
