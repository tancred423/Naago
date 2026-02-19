CREATE TABLE `event_reminder_setups` (
  `guild_id` varchar(255) NOT NULL,
  `enabled` int NOT NULL DEFAULT 1,
  `channel_id` varchar(255),
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `event_reminder_setups_guild_id` PRIMARY KEY(`guild_id`)
);
--> statement-breakpoint
ALTER TABLE `topic_data` ADD COLUMN `event_reminder_sent` int NOT NULL DEFAULT 0;
