-- The shop's WhatsApp number becomes 58 459 266 (stored as JSON text, international form).
INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES ('whatsapp', '"21658459266"', unixepoch())
ON CONFLICT(`key`) DO UPDATE SET `value` = excluded.`value`, `updated_at` = excluded.`updated_at`;
