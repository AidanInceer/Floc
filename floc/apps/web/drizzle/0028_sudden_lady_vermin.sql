ALTER TABLE `subscription` ADD `store_transaction_id` text;--> statement-breakpoint
ALTER TABLE `subscription` ADD `store_product_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_store_idx` ON `subscription` (`store_transaction_id`);