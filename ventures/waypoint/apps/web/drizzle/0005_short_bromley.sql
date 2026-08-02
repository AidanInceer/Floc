-- Ticket 115. `note_reaction_one_idx` becomes UNIQUE so the reaction toggle can
-- upsert onto the existing row instead of read-modify-writing a second one.
--
-- Any database that has been live has had the racy toggle in it, so it may
-- already hold the duplicates the index is about to forbid — and CREATE UNIQUE
-- INDEX fails outright on those, taking the deploy with it. So they are
-- collapsed first, keeping the earliest **live** row of each group where one
-- exists and the earliest row otherwise: a duplicate means somebody reacted
-- twice, so "reacted" is the honest state to keep.
DELETE FROM `note_reaction`
WHERE `id` NOT IN (
  SELECT COALESCE(
    (
      SELECT `keep`.`id` FROM `note_reaction` AS `keep`
      WHERE `keep`.`note_id` = `r`.`note_id`
        AND `keep`.`user_id` = `r`.`user_id`
        AND `keep`.`kind` = `r`.`kind`
        AND `keep`.`deleted_at` IS NULL
      ORDER BY `keep`.`id`
      LIMIT 1
    ),
    MIN(`r`.`id`)
  )
  FROM `note_reaction` AS `r`
  GROUP BY `r`.`note_id`, `r`.`user_id`, `r`.`kind`
);--> statement-breakpoint
DROP INDEX `note_reaction_one_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `note_reaction_one_idx` ON `note_reaction` (`note_id`,`user_id`,`kind`);
