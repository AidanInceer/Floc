CREATE TABLE `trip_page` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`parent_id` integer,
	`title` text DEFAULT '' NOT NULL,
	`icon` text,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`body` text NOT NULL,
	`yjs_state` blob,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `trip_page`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `trip_page_trip_idx` ON `trip_page` (`trip_id`,`parent_id`);--> statement-breakpoint
ALTER TABLE `note` ADD `resolved_at` integer;