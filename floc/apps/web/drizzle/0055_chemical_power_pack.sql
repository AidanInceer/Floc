CREATE TABLE `booking_inbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`booking_details` text,
	`placed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `booking_inbox_user_idx` ON `booking_inbox` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `inbound_mail` (
	`email_id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inbound_mail_user_idx` ON `inbound_mail` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `document` ADD `booking_details` text;