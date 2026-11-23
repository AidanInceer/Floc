CREATE TABLE `trip_page_state` (
	`page_id` integer PRIMARY KEY NOT NULL,
	`yjs_state` blob NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `trip_page`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `trip_page_state` (`page_id`, `yjs_state`) SELECT `id`, `yjs_state` FROM `trip_page` WHERE `yjs_state` IS NOT NULL;
