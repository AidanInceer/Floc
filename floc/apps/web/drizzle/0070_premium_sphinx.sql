ALTER TABLE `friendship` ADD `requested_by` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
UPDATE `friendship` SET `requested_by` = `user_id` WHERE `origin` <> 'co_trip';--> statement-breakpoint
CREATE UNIQUE INDEX `friendship_one_per_pair_idx` ON `friendship` (min(`user_id`, `friend_id`), max(`user_id`, `friend_id`));--> statement-breakpoint
CREATE TRIGGER `friendship_no_self_insert` BEFORE INSERT ON `friendship` WHEN NEW.`user_id` = NEW.`friend_id` BEGIN SELECT RAISE(ABORT, 'A friendship needs two people'); END;--> statement-breakpoint
CREATE TRIGGER `friendship_no_self_update` BEFORE UPDATE OF `user_id`, `friend_id` ON `friendship` WHEN NEW.`user_id` = NEW.`friend_id` BEGIN SELECT RAISE(ABORT, 'A friendship needs two people'); END;
