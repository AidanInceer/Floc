DROP INDEX `comment_reaction_comment_idx`;--> statement-breakpoint
DROP INDEX `document_trip_idx`;--> statement-breakpoint
DROP INDEX `idea_vote_idea_idx`;--> statement-breakpoint
CREATE INDEX `idea_vote_user_idx` ON `idea_vote` (`user_id`);--> statement-breakpoint
DROP INDEX `notification_user_idx`;--> statement-breakpoint
DROP INDEX `packing_line_trip_idx`;--> statement-breakpoint
DROP INDEX `user_country_mark_user_idx`;--> statement-breakpoint
DROP INDEX `wish_list_item_vote_item_idx`;--> statement-breakpoint
CREATE INDEX `availability_user_idx` ON `availability` (`user_id`);--> statement-breakpoint
CREATE INDEX `trip_start_date_idx` ON `trip` (`start_date`);--> statement-breakpoint
CREATE INDEX `trip_end_date_idx` ON `trip` (`end_date`);--> statement-breakpoint
CREATE INDEX `user_guest_created_idx` ON `user` (`created_at`) WHERE is_anonymous = 1;