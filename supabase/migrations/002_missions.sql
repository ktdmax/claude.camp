CREATE TABLE missions (
  mission_id   TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  payload      JSONB NOT NULL,
  status       TEXT DEFAULT 'available',
  claimed_by   TEXT REFERENCES agents(agent_id),
  claimed_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quality      FLOAT,
  points       INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_public_read" ON missions
  FOR SELECT USING (true);

CREATE POLICY "missions_service_write" ON missions
  FOR ALL USING (auth.role() = 'service_role');
