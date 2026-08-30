ALTER TABLE `user_profile` ADD `diet_flags` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `dietary_notes` text;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `share_dietary` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `visibility_picture` text DEFAULT 'trip_members' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `visibility_vibe_tags` text DEFAULT 'trip_members' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `past_trips_show` text DEFAULT 'all' NOT NULL;