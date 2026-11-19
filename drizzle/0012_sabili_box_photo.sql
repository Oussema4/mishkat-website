-- The box photo becomes the new straightened shot (shown as its cutout on the product page), and the
-- last two playing photos (café, Israfil card) go.
UPDATE `product_images` SET `url` = '/images/products/sabili-box-v2.webp'
WHERE `url` = '/images/products/sabili-box.webp' AND `product_id` = (SELECT `id` FROM `products` WHERE `slug` = 'sabili');--> statement-breakpoint
DELETE FROM `product_images`
WHERE `url` IN ('/images/products/sabili-cafe.webp', '/images/products/sabili-israfil-card.webp') AND `product_id` = (SELECT `id` FROM `products` WHERE `slug` = 'sabili');
