-- The shop no longer states an age for Sabili: the age badge, the "(from 9)" in a benefit and the
-- "what age?" question go, in Arabic, French and English.
UPDATE `products` SET `age_range` = '' WHERE `slug` = 'sabili';
--> statement-breakpoint
UPDATE `products` SET `benefits` = replace(`benefits`, ' (من 9 سنوات)', '') WHERE `slug` = 'sabili';
--> statement-breakpoint
UPDATE `products` SET `faq` = (
  SELECT json_group_array(json(j.value)) FROM json_each(`products`.`faq`) AS j
  WHERE json_extract(j.value, '$.q') NOT LIKE '%عمر%'
) WHERE `slug` = 'sabili' AND json_valid(`faq`);
--> statement-breakpoint
UPDATE `products` SET `translations` = replace(replace(`translations`, ' (dès 9 ans)', ''), ' (from age 9)', '') WHERE `slug` = 'sabili';
--> statement-breakpoint
UPDATE `products` SET `translations` = json_set(`translations`, '$.fr.ageRange', '')
WHERE `slug` = 'sabili' AND json_valid(`translations`) AND json_type(`translations`, '$.fr') = 'object';
--> statement-breakpoint
UPDATE `products` SET `translations` = json_set(`translations`, '$.en.ageRange', '')
WHERE `slug` = 'sabili' AND json_valid(`translations`) AND json_type(`translations`, '$.en') = 'object';
--> statement-breakpoint
UPDATE `products` SET `translations` = json_set(`translations`, '$.fr.faq', json((
  SELECT json_group_array(json(j.value)) FROM json_each(`products`.`translations`, '$.fr.faq') AS j
  WHERE json_extract(j.value, '$.q') NOT LIKE '%âge%'
))) WHERE `slug` = 'sabili' AND json_valid(`translations`) AND json_type(`translations`, '$.fr.faq') = 'array';
--> statement-breakpoint
UPDATE `products` SET `translations` = json_set(`translations`, '$.en.faq', json((
  SELECT json_group_array(json(j.value)) FROM json_each(`products`.`translations`, '$.en.faq') AS j
  WHERE json_extract(j.value, '$.q') NOT LIKE '%What age%'
))) WHERE `slug` = 'sabili' AND json_valid(`translations`) AND json_type(`translations`, '$.en.faq') = 'array';
