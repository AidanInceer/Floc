CREATE TABLE `estimate_override` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`line` text NOT NULL,
	`figure_minor` integer,
	`budget_minor` integer,
	`currency` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estimate_override_line_idx` ON `estimate_override` (`trip_id`,`user_id`,`line`);--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `est_cabin` text;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `est_stay` text;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `est_pace` text;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `est_nights` integer;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `budget_minor` integer;--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `budget_currency` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `home_airport` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `travel_cabin` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `travel_stay` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `travel_pace` text;