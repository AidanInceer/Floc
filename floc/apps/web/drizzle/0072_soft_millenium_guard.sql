DROP INDEX `user_profile_friend_code_unique`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `signup_channel`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `pack_auto_generate`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `friend_code`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `map_prompt_at`;--> statement-breakpoint
ALTER TABLE `trip_membership` DROP COLUMN `pack_generated_at`;