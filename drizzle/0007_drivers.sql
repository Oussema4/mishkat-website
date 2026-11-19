CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `driver_id` integer REFERENCES drivers(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `driver_assigned_at` integer;--> statement-breakpoint
-- The shop's two freelance delivery people (more can be added in the dashboard).
INSERT INTO `drivers` (`name`) VALUES ('عزيز'), ('حمزة');
