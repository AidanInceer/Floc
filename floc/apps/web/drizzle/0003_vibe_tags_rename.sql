-- Ticket 46: vibe_preferences was free text; vibe_tags is seed-only, picked
-- from VIBE_TAGS. A rename, not a drop-and-add — the values already stored
-- are kept, and readVibeTags() drops any that aren't in the seed list.
ALTER TABLE `user_profile` RENAME COLUMN `vibe_preferences` TO `vibe_tags`;