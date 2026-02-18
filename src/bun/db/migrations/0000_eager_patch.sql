CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text,
	`message_id` text,
	`kind` text NOT NULL,
	`mime_type` text NOT NULL,
	`relative_path` text NOT NULL,
	`size_bytes` integer,
	`width` integer,
	`height` integer,
	`duration_ms` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `assets_chat_id_idx` ON `assets` (`chat_id`);--> statement-breakpoint
CREATE INDEX `assets_message_id_idx` ON `assets` (`message_id`);--> statement-breakpoint
CREATE TABLE `chat_settings` (
	`chat_id` text PRIMARY KEY NOT NULL,
	`provider_profile_id` text,
	`model_id` text,
	`system_prompt` text,
	`output_mode` text DEFAULT 'text' NOT NULL,
	`output_schema` text,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`folder_id` text,
	`title` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `chats_folder_id_idx` ON `chats` (`folder_id`);--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `folders_parent_id_idx` ON `folders` (`parent_id`);--> statement-breakpoint
CREATE TABLE `message_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`assistant_message_id` text,
	`provider_profile_id` text,
	`model_id` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`tokens_prompt` integer,
	`tokens_completion` integer,
	`tokens_total` integer,
	`latency_ms` integer,
	`error` text,
	`raw_response` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assistant_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `message_runs_chat_id_idx` ON `message_runs` (`chat_id`);--> statement-breakpoint
CREATE INDEX `message_runs_assistant_message_id_idx` ON `message_runs` (`assistant_message_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`parent_id` text,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`provider_profile_id` text,
	`model_id` text,
	`tokens_prompt` integer,
	`tokens_completion` integer,
	`tokens_total` integer,
	`latency_ms` integer,
	`error` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `messages_chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `messages_parent_id_idx` ON `messages` (`parent_id`);--> statement-breakpoint
CREATE INDEX `messages_created_at_idx` ON `messages` (`created_at`);