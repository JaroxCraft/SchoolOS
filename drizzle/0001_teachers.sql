CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`email` text
);
--> statement-breakpoint
ALTER TABLE `subjects` ADD `teacher_id` integer REFERENCES teachers(id);--> statement-breakpoint
-- Move the former free-text teacher names into the new teachers table
INSERT INTO `teachers` (`name`, `abbreviation`) SELECT DISTINCT `teacher`, '' FROM `subjects` WHERE `teacher` IS NOT NULL AND `teacher` != '';--> statement-breakpoint
UPDATE `subjects` SET `teacher_id` = (SELECT `id` FROM `teachers` WHERE `teachers`.`name` = `subjects`.`teacher`) WHERE `teacher` IS NOT NULL;
