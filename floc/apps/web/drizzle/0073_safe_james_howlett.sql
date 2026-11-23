CREATE TABLE `billing_customer` (
	`user_id` text PRIMARY KEY NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customer_stripe_customer_id_unique` ON `billing_customer` (`stripe_customer_id`);--> statement-breakpoint
INSERT OR IGNORE INTO `billing_customer` (`user_id`, `stripe_customer_id`) SELECT `user_id`, `stripe_customer_id` FROM `subscription` AS `s` WHERE `stripe_customer_id` IS NOT NULL AND `id` = (SELECT MAX(`id`) FROM `subscription` WHERE `user_id` = `s`.`user_id` AND `stripe_customer_id` IS NOT NULL);