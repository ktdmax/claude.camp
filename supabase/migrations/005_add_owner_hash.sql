-- Add owner_hash column to agents table
-- owner_hash = SHA-256(github_id + "owner"), groups multiple Cicis under one owner
ALTER TABLE agents ADD COLUMN owner_hash TEXT;

CREATE INDEX idx_agents_owner_hash ON agents (owner_hash);
