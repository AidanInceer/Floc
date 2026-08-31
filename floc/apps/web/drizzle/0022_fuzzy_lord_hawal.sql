CREATE TABLE `fx_rate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`base` text NOT NULL,
	`currency` text NOT NULL,
	`rate` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fx_rate_quote_idx` ON `fx_rate` (`date`,`base`,`currency`);--> statement-breakpoint
CREATE INDEX `fx_rate_base_date_idx` ON `fx_rate` (`base`,`date`);--> statement-breakpoint
ALTER TABLE `settlement` ADD `clears_amount_minor` integer;--> statement-breakpoint
ALTER TABLE `settlement` ADD `clears_currency` text;--> statement-breakpoint
ALTER TABLE `settlement` ADD `fx_rate` real;--> statement-breakpoint
ALTER TABLE `settlement` ADD `fx_rate_date` text;