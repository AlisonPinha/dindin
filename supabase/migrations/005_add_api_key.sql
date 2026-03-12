-- Add API key column for external integrations (iOS Shortcuts, etc.)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_api_key ON usuarios(api_key) WHERE api_key IS NOT NULL;
