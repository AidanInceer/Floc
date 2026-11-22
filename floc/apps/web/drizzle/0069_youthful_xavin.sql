ALTER TABLE `idea` ADD `category` text;--> statement-breakpoint
ALTER TABLE `idea` ADD `day_event_id` integer REFERENCES day_event(id) ON DELETE SET NULL;