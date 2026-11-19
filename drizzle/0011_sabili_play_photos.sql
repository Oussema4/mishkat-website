-- Five photos of Sabili being played. The spread-out cards on the café table becomes the first picture.
INSERT INTO `product_images` (`product_id`, `url`, `alt`, `sort_order`)
SELECT `p`.`id`, `v`.`url`, `v`.`alt`, `v`.`sort_order`
FROM `products` `p`
JOIN (
  SELECT '/images/products/sabili-play-table.webp' AS `url`, 'بطاقات سبيلي الملوّنة وأصنافها وورقة القواعد مفرودة على طاولة' AS `alt`, 5 AS `sort_order`
  UNION ALL SELECT '/images/products/sabili-zakat-card.webp', 'بطاقة سؤال من سبيلي على نصاب زكاة المال، والجواب في أسفلها', 50
  UNION ALL SELECT '/images/products/sabili-box-open.webp', 'علبة سبيلي محلولة: ورقة الترحيب والبطاقات مرتّبة في خاناتها', 60
  UNION ALL SELECT '/images/products/sabili-cafe.webp', 'لعب سبيلي على طاولة في قهوة', 70
  UNION ALL SELECT '/images/products/sabili-israfil-card.webp', 'بطاقة سؤال عن الملك الموكّل بالنفخ في الصور أثناء اللعب', 80
) `v`
WHERE `p`.`slug` = 'sabili'
  AND NOT EXISTS (SELECT 1 FROM `product_images` `pi` WHERE `pi`.`url` = `v`.`url`);
