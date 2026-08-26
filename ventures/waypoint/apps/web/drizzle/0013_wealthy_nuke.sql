CREATE TABLE `packing_claim` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`packing_line_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`packed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`packing_line_id`) REFERENCES `packing_line`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `packing_claim_unique_idx` ON `packing_claim` (`packing_line_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `packing_line` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`created_by` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `packing_line_trip_idx` ON `packing_line` (`trip_id`);