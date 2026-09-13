UPDATE `user_profile` SET `notify_email` = (`notify_invites` OR `notify_money` OR `notify_nudges`);--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_invites`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_money`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_nudges`;