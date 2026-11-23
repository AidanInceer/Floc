INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `booking_inbox` WHERE `stored_file_id` IS NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `document` WHERE `stored_file_id` IS NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `stored_file` (`storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at`) SELECT `storage_key`, `mime_type`, `size_bytes`, `created_at`, `last_modified_at` FROM `trip_media` WHERE `stored_file_id` IS NULL;--> statement-breakpoint
UPDATE `booking_inbox` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `booking_inbox`.`storage_key`) WHERE `stored_file_id` IS NULL;--> statement-breakpoint
UPDATE `document` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `document`.`storage_key`) WHERE `stored_file_id` IS NULL;--> statement-breakpoint
UPDATE `trip_media` SET `stored_file_id` = (SELECT `id` FROM `stored_file` WHERE `stored_file`.`storage_key` = `trip_media`.`storage_key`) WHERE `stored_file_id` IS NULL;--> statement-breakpoint
ALTER TABLE `booking_inbox` DROP COLUMN `storage_key`;--> statement-breakpoint
ALTER TABLE `booking_inbox` DROP COLUMN `mime_type`;--> statement-breakpoint
ALTER TABLE `booking_inbox` DROP COLUMN `size_bytes`;--> statement-breakpoint
ALTER TABLE `document` DROP COLUMN `storage_key`;--> statement-breakpoint
ALTER TABLE `document` DROP COLUMN `mime_type`;--> statement-breakpoint
ALTER TABLE `document` DROP COLUMN `size_bytes`;--> statement-breakpoint
ALTER TABLE `trip_media` DROP COLUMN `storage_key`;--> statement-breakpoint
ALTER TABLE `trip_media` DROP COLUMN `mime_type`;--> statement-breakpoint
ALTER TABLE `trip_media` DROP COLUMN `size_bytes`;--> statement-breakpoint
DROP INDEX `notification_push_idx`;--> statement-breakpoint
DROP INDEX `notification_email_idx`;--> statement-breakpoint
ALTER TABLE `notification` DROP COLUMN `push_claimed_at`;--> statement-breakpoint
ALTER TABLE `notification` DROP COLUMN `pushed_at`;--> statement-breakpoint
ALTER TABLE `notification` DROP COLUMN `email_claimed_at`;--> statement-breakpoint
ALTER TABLE `notification` DROP COLUMN `emailed_at`;--> statement-breakpoint
ALTER TABLE `subscription` DROP COLUMN `stripe_customer_id`;--> statement-breakpoint
ALTER TABLE `trip_page` DROP COLUMN `yjs_state`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `est_cabin`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `est_stay`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `est_pace`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `est_nights`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `est_travel`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `budget_minor`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `budget_currency`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `is_private`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `visibility_vibe_tags`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `visibility_travel_map`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `visibility_friends`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `visibility_saved`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `past_trips_show`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_push`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_email`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_reminders`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_next_trip`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `marketing_email_consent_at`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `home_airport`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `travel_cabin`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `travel_stay`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `travel_pace`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `style_in_group_ideas`;--> statement-breakpoint
DROP INDEX `note_scope_idx`;--> statement-breakpoint
DROP INDEX `note_parent_idx`;--> statement-breakpoint
DROP INDEX `note_reaction_note_idx`;--> statement-breakpoint
DROP INDEX `note_reaction_one_idx`;--> statement-breakpoint
ALTER TABLE `note` DROP COLUMN `scope`;--> statement-breakpoint
ALTER TABLE `note` DROP COLUMN `scope_id`;--> statement-breakpoint
ALTER TABLE `note` RENAME TO `comment`;--> statement-breakpoint
ALTER TABLE `note_reaction` RENAME COLUMN `note_id` TO `comment_id`;--> statement-breakpoint
ALTER TABLE `note_reaction` RENAME TO `comment_reaction`;--> statement-breakpoint
CREATE INDEX `comment_trip_idx` ON `comment` (`trip_id`);--> statement-breakpoint
CREATE INDEX `comment_parent_idx` ON `comment` (`parent_id`);--> statement-breakpoint
CREATE INDEX `comment_reaction_comment_idx` ON `comment_reaction` (`comment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `comment_reaction_one_idx` ON `comment_reaction` (`comment_id`,`user_id`,`kind`);
