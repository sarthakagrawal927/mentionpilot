-- Add badge_enabled flag to brand_configs (opt-in for public badge)
ALTER TABLE brand_configs ADD COLUMN badge_enabled INTEGER NOT NULL DEFAULT 0;
