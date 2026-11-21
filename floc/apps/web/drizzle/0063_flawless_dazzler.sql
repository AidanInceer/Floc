CREATE TABLE `trip_length_choice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`length` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_length_choice_unique_idx` ON `trip_length_choice` (`trip_id`,`user_id`,`length`);--> statement-breakpoint
ALTER TABLE `availability` ADD `preferred` integer DEFAULT false NOT NULL;