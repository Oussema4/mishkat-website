ALTER TABLE `orders` ADD `commune_id` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_state` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_order_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_tracking` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_status` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_error` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `maystro_synced_at` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `maystro_product_id` text;