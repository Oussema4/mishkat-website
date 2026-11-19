-- The shop started with 1125 Sabili boxes. Stock = 1125 minus every box still taken by an order
-- (cancelled orders already gave theirs back: stock_restored = 1).
UPDATE `products`
SET `stock` = max(0, 1125 - coalesce((
  SELECT sum(`oi`.`quantity`)
  FROM `order_items` `oi`
  JOIN `orders` `o` ON `o`.`id` = `oi`.`order_id`
  WHERE `oi`.`product_id` = `products`.`id` AND `o`.`stock_restored` = 0
), 0))
WHERE `slug` = 'sabili';
