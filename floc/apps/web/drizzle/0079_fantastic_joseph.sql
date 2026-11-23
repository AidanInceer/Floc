CREATE TABLE `stored_file` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`bytes_deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stored_file_storage_key_unique` ON `stored_file` (`storage_key`);--> statement-breakpoint
ALTER TABLE `booking_inbox` ADD `stored_file_id` integer REFERENCES stored_file(id);--> statement-breakpoint
CREATE INDEX `booking_inbox_stored_file_idx` ON `booking_inbox` (`stored_file_id`);--> statement-breakpoint
ALTER TABLE `document` ADD `stored_file_id` integer REFERENCES stored_file(id);--> statement-breakpoint
CREATE INDEX `document_stored_file_idx` ON `document` (`stored_file_id`);--> statement-breakpoint
ALTER TABLE `trip_media` ADD `stored_file_id` integer REFERENCES stored_file(id);--> statement-breakpoint
CREATE INDEX `trip_media_stored_file_idx` ON `trip_media` (`stored_file_id`);--> statement-breakpoint
INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `booking_inbox`;--> statement-breakpoint
INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `document`;--> statement-breakpoint
INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `trip_media`;--> statement-breakpoint
UPDATE `booking_inbox` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `booking_inbox`.`storage_key`);--> statement-breakpoint
UPDATE `document` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `document`.`storage_key`);--> statement-breakpoint
UPDATE `trip_media` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `trip_media`.`storage_key`);