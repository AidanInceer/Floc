CREATE TABLE `packing_kit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `packing_kit_owner_idx` ON `packing_kit` (`owner_id`);--> statement-breakpoint
CREATE TABLE `packing_kit_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`packing_kit_id` integer NOT NULL,
	`label` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`packing_kit_id`) REFERENCES `packing_kit`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `packing_kit_item_kit_idx` ON `packing_kit_item` (`packing_kit_id`);--> statement-breakpoint
ALTER TABLE `packing_line` ADD `kit_name` text;