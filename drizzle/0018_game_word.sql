-- The shop says "game" (لعبة) instead of "box" (علبة) in the product texts, e.g. the
-- "how many cards in the box?" question. Image descriptions (alt) still describe the box in the photo.
UPDATE `products` SET
  `tagline` = replace(replace(replace(`tagline`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `short_description` = replace(replace(replace(`short_description`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `description` = replace(replace(replace(`description`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `contents` = replace(replace(replace(`contents`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `how_to_play` = replace(replace(replace(`how_to_play`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `benefits` = replace(replace(replace(`benefits`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان'),
  `faq` = replace(replace(replace(`faq`, 'العلبة', 'اللعبة'), 'علبتين', 'لعبتين'), 'علبتان', 'لعبتان');
