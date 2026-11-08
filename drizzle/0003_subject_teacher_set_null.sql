-- 0001 added teacher_id with ALTER TABLE, which cannot set "on delete set null", so the subjects
-- of a deleted teacher had to be cleared by hand. SQLite can only change a foreign key by
-- rebuilding the table. Runs with foreign keys off (src/db/migrate.ts): otherwise dropping the old
-- table would delete the lessons and grades of every subject.
CREATE TABLE `__new_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`color` text NOT NULL,
	`teacher_id` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_subjects` (`id`, `name`, `abbreviation`, `color`, `teacher_id`) SELECT `id`, `name`, `abbreviation`, `color`, `teacher_id` FROM `subjects`;
--> statement-breakpoint
DROP TABLE `subjects`;
--> statement-breakpoint
ALTER TABLE `__new_subjects` RENAME TO `subjects`;
