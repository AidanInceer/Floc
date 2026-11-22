CREATE TABLE `wish_list_item_vote` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `wish_list_item`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wish_list_item_vote_item_idx` ON `wish_list_item_vote` (`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `wish_list_item_vote_one_idx` ON `wish_list_item_vote` (`item_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `style_in_group_ideas` integer DEFAULT true NOT NULL;