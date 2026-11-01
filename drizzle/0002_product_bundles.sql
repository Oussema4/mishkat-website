ALTER TABLE `products` ADD `bundles` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
-- Sabili back to its regular price (59 TND, no struck-through price) with quantity offers: 2 for 100, 3 for 144.
UPDATE `products` SET `price` = 59000, `compare_at_price` = NULL, `bundles` = '[{"quantity":2,"price":100000},{"quantity":3,"price":144000}]', `updated_at` = unixepoch() WHERE `slug` = 'sabili';
