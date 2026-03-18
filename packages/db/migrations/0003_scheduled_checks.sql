-- Add schedule configuration to projects
ALTER TABLE projects ADD COLUMN check_schedule TEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN last_scheduled_check TEXT DEFAULT NULL;
