ALTER TABLE `user_profile` ADD `friend_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_friend_code_unique` ON `user_profile` (`friend_code`);