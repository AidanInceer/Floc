DROP TABLE `idea`;--> statement-breakpoint
DROP TABLE `idea_vote`;--> statement-breakpoint
ALTER TABLE `user_profile` DROP COLUMN `notify_votes`;--> statement-breakpoint
DELETE FROM `note_reaction` WHERE `note_id` IN (SELECT `id` FROM `note` WHERE `scope` = 'idea');--> statement-breakpoint
DELETE FROM `note` WHERE `scope` = 'idea';--> statement-breakpoint
UPDATE `nudge` SET `tab` = 'notes' WHERE `tab` = 'ideas';
