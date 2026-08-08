CREATE TABLE `trip_invite` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_invite_pair_idx` ON `trip_invite` (`trip_id`,`to_user_id`);--> statement-breakpoint
CREATE INDEX `trip_invite_to_idx` ON `trip_invite` (`to_user_id`,`status`);