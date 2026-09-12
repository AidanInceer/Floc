ALTER TABLE `document` ADD `day_id` integer REFERENCES day(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `document` ADD `day_event_id` integer REFERENCES day_event(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `document_day_idx` ON `document` (`day_id`);--> statement-breakpoint
CREATE INDEX `document_day_event_idx` ON `document` (`day_event_id`);
