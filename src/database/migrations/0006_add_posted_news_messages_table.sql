CREATE TABLE IF NOT EXISTS `posted_news_messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `news_type` varchar(20) NOT NULL,
  `news_id` int NOT NULL,
  `guild_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  `message_id` varchar(255) NOT NULL,
  `is_v2` tinyint NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `posted_news_messages_id` PRIMARY KEY(`id`),
  INDEX `idx_posted_news_lookup` (`news_type`, `news_id`),
  INDEX `idx_posted_news_guild` (`guild_id`)
);
