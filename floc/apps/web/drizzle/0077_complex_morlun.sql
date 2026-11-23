CREATE TABLE `notification_delivery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notification_id` integer NOT NULL,
	`channel` text NOT NULL,
	`claimed_at` integer,
	`sent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_delivery_one_idx` ON `notification_delivery` (`notification_id`,`channel`);--> statement-breakpoint
CREATE INDEX `notification_delivery_waiting_idx` ON `notification_delivery` (`channel`,`last_modified_at`) WHERE sent_at IS NULL;--> statement-breakpoint
CREATE INDEX `notification_delivery_sent_idx` ON `notification_delivery` (`channel`,`sent_at`) WHERE sent_at IS NOT NULL;--> statement-breakpoint
INSERT OR IGNORE INTO `notification_delivery` (`notification_id`, `channel`, `claimed_at`, `sent_at`, `created_at`, `last_modified_at`) SELECT `n`.`id`, 'push', `n`.`push_claimed_at`, `n`.`pushed_at`, `n`.`created_at`, `a`.`last_modified_at` FROM `notification` AS `n` INNER JOIN `activity` AS `a` ON `a`.`id` = `n`.`activity_id` WHERE `n`.`pushed_at` IS NOT NULL OR (`n`.`loud` = 1 AND `a`.`last_modified_at` >= unixepoch() - 31 * 86400);--> statement-breakpoint
INSERT OR IGNORE INTO `notification_delivery` (`notification_id`, `channel`, `claimed_at`, `sent_at`, `created_at`, `last_modified_at`) SELECT `n`.`id`, 'email', `n`.`email_claimed_at`, `n`.`emailed_at`, `n`.`created_at`, `a`.`last_modified_at` FROM `notification` AS `n` INNER JOIN `activity` AS `a` ON `a`.`id` = `n`.`activity_id` WHERE `n`.`emailed_at` IS NOT NULL OR (`n`.`loud` = 1 AND `a`.`last_modified_at` >= unixepoch() - 31 * 86400);