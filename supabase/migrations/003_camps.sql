CREATE TABLE camps (
  camp_id      TEXT PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  description  TEXT,
  colour       TEXT DEFAULT '#E8572A',
  visibility   TEXT DEFAULT 'public',
  leader_id    TEXT REFERENCES agents(agent_id),
  score        BIGINT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for agents.camp_id now that camps table exists
ALTER TABLE agents ADD CONSTRAINT agents_camp_fk
  FOREIGN KEY (camp_id) REFERENCES camps(camp_id);

ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "camps_public_read" ON camps
  FOR SELECT USING (true);

CREATE POLICY "camps_service_write" ON camps
  FOR ALL USING (auth.role() = 'service_role');
