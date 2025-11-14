-- Migration to transfer data from production database
-- This migration assumes the old tables exist (from naago_prod.sql)
-- Run this after importing naago_prod.sql into your database
-- 
-- IMPORTANT: Before running this migration, you need to rename the old tables
-- to have _old suffix. You can do this manually or use the following commands:
-- 
-- RENAME TABLE `favorites` TO `favorites_old`;
-- RENAME TABLE `maintenance_data` TO `maintenance_data_old`;
-- RENAME TABLE `notice_data` TO `notice_data_old`;
-- RENAME TABLE `status_data` TO `status_data_old`;
-- RENAME TABLE `topic_data` TO `topic_data_old`;
-- RENAME TABLE `update_data` TO `update_data_old`;
-- RENAME TABLE `profile_pages` TO `profile_pages_old`;
-- RENAME TABLE `setups` TO `setups_old`;
-- RENAME TABLE `themes` TO `themes_old`;
-- RENAME TABLE `verifications` TO `verifications_old`;
--
-- Note: Skip renaming if tables don't exist yet (first time migration)

-- Migrate favorites (remove id, convert user_id to varchar, add timestamps)
INSERT INTO `favorites` (`user_id`, `character_id`, `character_name`, `server`, `created_at`, `updated_at`)
SELECT 
    CAST(`user_id` AS CHAR) AS `user_id`,
    `character_id`,
    `character_name`,
    `server`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `favorites_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `favorites` f 
    WHERE f.`user_id` = CAST(`favorites_old`.`user_id` AS CHAR) 
    AND f.`character_id` = `favorites_old`.`character_id`
);

-- Migrate maintenance_data (rename columns: m_from -> start_date, m_to -> end_date, details -> description, add timestamps)
INSERT INTO `maintenance_data` (`id`, `tag`, `title`, `date`, `link`, `description`, `start_date`, `end_date`, `created_at`, `updated_at`)
SELECT 
    `id`,
    `tag`,
    `title`,
    `date`,
    `link`,
    `details` AS `description`,
    `m_from` AS `start_date`,
    `m_to` AS `end_date`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `maintenance_data_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `maintenance_data` m 
    WHERE m.`id` = `maintenance_data_old`.`id`
);

-- Migrate notice_data (rename details to description, add timestamps)
INSERT INTO `notice_data` (`id`, `tag`, `title`, `date`, `link`, `description`, `created_at`, `updated_at`)
SELECT 
    `id`,
    `tag`,
    `title`,
    `date`,
    `link`,
    `details` AS `description`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `notice_data_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `notice_data` n 
    WHERE n.`id` = `notice_data_old`.`id`
);

-- Migrate status_data (rename details to description, add timestamps)
INSERT INTO `status_data` (`id`, `tag`, `title`, `date`, `link`, `description`, `created_at`, `updated_at`)
SELECT 
    `id`,
    `tag`,
    `title`,
    `date`,
    `link`,
    `details` AS `description`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `status_data_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `status_data` s 
    WHERE s.`id` = `status_data_old`.`id`
);

-- Migrate topic_data (add missing columns with empty values, add timestamps)
INSERT INTO `topic_data` (`id`, `title`, `link`, `date`, `banner`, `description`, `created_at`, `updated_at`)
SELECT 
    `id`,
    `title`,
    '' AS `link`,
    `date`,
    '' AS `banner`,
    '' AS `description`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `topic_data_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `topic_data` t 
    WHERE t.`id` = `topic_data_old`.`id`
);

-- Migrate update_data (rename details to description, add timestamps)
INSERT INTO `update_data` (`id`, `title`, `date`, `link`, `description`, `created_at`, `updated_at`)
SELECT 
    `id`,
    `title`,
    `date`,
    `link`,
    `details` AS `description`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `update_data_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `update_data` u 
    WHERE u.`id` = `update_data_old`.`id`
);

-- Migrate profile_pages (add timestamps, convert user_id to varchar)
INSERT INTO `profile_pages` (`user_id`, `profile_page`, `sub_profile_page`, `created_at`, `updated_at`)
SELECT 
    CAST(`user_id` AS CHAR) AS `user_id`,
    `profile_page`,
    `sub_profile_page`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `profile_pages_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `profile_pages` p 
    WHERE p.`user_id` = CAST(`profile_pages_old`.`user_id` AS CHAR)
);

-- Migrate setups (filter out fashion_report, add timestamps, convert IDs to varchar)
INSERT INTO `setups` (`guild_id`, `type`, `channel_id`, `created_at`, `updated_at`)
SELECT 
    CAST(`guild_id` AS CHAR) AS `guild_id`,
    `type`,
    CAST(`channel_id` AS CHAR) AS `channel_id`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `setups_old`
WHERE `type` != 'fashion_report'
AND NOT EXISTS (
    SELECT 1 FROM `setups` s 
    WHERE s.`guild_id` = CAST(`setups_old`.`guild_id` AS CHAR)
    AND s.`type` = `setups_old`.`type`
);

-- Migrate themes (add character_id from verifications, add timestamps, convert user_id to varchar)
-- Only migrate themes that have a corresponding verification (character_id is required)
INSERT INTO `themes` (`user_id`, `character_id`, `theme`, `created_at`, `updated_at`)
SELECT 
    CAST(t.`user_id` AS CHAR) AS `user_id`,
    v.`character_id`,
    t.`theme`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `themes_old` t
INNER JOIN `verifications_old` v ON t.`user_id` = v.`user_id`
WHERE v.`character_id` IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM `themes` th 
    WHERE th.`user_id` = CAST(t.`user_id` AS CHAR)
);

-- Migrate verifications (add timestamps, convert user_id to varchar)
INSERT INTO `verifications` (`user_id`, `character_id`, `verification_code`, `is_verified`, `created_at`, `updated_at`)
SELECT 
    CAST(`user_id` AS CHAR) AS `user_id`,
    `character_id`,
    `verification_code`,
    `is_verified`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `verifications_old`
WHERE NOT EXISTS (
    SELECT 1 FROM `verifications` ver 
    WHERE ver.`user_id` = CAST(`verifications_old`.`user_id` AS CHAR)
);

