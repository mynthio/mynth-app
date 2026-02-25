ALTER TABLE `models` ADD `lifecycle_status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `providers` ADD `metadata` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `providers` ADD `models_sync_status` text DEFAULT 'idle' NOT NULL;