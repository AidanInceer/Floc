CREATE TABLE `terms_acceptance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`version` text NOT NULL,
	`accepted_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `terms_acceptance_user_version_idx` ON `terms_acceptance` (`user_id`,`version`);