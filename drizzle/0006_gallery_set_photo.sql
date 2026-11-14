-- Sabili's gallery: the two rules-sheet photos go, and the photo of the whole set (box, rules sheet
-- and every card category) becomes the second picture, right after the current first one.
DELETE FROM `product_images` WHERE `url` IN ('/images/products/sabili-rules-1.webp', '/images/products/sabili-rules-2.webp') AND `product_id` = (SELECT `id` FROM `products` WHERE `slug` = 'sabili');--> statement-breakpoint
UPDATE `product_images` SET `sort_order` = `sort_order` * 10 + 10 WHERE `product_id` = (SELECT `id` FROM `products` WHERE `slug` = 'sabili');--> statement-breakpoint
INSERT INTO `product_images` (`product_id`, `url`, `alt`, `sort_order`)
SELECT `id`, '/images/products/sabili-set.webp', 'علبة سبيلي مع ورقة القواعد وبطاقات كل الأصناف', 15 FROM `products`
WHERE `slug` = 'sabili' AND NOT EXISTS (SELECT 1 FROM `product_images` WHERE `url` = '/images/products/sabili-set.webp');
