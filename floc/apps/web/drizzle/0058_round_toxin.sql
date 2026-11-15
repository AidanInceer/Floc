CREATE TABLE `analytics_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`surface` text NOT NULL,
	`route` text NOT NULL,
	`props` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_event_name_at_idx` ON `analytics_event` (`name`,`created_at`);