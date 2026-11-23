CREATE TABLE `user_notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`notify_push` integer DEFAULT true NOT NULL,
	`notify_email` integer DEFAULT true NOT NULL,
	`notify_reminders` integer DEFAULT true NOT NULL,
	`notify_next_trip` integer DEFAULT true NOT NULL,
	`marketing_email_consent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_privacy` (
	`user_id` text PRIMARY KEY NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`visibility_vibe_tags` text DEFAULT 'trip_members' NOT NULL,
	`visibility_travel_map` text DEFAULT 'trip_members' NOT NULL,
	`visibility_friends` text DEFAULT 'friends' NOT NULL,
	`visibility_saved` text DEFAULT 'private' NOT NULL,
	`past_trips_show` text DEFAULT 'all' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_travel_style` (
	`user_id` text PRIMARY KEY NOT NULL,
	`home_airport` text,
	`travel_cabin` text,
	`travel_stay` text,
	`travel_pace` text,
	`style_in_group_ideas` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `user_privacy` (`user_id`, `is_private`, `visibility_vibe_tags`, `visibility_travel_map`, `visibility_friends`, `visibility_saved`, `past_trips_show`) SELECT `user_id`, `is_private`, `visibility_vibe_tags`, `visibility_travel_map`, `visibility_friends`, `visibility_saved`, `past_trips_show` FROM `user_profile`;
--> statement-breakpoint
INSERT INTO `user_notification_settings` (`user_id`, `notify_push`, `notify_email`, `notify_reminders`, `notify_next_trip`, `marketing_email_consent_at`) SELECT `user_id`, `notify_push`, `notify_email`, `notify_reminders`, `notify_next_trip`, `marketing_email_consent_at` FROM `user_profile`;
--> statement-breakpoint
INSERT INTO `user_travel_style` (`user_id`, `home_airport`, `travel_cabin`, `travel_stay`, `travel_pace`, `style_in_group_ideas`) SELECT `user_id`, `home_airport`, `travel_cabin`, `travel_stay`, `travel_pace`, `style_in_group_ideas` FROM `user_profile`;
