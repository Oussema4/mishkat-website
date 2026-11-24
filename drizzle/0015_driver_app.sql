CREATE TABLE `driver_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`admin_name` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `driver_ledger_driver_idx` ON `driver_ledger` (`driver_id`);--> statement-breakpoint
ALTER TABLE `drivers` ADD `access_code_hash` text;--> statement-breakpoint
ALTER TABLE `drivers` ADD `session_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_access_code_hash_unique` ON `drivers` (`access_code_hash`);--> statement-breakpoint
ALTER TABLE `orders` ADD `no_answer_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `no_answer_at` integer;