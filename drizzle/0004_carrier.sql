ALTER TABLE `orders` ADD `carrier` text;--> statement-breakpoint
-- Orders already handed to Maystro keep that choice.
UPDATE `orders` SET `carrier` = 'maystro' WHERE `maystro_state` = 'sent';
