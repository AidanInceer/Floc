ALTER TABLE `packing_line` ADD `owner_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `packing_line` ADD `quantity` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `packing_line` ADD `packed_at` integer;--> statement-breakpoint
CREATE INDEX `packing_line_owner_idx` ON `packing_line` (`trip_id`,`owner_id`);--> statement-breakpoint
ALTER TABLE `trip_membership` ADD `pack_tier` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `pack_tier` text DEFAULT 'balanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `pack_auto_generate` integer DEFAULT true NOT NULL;