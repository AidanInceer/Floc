CREATE TABLE `trip_member_budget` (
	`trip_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`est_cabin` text,
	`est_stay` text,
	`est_pace` text,
	`est_nights` integer,
	`est_travel` text,
	`budget_minor` integer,
	`budget_currency` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`trip_id`, `user_id`),
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `trip_member_budget` (`trip_id`, `user_id`, `est_cabin`, `est_stay`, `est_pace`, `est_nights`, `est_travel`, `budget_minor`, `budget_currency`) SELECT `trip_id`, `user_id`, `est_cabin`, `est_stay`, `est_pace`, `est_nights`, `est_travel`, `budget_minor`, `budget_currency` FROM `trip_membership` WHERE `est_cabin` IS NOT NULL OR `est_stay` IS NOT NULL OR `est_pace` IS NOT NULL OR `est_nights` IS NOT NULL OR `est_travel` IS NOT NULL OR `budget_minor` IS NOT NULL OR `budget_currency` IS NOT NULL;
