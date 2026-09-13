CREATE TABLE `push_token` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`registered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_token_token_idx` ON `push_token` (`token`);--> statement-breakpoint
CREATE INDEX `push_token_user_idx` ON `push_token` (`user_id`);--> statement-breakpoint
ALTER TABLE `notification` ADD `push_claimed_at` integer;--> statement-breakpoint
ALTER TABLE `notification` ADD `pushed_at` integer;--> statement-breakpoint
CREATE INDEX `notification_push_idx` ON `notification` (`loud`,`pushed_at`);