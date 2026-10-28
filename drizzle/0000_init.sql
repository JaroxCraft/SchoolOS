CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`period_id` integer,
	`subject_id` integer,
	`completed` integer DEFAULT false NOT NULL,
	`study_start` text,
	`topic` text,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`value` real NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`subject_id` integer NOT NULL,
	`entry_id` integer,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekday` integer NOT NULL,
	`period_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`room` text,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `semesters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`exam_lead_days` integer DEFAULT 7 NOT NULL,
	`presentation_lead_days` integer DEFAULT 7 NOT NULL,
	`submission_lead_days` integer DEFAULT 3 NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`second_reminder_time` text DEFAULT '18:00' NOT NULL,
	`no_lesson_summary_time` text DEFAULT '10:00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`color` text NOT NULL,
	`teacher` text
);
