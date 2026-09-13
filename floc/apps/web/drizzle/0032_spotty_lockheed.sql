CREATE TABLE `reminder` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`trip_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_once_idx` ON `reminder` (`kind`,`trip_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `activity` ADD `detail` text;--> statement-breakpoint
ALTER TABLE `notification` ADD `email_claimed_at` integer;--> statement-breakpoint
ALTER TABLE `notification` ADD `emailed_at` integer;--> statement-breakpoint
CREATE INDEX `notification_email_idx` ON `notification` (`loud`,`emailed_at`);--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `muted_at` integer;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `notify_push` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `notify_email` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `notify_reminders` integer DEFAULT true NOT NULL;