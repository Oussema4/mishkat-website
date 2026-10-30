CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `admins` ADD `role` text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
-- The oldest active account becomes the owner (it is the one created from INITIAL_ADMIN_* or the CLI).
UPDATE `admins` SET `role` = 'owner' WHERE `id` = (SELECT min(`id`) FROM `admins` WHERE `active` = 1);