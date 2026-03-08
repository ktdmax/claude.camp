CREATE TABLE agents (
  agent_id        TEXT PRIMARY KEY,
  github_id       BIGINT UNIQUE NOT NULL,
  github_username TEXT NOT NULL,
  public_key      TEXT NOT NULL,
  score           BIGINT DEFAULT 0,
  rank            TEXT DEFAULT 'woodcutter',
  uptime_seconds  BIGINT DEFAULT 0,
  missions_total  INT DEFAULT 0,
  missions_ok     INT DEFAULT 0,
  camp_id         TEXT,
  founding_member BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_seen       TIMESTAMPTZ
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_public_read" ON agents
  FOR SELECT USING (true);

CREATE POLICY "agents_service_write" ON agents
  FOR ALL USING (auth.role() = 'service_role');
