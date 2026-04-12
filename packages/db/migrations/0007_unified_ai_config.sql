-- Replace per-provider API key columns with unified OpenAI-compatible endpoint config
ALTER TABLE brand_configs ADD COLUMN ai_endpoint_url TEXT;
ALTER TABLE brand_configs ADD COLUMN ai_api_key TEXT;
ALTER TABLE brand_configs ADD COLUMN ai_model TEXT;

-- Migrate existing keys: prefer OpenAI key if present, then Anthropic, etc.
-- Users will need to re-enter their config with the proper endpoint URL.
-- We keep the old columns for now so no data is lost.
