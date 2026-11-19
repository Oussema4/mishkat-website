CREATE TABLE `checkout_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`phone` text NOT NULL,
	`governorate` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`locale` text DEFAULT 'ar' NOT NULL,
	`order_id` integer,
	`dismissed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkout_leads_key_unique` ON `checkout_leads` (`key`);--> statement-breakpoint
CREATE INDEX `checkout_leads_phone_idx` ON `checkout_leads` (`phone`);--> statement-breakpoint
CREATE INDEX `checkout_leads_created_idx` ON `checkout_leads` (`created_at`);