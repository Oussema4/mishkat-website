CREATE TABLE `blocked_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`order_id` integer,
	`admin_name` text DEFAULT '' NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_customers_kind_value_idx` ON `blocked_customers` (`kind`,`value`);--> statement-breakpoint
ALTER TABLE `orders` ADD `ip_hash` text;--> statement-breakpoint
CREATE INDEX `orders_ip_hash_idx` ON `orders` (`ip_hash`);