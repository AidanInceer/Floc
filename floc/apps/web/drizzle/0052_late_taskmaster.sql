ALTER TABLE `user_profile` ADD `friend_tag` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_friend_tag_unique` ON `user_profile` (`friend_tag`);