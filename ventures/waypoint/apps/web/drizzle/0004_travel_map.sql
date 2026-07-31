CREATE TABLE `user_country_mark` (
	`user_id` text NOT NULL,
	`country_code` text NOT NULL,
	`state` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `country_code`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_country_mark_user_idx` ON `user_country_mark` (`user_id`);--> statement-breakpoint
ALTER TABLE `place` ADD `country_code` text;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `map_prompt_at` integer;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `visibility_travel_map` text DEFAULT 'trip_members' NOT NULL;